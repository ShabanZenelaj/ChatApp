import {Request} from "express"
import {Socket} from "socket.io";

export interface ExtendedRequest extends Request {
    user?: TokenContent
}

export interface ExtendedSocket extends Socket {
    user?: TokenContent
}

interface BaseMessage {
    socket_id: string;
    message: string;
    timestamp: number;
    username: string; // Sender's username
}
export interface RoomMessage extends BaseMessage {
    room: string;
    type: "room";
}
export interface DMMessage extends BaseMessage {
    from: string;
    to: string;
    type: "dm";
}

export interface RoomsMessage {
    socket_id: string;
    to: string;
    conversations: { name: string; type: string }[];
}

export interface TokenContent { username: string; sessionVersion: string }