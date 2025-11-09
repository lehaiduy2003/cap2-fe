import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import SockJS from 'sockjs-client';
import { over } from 'stompjs';
import SearchBar from '../components/other/SearchBar';
import axios from 'axios';
import { BASE_API_URL } from '../constants';

const ChatPage2 = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const connected = useRef(false);
    const connecting = useRef(false);
    const stompClientRef = useRef(null);
    const chatContainerRef = useRef(null);
    const hasInitialized = useRef(false);
    const reconnectTimerRef = useRef(null);
    const pendingMessagesRef = useRef([]);
    const processedLocationEmailRef = useRef(null);

    // Initialize state
    const [username, setUsername] = useState(() => {
        try {
            return localStorage.getItem('chat-username') || '';
        } catch (error) {
            console.error('Error reading username from localStorage:', error);
            return '';
        }
    });

    const [selectedUser, setSelectedUser] = useState(() => {
        try {
            const savedUser = localStorage.getItem('selectedUser');
            return savedUser
                ? JSON.parse(savedUser)
                : location.state?.selectedUser || null;
        } catch (error) {
            console.error(
                'Error reading selectedUser from localStorage:',
                error,
            );
            return location.state?.selectedUser || null;
        }
    });

    const [receiver, setReceiver] = useState(() => {
        try {
            return (
                localStorage.getItem('selectedUserEmail') ||
                location.state?.selectedUser?.email ||
                ''
            );
        } catch (error) {
            console.error(
                'Error reading selectedUserEmail from localStorage:',
                error,
            );
            return location.state?.selectedUser?.email || '';
        }
    });
    const [tab, setTab] = useState(
        localStorage.getItem('selectedUserEmail') ||
            location.state?.selectedUser?.email ||
            '',
    );
    const [message, setMessage] = useState('');
    const [privateChats, setPrivateChats] = useState(new Map());
    const [chatUsers, setChatUsers] = useState(new Map());

    const ensureUserIdentity = useCallback(async () => {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                console.error('No authentication token found');
                navigate('/login');
                return null;
            }

            const response = await axios.get(
                `${BASE_API_URL}/rentowner/get-profile`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: 'application/json',
                        'Content-Type': 'application/json',
                    },
                },
            );

            const profile = response.data?.data || response.data || {};
            const resolvedId =
                profile?.id ?? profile?.user?.id ?? profile?.userId ?? null;
            const resolvedEmail =
                profile?.email ??
                profile?.user?.email ??
                profile?.username ??
                null;
            const resolvedFullName =
                profile?.fullName ??
                profile?.user?.fullName ??
                profile?.name ??
                null;

            if (resolvedId) {
                localStorage.setItem('userId', resolvedId.toString());
            }

            if (resolvedEmail) {
                localStorage.setItem('chat-username', resolvedEmail);
                setUsername(resolvedEmail);
            }

            if (resolvedFullName) {
                localStorage.setItem('chat-fullname', resolvedFullName);
            }

            return resolvedEmail;
        } catch (error) {
            console.error('Error ensuring user identity:', error);
            return null;
        }
    }, [navigate]);

    // Scroll to bottom on new messages
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop =
                chatContainerRef.current.scrollHeight;
        }
    }, [privateChats, tab]);

    const fetchUserDetails = useCallback(
        async (email, fallbackId) => {
            if (!email) {
                return;
            }

            const existingUser = chatUsers.get(email);
            if (existingUser?.fullName && existingUser?.id) {
                return;
            }

            try {
                const token = localStorage.getItem('authToken');
                if (!token) {
                    navigate('/login');
                    return;
                }
                const response = await axios.get(
                    `${BASE_API_URL}/users/email/${encodeURIComponent(email)}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            Accept: 'application/json',
                            'Content-Type': 'application/json',
                        },
                    },
                );
                const userData = response.data?.data || response.data;
                if (userData) {
                    setChatUsers((prev) => {
                        const next = new Map(prev);
                        const merged = {
                            ...(next.get(email) || {}),
                            email,
                            id: userData.id ?? fallbackId,
                            fullName:
                                userData.fullName || userData.email || email,
                            avatarUrl: userData.avatarUrl,
                            job: userData.job,
                        };
                        next.set(email, merged);
                        return next;
                    });
                    setSelectedUser((prev) => {
                        if (prev && prev.email === email) {
                            const updated = {
                                ...prev,
                                fullName: userData.fullName || prev.fullName,
                                avatarUrl: userData.avatarUrl || prev.avatarUrl,
                                job: userData.job || prev.job,
                                id: prev.id ?? userData.id ?? fallbackId,
                            };
                            localStorage.setItem(
                                'selectedUser',
                                JSON.stringify(updated),
                            );
                            return updated;
                        }
                        return prev;
                    });
                }
            } catch (error) {
                console.warn('Unable to fetch user details for', email, error);
            }
        },
        [navigate, chatUsers],
    );

    const fetchChatHistory = useCallback(
        async (user1, user2) => {
            if (!user1 || !user2) {
                console.error('Invalid users for chat history:', user1, user2);
                return;
            }

            try {
                const token = localStorage.getItem('authToken');
                if (!token) {
                    console.error('No authentication token found');
                    navigate('/login');
                    return;
                }

                console.log('Fetching chat history for:', user1, user2);
                const response = await axios.get(
                    `${BASE_API_URL}/messages/api/messages/history/${encodeURIComponent(
                        user1,
                    )}/${encodeURIComponent(user2)}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            Accept: 'application/json',
                            'Content-Type': 'application/json',
                        },
                    },
                );
                console.log('Chat history response:', response.data);
                if (response.status === 200) {
                    const rawMessages = Array.isArray(response.data)
                        ? response.data
                        : Array.isArray(response.data?.data)
                          ? response.data.data
                          : [];
                    setPrivateChats((prevChats) => {
                        const filteredMessages = rawMessages.filter(
                            (msg) => msg.status === 'MESSAGE',
                        );
                        const updated = new Map(prevChats);
                        if (
                            filteredMessages.length > 0 ||
                            !updated.has(user2)
                        ) {
                            updated.set(user2, filteredMessages);
                            console.log('Updated privateChats:', updated);
                        }
                        return updated;
                    });
                    fetchUserDetails(user2);
                }
            } catch (error) {
                console.error(
                    'Error fetching chat history:',
                    error.response || error,
                );
                if (error.response?.status === 401) {
                    localStorage.removeItem('authToken');
                    navigate('/login');
                }
            }
        },
        [navigate, fetchUserDetails],
    );

    const handlePrivateMessage = useCallback(
        (user) => {
            if (!user || !user.email) {
                console.error('Invalid user data:', user);
                return;
            }

            console.log('Handling private message for user:', user);
            setSelectedUser(user);
            setReceiver(user.email);
            setTab(user.email);

            const activeUsername =
                localStorage.getItem('chat-username') || username || '';

            localStorage.setItem('selectedUser', JSON.stringify(user));
            localStorage.setItem('selectedUserEmail', user.email);

            setChatUsers((prev) => {
                const newMap = new Map(prev);
                newMap.set(user.email, user);
                return newMap;
            });

            let shouldFetchHistory = false;
            setPrivateChats((prevChats) => {
                if (prevChats.has(user.email)) {
                    return prevChats;
                }
                const updated = new Map(prevChats);
                updated.set(user.email, []);
                shouldFetchHistory = true;
                return updated;
            });
            if (shouldFetchHistory && activeUsername) {
                fetchChatHistory(activeUsername, user.email);
            }

            if (!user.fullName) {
                fetchUserDetails(user.email, user.id);
            }
        },
        [username, fetchChatHistory, fetchUserDetails],
    );

    const onPrivateMessage = useCallback(
        (payload) => {
            const payloadData = JSON.parse(payload.body);
            console.log('Private message received:', payloadData);

            if (payloadData.status !== 'MESSAGE') {
                return;
            }

            const activeUsername =
                localStorage.getItem('chat-username') || username || '';

            const isSender = payloadData.senderName === activeUsername;
            const chatKey = isSender
                ? payloadData.receiverName
                : payloadData.senderName;
            const otherUserId = isSender
                ? payloadData.receiverId
                : payloadData.senderId;

            setPrivateChats((prevChats) => {
                const updated = new Map(prevChats);
                const existingMessages = updated.get(chatKey) || [];
                updated.set(chatKey, [...existingMessages, payloadData]);
                return updated;
            });

            setChatUsers((prev) => {
                const next = new Map(prev);
                if (!next.has(chatKey)) {
                    next.set(chatKey, {
                        email: chatKey,
                        id: otherUserId,
                    });
                } else {
                    const existing = next.get(chatKey) || {};
                    next.set(chatKey, {
                        ...existing,
                        email: chatKey,
                        id: existing.id ?? otherUserId,
                    });
                }
                return next;
            });
            fetchUserDetails(chatKey, otherUserId);

            if (!isSender) {
                setReceiver(chatKey);
                setSelectedUser((prev) => {
                    if (prev && prev.email === chatKey) {
                        if (!prev.id && otherUserId) {
                            const updated = { ...prev, id: otherUserId };
                            localStorage.setItem(
                                'selectedUser',
                                JSON.stringify(updated),
                            );
                            return updated;
                        }
                        return prev;
                    }
                    const nextUser = {
                        email: chatKey,
                        id: otherUserId,
                    };
                    localStorage.setItem(
                        'selectedUser',
                        JSON.stringify(nextUser),
                    );
                    localStorage.setItem('selectedUserEmail', chatKey);
                    return nextUser;
                });
                setTab((prev) => prev || chatKey);
            }
        },
        [username, fetchUserDetails],
    );

    const onError = useCallback((err) => {
        console.error('WebSocket connection error:', err);
        connected.current = false;
        connecting.current = false;
    }, []);

    const flushPendingMessages = useCallback((client) => {
        if (!client) {
            return;
        }
        while (pendingMessagesRef.current.length > 0) {
            const messageToSend = pendingMessagesRef.current.shift();
            try {
                client.send(
                    '/app/private-message',
                    {},
                    JSON.stringify(messageToSend),
                );
            } catch (error) {
                console.error('Failed to send pending message:', error);
                pendingMessagesRef.current.unshift(messageToSend);
                break;
            }
        }
    }, []);

    const onConnect = useCallback(
        (clientInstance) => {
            const activeUsername =
                localStorage.getItem('chat-username') || username || '';
            connected.current = true;
            connecting.current = false;
            if (reconnectTimerRef.current) {
                clearTimeout(reconnectTimerRef.current);
                reconnectTimerRef.current = null;
            }
            console.log('WebSocket connected for user:', activeUsername);
            const client = clientInstance || stompClientRef.current;
            if (!client || typeof client.subscribe !== 'function') {
                console.error(
                    'STOMP client unavailable or subscribe missing:',
                    client,
                );
                return;
            }
            client.subscribe(
                `/user/${activeUsername}/private`,
                onPrivateMessage,
            );
            if (tab && activeUsername) {
                fetchChatHistory(activeUsername, tab);
            }
            flushPendingMessages(client);
        },
        [
            username,
            onPrivateMessage,
            tab,
            fetchChatHistory,
            flushPendingMessages,
        ],
    );

    const connect = useCallback(() => {
        const activeUsername =
            localStorage.getItem('chat-username') || username || '';
        if (connected.current || connecting.current || !activeUsername) {
            return;
        }

        connecting.current = true;
        const sock = new SockJS(
            `${BASE_API_URL}/ws?username=${encodeURIComponent(activeUsername)}`,
        );
        sock.onclose = () => {
            console.warn('WebSocket closed. Attempting to reconnect...');
            connected.current = false;
            connecting.current = false;
            if (reconnectTimerRef.current) {
                clearTimeout(reconnectTimerRef.current);
            }
            reconnectTimerRef.current = setTimeout(() => {
                connect();
            }, 2000);
        };
        const client = over(sock);
        stompClientRef.current = client;
        client.connect(
            { username: activeUsername },
            () => {
                onConnect(client);
            },
            (err) => {
                connecting.current = false;
                console.error('Error connecting to WebSocket:', err);
                onError(err);
            },
        );
    }, [onConnect, onError, username]);

    const generateConversationId = useCallback((user1Id, user2Id) => {
        const sortedIds = [user1Id, user2Id].sort();
        return `conv_${sortedIds.join('_')}`;
    }, []);

    const sendPrivate = useCallback(() => {
        const activeUsername =
            localStorage.getItem('chat-username') || username || '';
        const activeFullName = localStorage.getItem('chat-fullname') || '';
        if (message.trim().length > 0 && receiver && selectedUser) {
            try {
                const senderIdRaw = localStorage.getItem('userId');
                if (!senderIdRaw) {
                    console.error('No user ID found');
                    return;
                }
                const senderId = Number(senderIdRaw);
                if (Number.isNaN(senderId)) {
                    console.error('Invalid sender ID:', senderIdRaw);
                    return;
                }
                if (!selectedUser.id) {
                    console.warn(
                        'Receiver ID missing, fetching user details before send',
                    );
                    fetchUserDetails(selectedUser.email, selectedUser.id);
                    return;
                }

                const chatMessage = {
                    senderName: activeUsername,
                    senderId: senderId,
                    receiverName: selectedUser.email,
                    message: message,
                    status: 'MESSAGE',
                    type: 'PRIVATE',
                    receiverId: Number(selectedUser.id),
                    senderDisplayName: activeFullName || activeUsername,
                    receiverDisplayName:
                        selectedUser.fullName || selectedUser.email,
                    conversationId: generateConversationId(
                        senderId,
                        selectedUser.id,
                    ),
                };
                console.log('Sending private message:', chatMessage);

                setPrivateChats((prevChats) => {
                    const updated = new Map(prevChats);
                    const existingMessages = updated.get(receiver) || [];
                    updated.set(receiver, [...existingMessages, chatMessage]);
                    return updated;
                });

                const client = stompClientRef.current;

                if (client && connected.current) {
                    try {
                        client.send(
                            '/app/private-message',
                            {},
                            JSON.stringify(chatMessage),
                        );
                    } catch (error) {
                        console.error(
                            'Error sending message via STOMP:',
                            error,
                        );
                        pendingMessagesRef.current.push(chatMessage);
                        if (!connecting.current) {
                            connect();
                        }
                    }
                } else {
                    pendingMessagesRef.current.push(chatMessage);
                    if (!connecting.current) {
                        connect();
                    }
                }
                setMessage('');
            } catch (error) {
                console.error('Error sending private message:', error);
            }
        }
    }, [
        message,
        receiver,
        selectedUser,
        username,
        generateConversationId,
        connect,
        fetchUserDetails,
    ]);

    // Restore state from storage and establish websocket once
    useEffect(() => {
        if (hasInitialized.current) {
            return;
        }
        hasInitialized.current = true;

        let savedUser = null;
        const savedUserRaw = localStorage.getItem('selectedUser');
        const savedEmail = localStorage.getItem('selectedUserEmail') || '';

        if (savedUserRaw) {
            try {
                savedUser = JSON.parse(savedUserRaw);
            } catch (error) {
                console.error('Error parsing saved selectedUser:', error);
            }
        }

        console.log('Initial restore data:', {
            savedUser,
            savedEmail,
        });

        (async () => {
            const resolvedUsername =
                (await ensureUserIdentity()) ||
                localStorage.getItem('chat-username') ||
                username;

            if (savedUser && savedEmail) {
                setSelectedUser(savedUser);
                setReceiver(savedEmail);
                setTab(savedEmail);
                fetchUserDetails(savedEmail, savedUser?.id);
                if (resolvedUsername) {
                    fetchChatHistory(resolvedUsername, savedEmail);
                }
            }

            if (!connected.current && !connecting.current && resolvedUsername) {
                console.log('Opening Web Socket...');
                connect();
            }
        })();

        return () => {
            const client = stompClientRef.current;
            if (client) {
                try {
                    if (client.connected) {
                        client.disconnect(() => {
                            console.log('WebSocket disconnected');
                        });
                    } else {
                        client.ws?.close();
                    }
                } catch (error) {
                    console.warn('Error during WebSocket disconnect:', error);
                }
                stompClientRef.current = null;
                connected.current = false;
                connecting.current = false;
            }
            if (reconnectTimerRef.current) {
                clearTimeout(reconnectTimerRef.current);
                reconnectTimerRef.current = null;
            }
            pendingMessagesRef.current = [];
        };
    }, [
        connect,
        fetchChatHistory,
        username,
        ensureUserIdentity,
        fetchUserDetails,
    ]);

    useEffect(() => {
        const activeUsername =
            localStorage.getItem('chat-username') || username || '';
        if (connected.current && tab && activeUsername) {
            fetchChatHistory(activeUsername, tab);
        }
    }, [tab, username, fetchChatHistory]);

    useEffect(() => {
        const user = location.state?.selectedUser;
        if (!user || !user.email) {
            return;
        }
        if (processedLocationEmailRef.current === user.email) {
            return;
        }
        const token = localStorage.getItem('authToken');
        if (!token) {
            console.error('No authentication token found');
            navigate('/login');
            return;
        }

        processedLocationEmailRef.current = user.email;
        console.log('New selectedUser from location:', user);
        localStorage.setItem('selectedUser', JSON.stringify(user));
        localStorage.setItem('selectedUserEmail', user.email);
        handlePrivateMessage(user);
    }, [location.state?.selectedUser, handlePrivateMessage, navigate]);

    return (
        <div className='w-full h-full pt-[20px] pb-[100px] gap-4'>
            <div className=' grid grid-cols-12 w-full h-full pt-[15px] pb-[100px]'>
                {/* Member List */}
                <div className=' col-span-3 bg-base-100 border border-base-300 pl-4 mt-3 mr-5  '>
                    <div className='mb-4 border-r border-base-300 '>
                        <h3 className='text-lg font-semibold mb-2'>
                            Danh sách chat
                        </h3>
                        <span className='font-medium hidden lg:block'>
                            {' '}
                            <i className='fa-regular fa-user'></i> Liên Hệ
                        </span>
                    </div>

                    <ul className='list-none space-y-2'>
                        {[...privateChats.keys()].map((email) => {
                            const user = chatUsers.get(email);
                            const lastMessage = privateChats
                                .get(email)
                                ?.slice(-1)[0];

                            return (
                                <li
                                    key={email}
                                    onClick={() => {
                                        const currentUser = chatUsers.get(
                                            email,
                                        ) || { email };
                                        handlePrivateMessage(currentUser);
                                    }}
                                    className={`p-3 cursor-pointer rounded-lg transition-colors ${
                                        tab === email
                                            ? 'bg-blue-500 text-white'
                                            : 'bg-gray-100 hover:bg-gray-200'
                                    }`}
                                >
                                    <div className='flex items-center'>
                                        <div className='w-10 h-10 rounded-full overflow-hidden mr-3'>
                                            <img
                                                src={
                                                    user?.avatarUrl ||
                                                    'https://randomuser.me/api/portraits/lego/1.jpg'
                                                }
                                                alt={user?.fullName || email}
                                                className='w-full h-full object-cover'
                                            />
                                        </div>
                                        <div className='flex-1 min-w-0'>
                                            <div className='font-medium truncate'>
                                                {user?.fullName || email}
                                            </div>
                                            <div className='text-xs opacity-75 truncate'>
                                                {lastMessage?.message ||
                                                    'Chưa có tin nhắn'}
                                            </div>
                                        </div>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                </div>
                <div
                    className='col-span-6 border border-base-300 flex flex-col mt-3'
                    // style={{ border: '1px solid black', paddingLeft: '15px' }}
                >
                    {/* Chat header */}
                    {tab && selectedUser && (
                        <div className='px-4 py-3 border-b border-base-300 bg-base-100'>
                            <div className='flex items-center gap-3'>
                                <img
                                    src={
                                        selectedUser.avatarUrl ||
                                        'https://randomuser.me/api/portraits/lego/1.jpg'
                                    }
                                    alt={selectedUser.fullName}
                                    className='w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-content font-medium'
                                />
                            </div>
                            <div>
                                {/* <div className="font-medium">{selectedUser.fullName}</div> */}
                                <h3 className='font-medium text-sm'>
                                    {selectedUser.fullName}
                                </h3>
                                <div className='text-sm text-gray-600'>
                                    {selectedUser.job ||
                                        'Chưa cập nhật nghề nghiệp'}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Chat Box */}
                    <div
                        ref={chatContainerRef}
                        className='col-span-6 p-4 space-y-4 min-h-[490px] max-h-[600px] overflow-y-auto bg-base-100'
                    >
                        {tab && privateChats.get(tab)?.length > 0 ? (
                            privateChats.get(tab).map((msg, index) => (
                                <div
                                    className={`flex ${
                                        msg.senderName !== username
                                            ? 'justify-start'
                                            : 'justify-end'
                                    }`}
                                    key={index}
                                >
                                    <div
                                        className={`p-2 flex flex-col max-w-lg ${
                                            msg.senderName !== username
                                                ? 'bg-white rounded-t-lg rounded-r-lg'
                                                : 'bg-blue-500 rounded-t-lg rounded-l-lg'
                                        }`}
                                    >
                                        <div
                                            className={
                                                msg.senderName === username
                                                    ? 'text-white'
                                                    : ''
                                            }
                                        >
                                            {msg.message}
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className='flex justify-center items-center h-full'>
                                <p className='text-gray-500'>
                                    Chưa có tin nhắn nào
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Message Box */}
                    {tab && (
                        <div
                            style={{ width: '100%' }}
                            className='p-4 border-t border-base-300 bg-base-100 flex justify-center'
                        >
                            <input
                                className='input input-bordered flex-1 text-sm h-10 gap-2'
                                style={{ width: '65%' }}
                                type='text'
                                placeholder='Message'
                                value={message}
                                onKeyUp={(e) => {
                                    if (e.key === 'Enter') {
                                        sendPrivate();
                                    }
                                }}
                                onChange={(e) => setMessage(e.target.value)}
                            />
                            <input
                                type='button'
                                className='btn btn-primary h-10 min-h-0'
                                style={{ marginLeft: '2%' }}
                                value='Send'
                                onClick={sendPrivate}
                            />
                        </div>
                    )}
                </div>
                <div className='col-span-3 pl-4 pt-3'>
                    <SearchBar onUserSelect={handlePrivateMessage} />
                </div>
            </div>
        </div>
    );
};

export default ChatPage2;
