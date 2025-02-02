import {createContext, Dispatch, ReactNode, SetStateAction, useContext, useState} from "react";

export type UserType = {
    username: string;
}

type UserContextType = {
    user: UserType | null,
    setUser: Dispatch<SetStateAction<UserType | null>>;
    setUserStorage: (user: UserType) => void;
    deleteUserStorage: () => void;
}

export const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({children}: { children: ReactNode}) => {
    const [user, setUser] = useState<UserType | null>(() => JSON.parse(localStorage.getItem("user") || "null"));

    const setUserStorage = (user: UserType) => {
        setUser(user);
        localStorage.setItem("user", JSON.stringify(user));
    }

    const deleteUserStorage = () => {
        setUser(null);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
    }

    return (
        <UserContext.Provider value={{user, setUser, setUserStorage, deleteUserStorage}}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
}