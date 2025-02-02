import express from "express";
import {checkDM} from "../controllers/messageControllers";

const router = express.Router();

// User Registration
router.get("/dm", checkDM);

export default router;