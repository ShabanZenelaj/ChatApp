import {NextFunction, Request, Response} from "express";
import Redis from "ioredis";

const redisClient = new Redis(process.env.REDIS_URL as string);

export const checkDM = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    const {username} = req.query;

    try {const user = await redisClient.hgetall(`user:${username}`);
        if (!user || Object.keys(user).length === 0) return res.status(404).json({message: "User not found"});

        return res.status(200).json({message: "User found"});
    } catch (e) {
        next(e);
    }
}