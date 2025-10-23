import axios from 'axios';
import { BASE_API_URL } from '../constants';

export const axiosInstance = axios.create({
    baseURL: BASE_API_URL,
    withCredentials: true,
});

// Attach Authorization header from localStorage if available
axiosInstance.interceptors.request.use(
    (config) => {
        try {
            const token = localStorage.getItem('authToken');
            if (token) {
                config.headers = config.headers || {};
                config.headers.Authorization = `Bearer ${token}`;
            }
        } catch (err) {
            // localStorage might not be available in some environments
            console.warn('Unable to read authToken from localStorage', err);
        }
        return config;
    },
    (error) => Promise.reject(error),
);

// Log 4xx/5xx responses for easier debugging
axiosInstance.interceptors.response.use(
    (res) => res,
    (error) => {
        if (error && error.response) {
            console.error('Axios response error:', {
                url: error.config?.url,
                status: error.response.status,
                data: error.response.data,
            });
        } else {
            console.error('Axios error without response:', error);
        }
        return Promise.reject(error);
    },
);
