import express from "express";
import {checkDM} from "../controllers/messageControllers";
import authenticate from "../middlewares/authenticate";

const router = express.Router();

// Check if user exists for DM
router.get("/dm", authenticate, checkDM);

export default router;