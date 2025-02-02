import express from "express";
import http from "http";
import {Server, Socket} from "socket.io";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";

// Routes import
import AuthRoutes from "./routes/authRoutes"
import MessageRoutes from "./routes/messageRoutes"

// Middlewares import
import errorHandler from "./middlewares/errorHandler";

// Classes import
import SocketService from "./services/SocketService";

// Utils import
import {initializeRedisSub} from "./utils/redisClient";
import {authenticateSocket} from "./middlewares/authenticateSocket";
import {ExtendedSocket} from "./utils/definitions";

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: ["http://localhost:5173", "http://localhost:4173", "http://localhost:80", "http://localhost"], credentials: true },
});

app.use(express.json());
app.use(cors({
    origin: ["http://localhost:5173", "http://localhost:4173", "http://localhost:80", "http://localhost"],
    credentials: true,
}));
app.use(helmet());
app.use(errorHandler)

initializeRedisSub(io)

io.use(authenticateSocket)

io.on("connection", (socket: ExtendedSocket) => {
    const socketService = new SocketService(socket)
    // Socket room for the user
    if(socket.user?.username) socket.join(socket.user?.username)

    // Send rooms on initialization
    socketService.getConversations()

    // Every 15 minutes the JWT token expires so the connection is always valid (We refresh every 14 minutes for a 1-minute overhead).
    const refreshInterval = setInterval(() => {
        // This will tell the client to refresh its token.
        socketService.refreshToken();
    }, 14 * 60 * 1000);

    socket.on("getConversations", socketService.getConversations.bind(socketService));

    socket.on("joinRoom", socketService.joinRoom.bind(socketService));

    socket.on("joinFriend", socketService.joinFriend.bind(socketService));

    socket.on("message", socketService.message.bind(socketService));

    socket.on("dm", socketService.dm.bind(socketService));

    socket.on("typing", socketService.typing.bind(socketService));

    socket.on("disconnect", () => {
        clearInterval(refreshInterval);
    });
});

// API Routes
app.use('/api/auth', AuthRoutes)
app.use('/api/messages', MessageRoutes)

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));