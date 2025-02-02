import {NextFunction, Request, Response} from "express";
import bcrypt from "bcrypt";
import {generateRefreshToken, generateToken} from "../utils/auth";
import {validateUser} from "../utils/validations";
import {v4 as uuidv4} from "uuid";
import jwt from "jsonwebtoken";
import {TokenContent} from "../utils/definitions";
import {redisClient} from "../utils/redisClient";

export const registerUser = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    const {username, password} = req.body;

    try {
        const {error} = validateUser({username, password});
        if(error) return res.status(400).json({message: error.details[0].message})

        const user = await redisClient.hgetall(`user:${username}`);
        if (!user) return res.status(409).json({message: "User already exists"});

        const hashedPassword = await bcrypt.hash(password, 10);
        await redisClient.hset(`user:${username}`, {
            password: hashedPassword,
            createdAt: Date.now(),
            friends: []
        });

        const sessionVersion = uuidv4();
        await redisClient.set(`session:${username}`, sessionVersion, "EX", 604800);

        const accessToken = generateToken(username, sessionVersion);
        const refreshToken = generateRefreshToken(username, sessionVersion);

        return res.status(201).json({accessToken, refreshToken});
    } catch (e) {
        next(e);
    }
}

export const loginUser = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    const {username, password} = req.body;

    try {
        const {error} = validateUser({username, password});
        if(error) return res.status(400).json({message: error.details[0].message})

        const user = await redisClient.hgetall(`user:${username}`);
        if (!user || Object.keys(user).length === 0) return res.status(401).json({message: "Invalid credentials"});

        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) return res.status(401).json({message: "Invalid credentials"});

        const sessionVersion = uuidv4();
        await redisClient.set(`session:${username}`, sessionVersion, "EX", 604800);

        const accessToken = generateToken(username, sessionVersion);
        const refreshToken = generateRefreshToken(username, sessionVersion);

        return res.status(200).json({accessToken, refreshToken});
    } catch (e) {
        next(e);
    }
}

export const refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    const { refreshToken } = req.body;

    try {
        if (!refreshToken) return res.status(401).json({message: "No token sent."});

        const {username, sessionVersion} = jwt.verify(refreshToken, process.env.REFRESH_SECRET as string) as TokenContent;

        const user = await redisClient.get(`session:${username}`);
        if (!user) return res.status(401).json({message: "Invalid credentials"});

        const accessToken = generateToken(username, sessionVersion);

        return res.status(200).json({accessToken});
    } catch (error) {
        next(error);
    }
}