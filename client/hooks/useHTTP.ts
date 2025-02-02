import axios from 'axios';
import {useNavigate} from "react-router-dom";
import {useUser} from "../contexts/UserContext.tsx";

export const useHTTP = () => {

    const axiosInstance = axios.create();
    const navigate = useNavigate();
    const {deleteUserStorage} = useUser();

    // Function to refresh token
    const refreshToken = async (error: Error) => {
        try {
            // Retrieve the refresh token from localStorage
            const refreshToken = localStorage.getItem("refreshToken");

            if(!refreshToken) {
                throw error;
            }

            // Send request to backend to refresh the access token
            const response = await axios.post(`${process.env.VITE_SERVER_URL}/api/auth/token`, { refreshToken });

            // Store the new access token in localStorage
            localStorage.setItem('accessToken', response.data.accessToken);
            // Return the new access token
            return response.data.accessToken;
        } catch (error) {
            deleteUserStorage()
            navigate('/login')
            throw error;
        }
    };

    // Axios interceptor to attach access token to requests
    axiosInstance.interceptors.request.use(
        async (config) => {
            // Retrieve the access token from localStorage
            const accessToken = localStorage.getItem("accessToken");

            if (accessToken) {
                // Attach the access token to the request headers
                config.headers.Authorization = `Bearer ${accessToken}`;
            }
            return config;
        },
        (error) => {
            return Promise.reject(error);
        }
    );

    // Axios interceptor to handle token expiration
    axiosInstance.interceptors.response.use(
        (response) => {
            return response;
        },
        async (error) => {
            const originalRequest = error.config;

            // If the error is due to token expiration (status code 401)
            if (error.response.status === 401 && !originalRequest._retry) {
                originalRequest._retry = true;

                try {
                    // Refresh the access token
                    const accessToken = await refreshToken(error);

                    // Retry the original request with the new access token
                    originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                    return axiosInstance(originalRequest);
                } catch (refreshError) {
                    // Handle refresh token error
                    return Promise.reject(refreshError);
                }
            }

            return Promise.reject(error);
        }
    );

    return axiosInstance;
}