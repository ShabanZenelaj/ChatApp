import {useUser} from "../../contexts/UserContext.tsx";
import {useSocket} from "../../hooks/useSocket.ts";

const ChooseSomeone = () => {
    const {deleteUserStorage} = useUser();
    const {socket} = useSocket();

    const handleLogout = () => {
        deleteUserStorage();
        socket?.disconnect();
    }

    return (
        <div style={{position: "relative", display: "flex", justifyContent: "center", alignItems: "center", height: "100%"}}>
            <button
                style={{
                    position: "absolute",
                    top: 0,
                    right: 0,
                    width: "10%",
                    height: "57px",
                    padding: "0 10px",
                    borderRadius: "10px",
                    border: "1px solid rgba(0, 0, 0, 0.1)",
                    background: "white",
                    marginBottom: "10px"
                }}
                onClick={handleLogout}
            >
                Logout
            </button>
            <p style={{textAlign: "center"}}>Choose someone to message</p>
        </div>
    );
};

export default ChooseSomeone;