import { useEffect, useMemo, useState } from "react";
import { io, Socket } from "socket.io-client";
import axios from "axios";
import {useUser} from "../contexts/UserContext.tsx";
import {useNavigate} from "react-router-dom";
import toast from "react-hot-toast";

export const refreshTokenSocket = async () => {try {
        // Retrieve the refresh token from localStorage
        const refreshToken = localStorage.getItem("refreshToken");

        if (!refreshToken) {
            throw new Error("No refresh token found");
        }

        // Send request to your backend to refresh the access token
        const response = await axios.post(`${process.env.VITE_SERVER_URL}/api/auth/token`, {refreshToken});

        // Store the new access token in SecureStore
        localStorage.setItem('accessToken', response.data.accessToken);
        // Return the new access token
        return response.data.accessToken;
    } catch (error) {
        throw error;
    }
}

export const useSocket = () => {
    const [socket, setSocket] = useState<Socket | null>(null);

    const {deleteUserStorage} = useUser();
    const navigate = useNavigate();

    // useMemo to create the socket instance only once
    const socketInstance = useMemo(() => {
        const accessToken = localStorage.getItem("accessToken");

        // Pass the token through the auth payload in the handshake
        return io(process.env.VITE_SERVER_URL, {
            auth: { accessToken },
            autoConnect: false, // Controllable connection
        });
    }, []);

    useEffect(() => {
        // Connect the socket
        socketInstance.connect();
        setSocket(socketInstance);

        socketInstance.on("connect_error", async (err: any) => {
            if (err.message && err.message.includes("Token expired")) {
                try {
                    const newToken = await refreshTokenSocket();
                    socketInstance.auth = { accessToken: newToken };
                    socketInstance.disconnect();
                    socketInstance.connect();
                } catch (e) {
                    deleteUserStorage()
                    toast.error("Your session expired")
                    navigate('/login')
                }
            } else {
                deleteUserStorage()
                toast.error("Your session expired")
                navigate('/login')
            }
        })

        socketInstance.on("refreshToken", async () => {
            try {
                const newToken = await refreshTokenSocket();
                socketInstance.auth = { accessToken: newToken };
                socketInstance.disconnect();
                socketInstance.connect();
            } catch (e) {
                deleteUserStorage()
                toast.error("Your session expired")
                navigate('/login')
            }
        })

        // Cleanup on unmount: disconnect the socket to avoid memory leaks
        return () => {
            socketInstance.disconnect();
            socketInstance.off('connect_error');
            socketInstance.off('refreshToken');
        };
    }, []);

    /**
     * A helper function to subscribe to a socket event.
     * It automatically cleans up the event listener when the component unmounts or when the event changes.
     */
    const subscribe = <T = any>(event: string, callback: (data: T) => void) => {
        if (!socketInstance) return;

        socketInstance.on(event, callback);
        // Return an unsubscribe function for convenience
        return () => {
            socketInstance.off(event, callback);
        };
    };

    /**
     * A helper function to emit events.
     */
    const emit = (event: string, data?: any) => {
        socketInstance.emit(event, data);
    };

    return { socket, subscribe, emit };
};