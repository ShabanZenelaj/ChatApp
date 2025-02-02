import {useEffect, useRef, useState} from "react";
import {useParams} from "react-router-dom";
import {Card, CardContent} from "../components/Card.tsx";
import {Input} from "../components/Input.tsx";
import {Button} from "../components/Button.tsx";
import {useSocket} from "../../hooks/useSocket.ts";
import {useUser} from "../../contexts/UserContext.tsx";
import toast from "react-hot-toast";

const ChatRoom = () => {
    const { room, friend } = useParams<{ room: string; friend: string }>();

    const [messages, setMessages] = useState<{ username: string; message: string }[]>([]);
    const [newMessageCount, setNewMessageCount] = useState<number>(0);
    const [input, setInput] = useState<string>("");
    const [typing, setTyping] = useState<string[]>([]);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [maxPages, setMaxPages] = useState<number>(10);
    const [loadingMore, setLoadingMore] = useState<boolean>(false);

    const {user, deleteUserStorage} = useUser();

    // A ref to store the timeout ID for clearing the typing indicator.
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    // A ref to help scrolling messages.
    const containerRef = useRef<HTMLDivElement>(null);

    const bottomDiv = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if(currentPage === 1){
            bottomDiv.current?.scrollIntoView()
        }
    }, [messages, typing]);

    const {socket, emit, subscribe} = useSocket();

    useEffect(() => {
        const unsubscribeDM = subscribe<any>("dm", (message) => {
            if(!friend) return;
            setTyping(prevTyping => prevTyping.filter(prevUser => prevUser !== message.username));
            setNewMessageCount(prevState => prevState + 1)
            setMessages((prev) => [...prev, message]);
            if(currentPage > 1){
                toast.custom(
                    <div style={{
                        background: "white",
                        cursor: "pointer",
                        borderRadius: "15px",
                        padding: "5px 10px",
                        border: "1px solid rgba(0,0,0,0.1)"
                    }}
                         onClick={() => {bottomDiv.current?.scrollIntoView()}}
                    >
                        Show new messages
                    </div>, {duration: 2000});
            }
        });
        const unsubscribeMessage = subscribe<any>("message", (message) => {
            if(!room) return;
            setTyping(prevTyping => prevTyping.filter(prevUser => prevUser !== message.username));
            setNewMessageCount(prevState => prevState + 1)
            setMessages((prev) => [...prev, message]);
            if(currentPage > 1){
                toast.custom(
                    <div style={{
                        background: "white",
                        cursor: "pointer",
                        borderRadius: "15px",
                        padding: "5px 10px",
                        border: "1px solid rgba(0,0,0,0.1)"
                    }}
                         onClick={() => {bottomDiv.current?.scrollIntoView()}}
                    >
                        Show new messages
                    </div>, {duration: 2000});
            }
        });
        const unsubscribePrevMessages = subscribe<any>("previousMessages", (messages) => {
            setMaxPages(Math.ceil(messages.totalMessages / 20))
            setMessages((prev) => [...messages.messages, ...prev]);
        });
        const unsubscribeTyping = subscribe<any>("typing", (typing) => {
            if((room && typing.to !== room) || (friend && typing.to !== user?.username)) return;
            setTyping(prevTyping => {
                // If the username already exists in the array, return the current typing users.
                if (prevTyping.includes(typing.username) || typing.username === user?.username) {
                    return prevTyping;
                }
                // Otherwise, add the new username to the array.
                return [...prevTyping, typing.username];
            });

            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }

            typingTimeoutRef.current = setTimeout(() => {
                setTyping([]);
            }, 2000);
        });

        // Cleanup subscriptions when component unmounts
        return () => {
            unsubscribeMessage && unsubscribeMessage();
            unsubscribePrevMessages && unsubscribePrevMessages();
            unsubscribeTyping && unsubscribeTyping();
            unsubscribeDM && unsubscribeDM();
        };
    }, [emit, subscribe]);

    useEffect(() => {
        setCurrentPage(1);
        setMaxPages(10);
        setNewMessageCount(0)
        if(room) emit("joinRoom", {room, page: 1, limit: 20, skip: newMessageCount})
        if(friend) emit("joinFriend", {friend, page: 1, limit: 20, skip: newMessageCount})
        setMessages([])
        setTyping([])
    }, [room, friend]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleScroll = () => {
            if (container.scrollTop <= 20 && !loadingMore && currentPage < maxPages) {
                setLoadingMore(true);

                loadOlderMessages();

                container.scrollTop = 500;

                // Add delay to make sure messages are added
                setTimeout(() => {
                    setLoadingMore(false);
                }, 100);
            }
        };

        container.addEventListener("scroll", handleScroll);
        return () => {
            container.removeEventListener("scroll", handleScroll);
        };
    }, [room, friend, loadingMore, currentPage, maxPages, newMessageCount]);

    const loadOlderMessages = () => {
        if(currentPage >= maxPages) return;
        setLoadingMore(true);

        if(room) emit("joinRoom", {room, page: currentPage + 1, limit: 20, skip: newMessageCount})
        if(friend) emit("joinFriend", {friend, page: currentPage + 1, limit: 20, skip: newMessageCount})

        setCurrentPage(prevState => prevState + 1);
        setLoadingMore(false);
    };

    const sendMessage = () => {
        if (input.trim()) {
            if(room){
                emit("message", { room, message: input });
            } else if(friend) {
                emit("dm", { to: friend, content: input });
            }
            setInput("");
        }
    };

    const handleChange = (e: any) => {
        if(room){
            emit("typing", room);
        } else if(friend) {
            emit("typing", friend);
        }
        setInput(e.target.value)
    }

    const handleLogout = () => {
        deleteUserStorage();
        socket?.disconnect();
    }

    return (
        <div style={styles.container}>
            <div style={styles.topArea}>
                <Card style={styles.titleBox}>
                    <h2 style={styles.title}>{!!room ? `Room: ${room}` : !!friend ? `Friend: ${friend}` : ""}</h2>
                </Card>
                <button style={styles.logoutButton} onClick={handleLogout}>Logout</button>
            </div>
            <Card ref={containerRef} style={styles.chatBox}>
                <CardContent style={{padding: 0}}>
                <div style={styles.messageList}>
                        {messages.map((msg, index) => (
                            <div
                                key={index}
                                style={{
                                    ...styles.message,
                                    alignSelf: msg.username === user?.username
                                        ? "end"
                                        : "start",
                                    alignItems: msg.username === user?.username
                                        ? "end"
                                        : "start"
                                }}
                            >
                                <strong>{msg.username}: </strong>
                                {msg.message}
                            </div>
                        ))}
                    </div>
                </CardContent>
                <div ref={bottomDiv}/>
                {
                    !!typing.length &&
                    <p>
                        {
                            typing.length === 1 ?
                                `${typing[0]} is`
                                : typing.length > 1 && typing.length <= 3
                                    ? typing.join(", ") + " are "
                                    : "Several people are"} typing...
                    </p>
                }
            </Card>
            <div style={styles.inputContainer}>
                <Input
                    placeholder="Type your message..."
                    value={input}
                    onChange={handleChange}
                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                />
                <Button onClick={sendMessage}>Send</Button>
            </div>
        </div>
    );
};

const styles = {
    container: {
        display: "flex",
        flexDirection: "column" as const,
        alignItems: "center",
        height: "calc(100vh - 20px)",
    },
    topArea: {
        display: "flex",
        width: "100%",
        gap: "8px"
    },
    titleBox: {
        width: "100%",
        height: "fit-content",
        padding: "10px 16px",
        marginBottom: "10px",
    },
    title: {
        fontSize: "20px",
    },
    logoutButton: {
        width: "10%",
        padding: "0 10px",
        borderRadius: "10px",
        border: "1px solid rgba(0, 0, 0, 0.1)",
        background: "white",
        marginBottom: "10px"
    },
    chatBox: {
        position: "relative" as const,
        width: "100%",
        height: "100%",
        overflowY: "auto" as const,
        padding: "10px",
        marginBottom: "10px",
    },
    messageList: {
        display: "flex",
        flexDirection: "column" as const,
        gap: "8px",
    },
    message: {
        maxWidth: "70%",
        display: "flex",
        flexDirection: "column" as const,
        gap: "5px",
        background: "#f3f3f3",
        padding: "10px 15px",
        borderRadius: "5px",
    },
    inputContainer: {
        display: "flex",
        gap: "8px",
        width: "100%",
    },
};

export default ChatRoom;