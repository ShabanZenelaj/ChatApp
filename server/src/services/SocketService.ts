import {redisClient} from "../utils/redisClient";
import Redis from "ioredis";
import {DMMessage, ExtendedSocket, RoomMessage} from "../utils/definitions";

class SocketService {
    private readonly socket: ExtendedSocket;
    private pub: Redis;

    constructor(socket: ExtendedSocket) {
        this.socket = socket;
        this.pub = redisClient.duplicate();
    }

    private async retrieveRooms(): Promise<{ name: string }[]> {
        let cursor = "0";
        const rooms: { name: string }[] = [];

        do {
            const result = await redisClient.scan(cursor, "MATCH", "chat:*", "COUNT", 100);
            cursor = result[0];
            const keys = result[1];
            rooms.push(...keys.map(key => {
                return {
                    name: key.replace("chat:", ""),
                }
            }));
        } while (cursor !== "0");

        return rooms;
    }

    private getCanonicalDMKey(userA: string, userB: string): string {
        const [first, second] = [userA, userB].sort();
        return `dm:${first}:${second}`;
    }

    private async updateConversation(conversationKey: string) {
        await redisClient.zadd("conversations:lastActivity", Date.now(), conversationKey);
    }

    private async getConversationsForUser(username: string): Promise<{ name: string, type: string }[]> {
        // Retrieve all conversation keys sorted by recent activity (most recent first)
        const allConversations = await redisClient.zrevrange("conversations:lastActivity", 0, -1);
        return allConversations.filter((key) => {
            if (key.startsWith("dm:")) {
                const parts = key.split(":");
                return parts.slice(1).includes(username);
            }
            // Include all public rooms
            return key.startsWith("room:");
        }).map((key) => {
            if (key.startsWith("dm:")) {
                return {
                    name: key.replace("dm:", "").replace(username, "").replace(":", ""),
                    type: "dm"
                }
            } else {
                return {
                    name: key.replace("room:", ""),
                    type: "room"
                }
            }
        });
    }

    async getConversations(): Promise<void> {
        if(!this.socket.user?.username) throw new Error("User not set on socket")
        try {
            const conversations = await this.getConversationsForUser(this.socket.user?.username);

            // Publish conversations to the "conversations" channel
            await this.pub.publish("conversations", JSON.stringify({
                to: this.socket.id,
                conversations
            }));
        } catch (error) {
            console.error("Error fetching rooms:", error);
        }
    }

    async broadcastConversations(): Promise<void> {
        if(!this.socket.user?.username) throw new Error("User not set on socket")
        try {
            // Publish conversations to the "conversations" channel
            await this.pub.publish("refreshConversations", JSON.stringify({message: "No data"}));
        } catch (error) {
            console.error("Error fetching rooms:", error);
        }
    }

    async refreshDMConversations(friend: string): Promise<void> {
        if(!this.socket.user?.username) throw new Error("User not set on socket")
        try {
            const conversations = await this.getConversationsForUser(this.socket.user?.username);
            const friendConversations = await this.getConversationsForUser(friend);

            // Publish conversations to the sender
            await this.pub.publish("conversations", JSON.stringify({
                conversations,
                to: this.socket.user?.username
            }));
            // Publish conversations to the receiver
            await this.pub.publish("conversations", JSON.stringify({
                conversations: friendConversations,
                to: friend
            }));
        } catch (error) {
            console.error("Error fetching rooms:", error);
        }
    }

    async joinRoom({room, page = 1, limit = 10, skip}: {room: string, page: number, limit: number, skip: number}) {
        this.socket.join(room);
        try {
            const totalMessages = await redisClient.llen(`chat:room:${room}`);

            let end = totalMessages - ((page - 1) * limit) - 1;
            let start = totalMessages - (page * limit);

            if(skip){
                end = end - skip
                start = start - skip
            }

            const startMax = Math.max(start, 0);

            // Retrieve the messages for this page.
            const messages = await redisClient.lrange(`chat:room:${room}`, startMax, end);
            const previousMessages = messages.map((msg) => JSON.parse(msg)) as RoomMessage[];

            // Publish previousMessages to the "previousMessages" channel
            await this.pub.publish("previousMessages", JSON.stringify({
                socket_id: this.socket.id,
                messages: previousMessages,
                page,
                limit,
                totalMessages
            }));
        } catch (error) {
            console.error("Error fetching previous messages:", error);
        }
    }

    async joinFriend({friend, page = 1, limit = 10, skip}: {friend: string, page: number, limit: number, skip: number}) {
        if(!this.socket.user?.username) return new Error("User not set on socket")
        try {
            const dmKey = this.getCanonicalDMKey(this.socket.user?.username, friend);

            const totalMessages = await redisClient.llen(`chat:${dmKey}`);

            let end = totalMessages - ((page - 1) * limit) - 1;
            let start = totalMessages - (page * limit);

            if(skip){
                end = end - skip
                start = start - skip
            }

            const startMax = Math.max(start, 0);

            // Fetch the last 10 messages from Redis for the given room
            const messages = await redisClient.lrange(`chat:${dmKey}`, startMax, end);
            const previousMessages = messages.map((msg) => JSON.parse(msg)) as RoomMessage[];

            // Publish previousMessages to the "previousMessages" channel
            await this.pub.publish("previousMessages", JSON.stringify({
                socket_id: this.socket.id,
                messages: previousMessages,
                page,
                limit,
                totalMessages
            }));
        } catch (error) {
            console.error("Error fetching previous messages:", error);
        }
    }

    async message({room, message}: { room: string; message: any }) {
        if(!this.socket.user?.username) throw new Error("Invalid user");

        const roomMessage: RoomMessage = {
            socket_id: this.socket.id,
            room,
            username: this.socket.user?.username,
            message,
            timestamp: Date.now(),
            type: "room",
        };

        // Store the message in the specific room
        await redisClient.rpush(`chat:room:${room}`, JSON.stringify(roomMessage));
        await redisClient.ltrim(`chat:room:${room}`, -500, -1);

        // Publish the message on the chat channel
        await this.pub.publish("chat", JSON.stringify({ room, username: roomMessage.username, message }));

        // Update conversation last activity.
        await this.updateConversation(`room:${room}`);
        await this.broadcastConversations()
    }

    async dm({to, content}: { to: string; content: any }) {
        if(!this.socket.user?.username) throw new Error("Invalid user");

        const dmKey = this.getCanonicalDMKey(this.socket.user?.username, to);
        const dmMessage: DMMessage = {
            socket_id: this.socket.id,
            from: this.socket.user?.username,
            to,
            username: this.socket.user?.username, // sender
            message: content,
            timestamp: Date.now(),
            type: "dm",
        };

        // Store DM in Redis list.
        await redisClient.rpush(`chat:${dmKey}`, JSON.stringify(dmMessage));

        // Publish DM on the "dm" channel to both sender and receiver.
        await this.pub.publish("dm", JSON.stringify({...dmMessage, to: [dmMessage.to, this.socket.user?.username]}));

        // Update conversation last activity.
        await this.updateConversation(dmKey);
        await this.refreshDMConversations(to);
    }

    async refreshToken() {
        // Publish message to Redis channel
        await this.pub.publish("refreshToken", JSON.stringify({socket_id: this.socket.id}));
    }

    async typing(to: string) {
        // Publish message to Redis channel
        await this.pub.publish("typing", JSON.stringify({user: this.socket.user?.username, to}));
    }
}

export default SocketService;