import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import * as axiosModule from '../lib/axios';
import toast from 'react-hot-toast';
import { io } from 'socket.io-client';
import { BASE_API_URL } from '../constants';

const axiosInstance = axiosModule.axiosInstance;
export const useAuthStore = create(
    persist(
        (set, get) => ({
            authUser: null,
            authToken: null,
            refreshToken: null,
            isSigningUp: false,
            isLoggingIn: false,
            isUpdatingProfile: false,
            isCheckingAuth: true,
            onlineUsers: [],
            socket: null,

            refreshAccessToken: async () => {
                const { authUser } = get();
                if (!authUser) return;
                try {
                    const refreshToken = get().refreshToken;
                    if (!refreshToken) return;

                    const res = await axiosInstance.post('/auth/refresh', {
                        token: refreshToken,
                    });

                    set({
                        authToken: res.data.token,
                        refreshToken: res.data.refreshToken,
                        authUser: res.data,
                    });
                    get().connectSocket();
                } catch (error) {
                    console.log(
                        'Error in refreshToken:',
                        error?.response?.status,
                        error?.response?.data || error.message,
                    );
                } finally {
                    set({ isCheckingAuth: false });
                }
            },

            signup: async (data) => {
                set({ isSigningUp: true });
                try {
                    const res = await axiosInstance.post('/auth/signup', data);
                    set({
                        authUser: res.data,
                        authToken: res.data.token,
                        refreshToken: res.data.refreshToken,
                    });
                    toast.success('Account created successfully');
                    get().connectSocket();
                } catch (error) {
                    toast.error(error.response.data.message);
                } finally {
                    set({ isSigningUp: false });
                }
            },

            login: async (data) => {
                set({ isLoggingIn: true });
                try {
                    const res = await axiosInstance.post('/auth/login', data);
                    set({
                        authUser: res.data,
                        authToken: res.data.token,
                        refreshToken: res.data.refreshToken,
                    });
                    toast.success('Logged in successfully');

                    get().connectSocket();
                } catch (error) {
                    toast.error(error.response.data.message);
                } finally {
                    set({ isLoggingIn: false });
                }
            },

            logout: async () => {
                try {
                    await axiosInstance.post('/auth/logout');
                    set({
                        authUser: null,
                        authToken: null,
                        refreshToken: null,
                    });
                    toast.success('Logged out successfully');
                    get().disconnectSocket();
                } catch (error) {
                    toast.error(error.response.data.message);
                }
            },

            updateProfile: async (data) => {
                set({ isUpdatingProfile: true });
                try {
                    const res = await axiosInstance.put(
                        '/auth/update-profile',
                        data,
                    );
                    set({ authUser: res.data });
                    toast.success('Profile updated successfully');
                } catch (error) {
                    console.log('error in update profile:', error);
                    toast.error(error.response.data.message);
                } finally {
                    set({ isUpdatingProfile: false });
                }
            },

            connectSocket: () => {
                const { authUser } = get();
                if (!authUser || get().socket?.connected) return;

                const socket = io(BASE_API_URL, {
                    query: {
                        userId: authUser._id,
                    },
                });
                socket.connect();

                set({ socket: socket });

                socket.on('getOnlineUsers', (userIds) => {
                    set({ onlineUsers: userIds });
                });
            },
            disconnectSocket: () => {
                if (get().socket?.connected) get().socket.disconnect();
            },
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({
                authUser: state.authUser,
                authToken: state.authToken,
                refreshToken: state.refreshToken,
            }),
        },
    ),
);
