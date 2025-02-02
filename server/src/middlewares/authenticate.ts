import {ExtendedRequest, TokenContent} from "../utils/definitions";
import {NextFunction, Response} from "express";
import jwt from "jsonwebtoken";
import {redisClient} from "../utils/redisClient";

const authenticate = async (req: ExtendedRequest, res: Response, next: NextFunction): Promise<any> => {
    const token = req.header("Authorization")?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as TokenContent;

        const sessionVersion = await redisClient.get(`session:${decoded.username}`);
        if (!sessionVersion || sessionVersion !== String(decoded.sessionVersion)) {
            return res.status(401).json({ error: "Session expired, please log in again." });
        }

        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ error: "Invalid token" });
    }
};

export default authenticate;