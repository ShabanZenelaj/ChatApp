import jwt from "jsonwebtoken";
import {ExtendedSocket, TokenContent} from "../utils/definitions";
import {redisClient} from "../utils/redisClient";

export const authenticateSocket = async (socket: ExtendedSocket, next: any) => {
    try {
        const token = socket.handshake.auth.accessToken;

        if (!token) {
            return next(new Error('Unauthorized: No token provided'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as TokenContent;
        if (!decoded) throw new Error("Invalid token");

        const sessionVersion = await redisClient.get(`session:${decoded.username}`);
        if (!sessionVersion || sessionVersion !== String(decoded.sessionVersion)) {
            throw new Error("Invalid session");
        }

        socket.user = decoded;
        next();
    } catch (err: any) {
        if(err.message === "Invalid session"){
            return next(err)
        }
        next(new Error("Token expired"));
    }
};