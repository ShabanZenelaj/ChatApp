import {ChangeEvent, FormEvent, useState} from "react";
import {useNavigate} from "react-router-dom";
import {Input} from "../components/Input.tsx";
import {Button} from "../components/Button.tsx";
import {useHTTP} from "../../hooks/useHTTP.ts";
import {useUser} from "../../contexts/UserContext.tsx";
import toast from "react-hot-toast";

const Register = () => {
    const [data, setData] = useState<{
        username: string,
        password: string,
    }>({
        username: "",
        password: ""
    });

    const axios = useHTTP();
    const navigate = useNavigate();
    const {setUserStorage} = useUser();

    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
        const {name, value} = event.target;
        setData({...data, [name]: value});
    }

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        axios.post(`${process.env.VITE_SERVER_URL}/api/auth/register`, data)
            .then((res) => {
                const {accessToken, refreshToken} = res.data;
                localStorage.setItem("accessToken", accessToken);
                localStorage.setItem("refreshToken", refreshToken);
                setUserStorage({username: data.username})
                toast.success("Registration successful!")
                navigate("/");
            })
            .catch((err) => {
                switch (err.response.status) {
                    case 400:
                        toast.error(err.response.data.message)
                        break;
                    case 409:
                        toast.error("User already exists!")
                        break;
                    default:
                        toast.error("An error occurred!")
                        break;
                }
            })
    };

    return (
        <div style={styles.container}>
            <h1 style={styles.title}>Register to ChatApp</h1>
            <form onSubmit={handleSubmit}>
                <div style={styles.inputContainer}>
                    <Input
                        placeholder="Enter your username"
                        value={data.username}
                        name="username"
                        onChange={handleChange}
                    />
                    <Input
                        placeholder="Enter your password"
                        value={data.password}
                        name="password"
                        type="password"
                        onChange={handleChange}
                    />
                    <Button type="submit">Register now</Button>
                    <a style={styles.loginRedirect} href="/login">Go to login</a>
                </div>
            </form>
        </div>
    );
};

const styles = {
    container: {
        display: "flex",
        flexDirection: "column" as const,
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
    },
    title: {
        fontSize: "24px",
        marginBottom: "20px",
    },
    inputContainer: {
        display: "flex",
        flexDirection: "column" as const,
        gap: "10px",
        width: "300px",
    },
    loginRedirect: {
        textAlign: "center" as const,
        fontSize: "12px",
        opacity: 0.4
    }
};

export default Register;