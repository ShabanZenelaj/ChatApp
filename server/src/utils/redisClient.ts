import Redis from "ioredis";
import {RoomMessage, RoomsMessage} from "./definitions";
import {Server} from "socket.io";

export const redisClient = new Redis(process.env.REDIS_URL as string);

export const initializeRedisSub = (io: Server) => {
    const sub = redisClient.duplicate();

    // Subscribe to chat messages
    sub.subscribe("chat");
    sub.subscribe("previousMessages");
    sub.subscribe("conversations");
    sub.subscribe("refreshConversations");
    sub.subscribe("refreshToken");
    sub.subscribe("typing");
    sub.subscribe("dm");

    // Handle messages from Redis and broadcast them
    sub.on("message", (channel, message) => {
        const data = JSON.parse(message);
        switch (channel) {
            case "conversations":
                const {conversations, to}: RoomsMessage = data;
                if(to) {
                    io.to(to).emit("conversations", conversations);
                } else {
                    io.emit("conversations", conversations)
                }
                break;
            case "chat":
                const chatMessage: RoomMessage = data;
                io.to(chatMessage.room).emit("message", {username: chatMessage.username, message: chatMessage.message});
                break;
            case "previousMessages":
                io.to(data.socket_id).emit("previousMessages", {
                    messages: data.messages,
                    page: data.page,
                    limit: data.limit,
                    totalMessages: data.totalMessages
                });
                break;
            case "refreshConversations":
                io.emit("refreshConversations");
                break;
            case "refreshToken":
                io.to(data.socket_id).emit("refreshToken");
                break;
            case "typing":
                io.to(data.to).emit("typing", {username: data.user, to: data.to});
                break;
            case "dm":
                io.to(data.to).emit("dm", {
                    username: data.from,
                    message: data.message,
                    timestamp: data.timestamp
                });
                break;
            default:
                console.log(`Unknown subscriber channel: ${channel}`);
                break;
        }
    });
}