import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

export const generateToken = (username: string, sessionVersion: string): string => {
    return jwt.sign(
        { username, sessionVersion },
        process.env.JWT_SECRET as string,
        { expiresIn: "15m" }
    );
};

export const generateRefreshToken = (username: string, sessionVersion: string): string => {
    return jwt.sign(
        { username, sessionVersion },
        process.env.REFRESH_SECRET as string,
        { expiresIn: "7d" }
    );
};