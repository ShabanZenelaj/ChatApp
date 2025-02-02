import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:5000");

const Chat = ({ room }: { room: string }) => {
    const [messages, setMessages] = useState<{ user: string; message: string }[]>([]);
    const [input, setInput] = useState("");

    useEffect(() => {
        socket.emit("joinRoom", room);

        socket.on("message", (message) => {
            setMessages((prev) => [...prev, message]);
        });

        return () => {
            socket.off("message");
        };
    }, [room]);

    const sendMessage = () => {
        if (input.trim()) {
            socket.emit("message", { room, message: input });
            setInput("");
        }
    };

    return (
        <div className="p-4">
            <div className="border p-4 h-96 overflow-auto">
                {messages.map((msg, index) => (
                    <p key={index}><strong>{msg.user}:</strong> {msg.message}</p>
                ))}
            </div>
            <input
                className="border p-2 w-full"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Type a message..."
            />
        </div>
    );
};

export default Chat;