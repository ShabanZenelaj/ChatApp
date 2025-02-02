import {Card, CardContent} from "@/components/Card.tsx";
import {Outlet, useNavigate} from "react-router-dom";
import {useEffect, useState} from "react";
import {useSocket} from "../../hooks/useSocket.ts";
import Modal, {Styles} from 'react-modal';
import {Input} from "@/components/Input.tsx";
import {Button} from "@/components/Button.tsx";
import {useHTTP} from "../../hooks/useHTTP.ts";
import toast from "react-hot-toast";
import {useUser} from "../../contexts/UserContext.tsx";

const customStyles: Styles = {
    content: {
        width: "40%",
        top: '50%',
        left: '50%',
        right: 'auto',
        bottom: 'auto',
        marginRight: '-50%',
        transform: 'translate(-50%, -50%)',
        borderRadius: '10px',
    },
};

const RoomModal = ({open, closeModal}: { open: boolean, closeModal: () => void }) => {
    const [name, setName] = useState<string>("");

    const navigate = useNavigate();

    const handleCreateRoom = () => {
        navigate(`/room/${name}`);
        closeModal();
    }

    return (
        <Modal
            isOpen={open}
            onRequestClose={closeModal}
            contentLabel="Example Modal"
            style={customStyles}
        >
            <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px"}}>
                <h2>Create new room</h2>
                <button onClick={closeModal}>✕</button>
            </div>
            <p style={{marginBottom: "10px", opacity: 0.5, fontSize: "12px"}}>Conversation is started on the first message.</p>
            <div style={{
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                justifyContent: "space-between",
                alignItems: "center"
            }}>
                <Input
                    placeholder="Room name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleCreateRoom()}
                />
                <Button style={{width: "100%"}} onClick={handleCreateRoom}>Create</Button>
            </div>
        </Modal>
    )
}

const FriendModal = ({open, closeModal}: { open: boolean, closeModal: () => void }) => {
    const [name, setName] = useState<string>("");

    const axios = useHTTP();
    const navigate = useNavigate();

    const handleDMFriend = (e: any) => {
        e.preventDefault();
        axios.get(`${process.env.VITE_SERVER_URL}/api/messages/dm?username=${name}`)
            .then(() => {
                navigate(`/dm/${name}`);
                closeModal()
            }).catch((err) => {
            if (err.response.status === 404) {
                toast.error(`No user found with name ${name}`);
                return;
            }
            toast.error("An unknown error occurred. Please try again later.");
        })
    }

    return (
        <Modal
            isOpen={open}
            onRequestClose={closeModal}
            contentLabel="Example Modal"
            style={customStyles}
        >
            <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px"}}>
                <h2>DM friend</h2>
                <button onClick={closeModal}>✕</button>
            </div>
            <p style={{marginBottom: "10px", opacity: 0.5, fontSize: "12px"}}>Conversation is started on the first message.</p>
            <form onSubmit={handleDMFriend}>
                <div style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                    justifyContent: "space-between",
                    alignItems: "center"
                }}>
                    <Input
                        placeholder="Friend name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                    <Button style={{width: "100%"}} type="submit">Start DM-ing</Button>
                </div>
            </form>
        </Modal>
    )
}

const Home = () => {
    const [conversations, setConversations] = useState([]);
    const [showRoomModal, setShowRoomModal] = useState<boolean>(false);
    const [showFriendModal, setShowFriendModal] = useState<boolean>(false);

    const {emit, subscribe} = useSocket();

    const {user} = useUser();

    const navigate = useNavigate();

    useEffect(() => {
        const unsubscribeConversations = subscribe<any>("conversations", (conversations) => {
            setConversations(conversations);
        });

        const unsubscribeRefreshConversations = subscribe<any>("refreshConversations", () => {
            emit("getConversations")
        });

        // Cleanup subscriptions when component unmounts
        return () => {
            unsubscribeConversations && unsubscribeConversations();
            unsubscribeRefreshConversations && unsubscribeRefreshConversations();
        };
    }, [emit, subscribe]);

    const joinConversation = (name: string, type: string) => {
        navigate(`/${type}/${name}`);
    };

    return (
        <div style={styles.container}>
            <div style={styles.sidebar}>
                <div style={styles.roomActions}>
                    <h1>Welcome <strong>{user?.username}</strong></h1>
                    <CardContent style={styles.roomButtons}>
                        <button onClick={() => setShowRoomModal(true)} style={styles.roomButton}>New Room</button>
                        <button onClick={() => setShowFriendModal(true)} style={styles.roomButton}>New DM</button>
                    </CardContent>
                </div>
                <Card style={styles.chatBox}>
                    <CardContent style={styles.messageList}>
                        {conversations.map((conversation: { name: string, type: string }) => (
                            <div onClick={() => joinConversation(conversation.name, conversation.type)}
                                 key={`conversation:${conversation.name}`} style={styles.message}>
                                <strong>{conversation.name}</strong>
                                <p style={styles.type}>({conversation.type})</p>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
            <div style={styles.outlet}>
                <Outlet/>
            </div>
            <RoomModal open={showRoomModal} closeModal={() => setShowRoomModal(false)}/>
            <FriendModal open={showFriendModal} closeModal={() => setShowFriendModal(false)}/>
        </div>
    );
};

const styles = {
    container: {
        display: "flex",
        flexDirection: "row" as const,
        alignItems: "flex-start",
        justifyContent: "space-between",
        height: "calc(100vh - 20px)",
        margin: "10px",
        gap: "20px",
    },
    sidebar: {
        height: "100%",
        display: "flex",
        flexDirection: "column" as const,
        gap: "10px",
    },
    outlet: {
        width: "100%",
        height: "calc(100vh - 20px)",
    },
    roomActions: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        width: "400px",
        height: "57px"
    },
    roomButtons: {
        display: "flex",
        height: "100%",
        flexDirection: "row" as const,
        justifyContent: "flex-end",
        gap: "8px",
        padding: "0px",
    },
    roomButton: {
        height: "100%",
        padding: "10px",
        borderRadius: "10px",
        border: "1px solid rgba(0, 0, 0, 0.1)",
        background: "white"
    },
    chatBox: {
        width: "400px",
        height: "100%",
        overflowY: "auto" as const,
        padding: "10px",
    },
    messageList: {
        display: "flex",
        flexDirection: "column" as const,
        gap: "8px",
        padding: "0px",
    },
    message: {
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: "8px",
        background: "#f3f3f3",
        padding: "10px",
        width: "100%",
        borderRadius: "5px",
    },
    type: {
        opacity: 0.7,
        fontSize: "12px",
        fontWeight: "300"
    }
};

export default Home;