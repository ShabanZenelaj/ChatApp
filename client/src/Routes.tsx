import {BrowserRouter as Router, Navigate, Route, Routes as RouterRoutes} from "react-router-dom";
import Home from "./pages/Home.tsx";
import {useUser} from "../contexts/UserContext.tsx";
import Login from "./pages/Login.tsx";
import Register from "./pages/Register.tsx";
import ChatRoom from "@/pages/ChatRoom.tsx";
import ChooseSomeone from "@/components/ChooseSomeone.tsx";

const Routes = () => {
    const {user} = useUser();

    return (
        <Router>
            <RouterRoutes>
                {/* Redirect logged-in users away from login/register */}
                <Route path="/login" element={!user ? <Login /> : <Navigate to="/" replace />} />
                <Route path="/register" element={!user ? <Register /> : <Navigate to="/" replace />} />

                {/* Redirect non-logged-in users away from protected routes */}
                <Route element={user ? <Home /> : <Navigate to="/login" replace />}>
                    <Route path="/" element={<ChooseSomeone />} />
                    <Route path="/room/:room" element={<ChatRoom />} />
                    <Route path="/dm/:friend" element={<ChatRoom />} />
                </Route>

                {/* Catch-all route to handle 404s */}
                <Route path="*" element={<Navigate to={user ? "/" : "/login"} replace />} />
            </RouterRoutes>
        </Router>
    );
};

export default Routes;