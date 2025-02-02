import express from "express";
import {loginUser, refreshToken, registerUser} from "../controllers/authControllers";

const router = express.Router();

// User Registration
router.post("/register", registerUser);

// User Login
router.post("/login", loginUser);

// Refresh Token
router.post("/token", refreshToken);

export default router;