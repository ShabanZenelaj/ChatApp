import {UserProvider} from "../contexts/UserContext.tsx";
import Routes from "./Routes.tsx";
import {Toaster} from "react-hot-toast";

const App = () => {
    return (
        <UserProvider>
            <Routes />
            <Toaster position="bottom-center"/>
        </UserProvider>
    );
};

export default App;