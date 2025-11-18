import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useWebSocketChatStore } from '../store/useWebSocketChatStore';
import axios from 'axios';
import { BASE_API_URL } from '../constants';
import SearchBar from '../components/other/SearchBar';

const ChatPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const chatContainerRef = useRef(null);

    const {
        connectWebSocket,
        disconnectWebSocket,
        sendMessage,
        selectUser,
        getActiveMessages,
        getAllConversations,
        getUnreadCount,
        loadAllConversations,
        selectedUser,
        connected,
        activeConversationId,
        conversationsVersion,
    } = useWebSocketChatStore();

    const [currentUser, setCurrentUser] = useState(null);
    const [messageInput, setMessageInput] = useState('');
    const [chatUsers, setChatUsers] = useState([]);
    const [isLoadingProfile, setIsLoadingProfile] = useState(true);
    const [showSearchResults, setShowSearchResults] = useState(false);

    // Get current user profile and initialize WebSocket
    useEffect(() => {
        const initializeChat = async () => {
            try {
                const token = localStorage.getItem('authToken');
                const response = await axios.get(
                    `${BASE_API_URL}/renterowner/get-profile`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        },
                    },
                );

                const profile = response.data?.data || response.data || {};
                const userId = profile?.id ?? profile?.user?.id;
                const userEmail = profile?.email ?? profile?.user?.email;
                const fullName = profile?.fullName ?? profile?.user?.fullName;

                if (userId && userEmail) {
                    setCurrentUser({ id: userId, email: userEmail, fullName });
                    connectWebSocket(userId, userEmail);

                    // Load all existing conversations for this user
                    await loadAllConversations(userId);
                }

                // If there's a selected user from navigation state, select them
                if (location.state?.selectedUser) {
                    await selectUser(location.state.selectedUser);
                }
            } catch (error) {
                console.error('Error initializing chat:', error);
                navigate('/login');
            } finally {
                setIsLoadingProfile(false);
            }
        };

        initializeChat();

        return () => {
            disconnectWebSocket();
        };
    }, [
        navigate,
        location.state,
        connectWebSocket,
        disconnectWebSocket,
        selectUser,
        loadAllConversations,
    ]);

    // Get active messages
    const messages = getActiveMessages();

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop =
                chatContainerRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSendMessage = (e) => {
        e.preventDefault();

        if (!messageInput.trim() || !selectedUser) {
            return;
        }

        // Allow sending even if no activeConversationId (new conversation)
        // Backend will create the conversation on first message
        sendMessage({
            receiverId: selectedUser.id,
            receiverName: selectedUser.email,
            message: messageInput.trim(),
            conversationId:
                activeConversationId ||
                `new_${currentUser.id}_${selectedUser.id}`,
        });

        setMessageInput('');
    };

    const handleUserSelect = async (user) => {
        await selectUser(user);
    };

    const handleSearch = async (searchTerm) => {
        if (!searchTerm.trim()) {
            setChatUsers([]);
            setShowSearchResults(false);
            return;
        }

        try {
            const token = localStorage.getItem('authToken');
            const response = await axios.get(
                `${BASE_API_URL}/messages/search?username=${encodeURIComponent(searchTerm)}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                },
            );

            setChatUsers(response.data || []);
            setShowSearchResults(true);
        } catch (error) {
            console.error('Error searching users:', error);
        }
    };

    // Get existing conversations (will update when conversationsVersion changes)
    const existingConversations = getAllConversations();

    // Use conversationsVersion to force re-render when conversations change
    // eslint-disable-next-line no-unused-vars
    const _forceUpdate = conversationsVersion;

    if (isLoadingProfile) {
        return (
            <div className='flex items-center justify-center h-screen'>
                <div className='text-center'>
                    <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto'></div>
                    <p className='mt-4 text-gray-600'>Loading chat...</p>
                </div>
            </div>
        );
    }

    return (
        <div className='flex h-screen bg-gray-100'>
            {/* Sidebar */}
            <div className='w-80 bg-white border-r border-gray-200 flex flex-col'>
                {/* User Info */}
                <div className='p-4 border-b border-gray-200'>
                    <h2 className='text-xl font-semibold'>
                        {currentUser?.fullName || currentUser?.email}
                    </h2>
                    <p className='text-sm text-gray-500'>
                        {connected ? '🟢 Connected' : '🔴 Disconnected'}
                    </p>
                </div>

                {/* Search Bar */}
                <div className='p-4'>
                    <SearchBar
                        onSearch={handleSearch}
                        placeholder='Search users...'
                    />
                </div>

                {/* User List */}
                <div className='flex-1 overflow-y-auto'>
                    {/* Show search results if searching */}
                    {showSearchResults && chatUsers.length > 0 ? (
                        <>
                            <div className='px-4 py-2 bg-gray-50 text-xs font-semibold text-gray-600'>
                                SEARCH RESULTS
                            </div>
                            {chatUsers.map((user) => (
                                <div
                                    key={user.id}
                                    onClick={() => handleUserSelect(user)}
                                    className={`p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 ${
                                        selectedUser?.id === user.id
                                            ? 'bg-blue-50'
                                            : ''
                                    }`}
                                >
                                    <div className='flex items-center'>
                                        <div className='w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center mr-3'>
                                            {user.avatarUrl ? (
                                                <img
                                                    src={user.avatarUrl}
                                                    alt={user.fullName}
                                                    className='w-full h-full rounded-full object-cover'
                                                />
                                            ) : (
                                                <span className='text-gray-600 font-semibold'>
                                                    {user.fullName?.[0] ||
                                                        user.email?.[0] ||
                                                        '?'}
                                                </span>
                                            )}
                                        </div>
                                        <div className='flex-1'>
                                            <p className='font-medium'>
                                                {user.fullName || user.email}
                                            </p>
                                            <p className='text-sm text-gray-500'>
                                                {user.email}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </>
                    ) : null}

                    {/* Show existing conversations */}
                    {existingConversations.length > 0 && (
                        <>
                            <div className='px-4 py-2 bg-gray-50 text-xs font-semibold text-gray-600'>
                                CONVERSATIONS
                            </div>
                            {existingConversations.map((conversation) => {
                                const lastMessage =
                                    conversation.messages[
                                        conversation.messages.length - 1
                                    ];
                                // Use lastMessage from summary if messages array is empty
                                const displayMessage =
                                    lastMessage?.message ||
                                    conversation.lastMessage ||
                                    'No messages yet';

                                const unreadCount = getUnreadCount(
                                    conversation.id,
                                );
                                // Both IDs should already be normalized strings
                                const isActive =
                                    String(activeConversationId) ===
                                    String(conversation.id);

                                return (
                                    <div
                                        key={conversation.id}
                                        onClick={() =>
                                            handleUserSelect(
                                                conversation.partner,
                                            )
                                        }
                                        className={`p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 ${
                                            isActive ? 'bg-blue-50' : ''
                                        }`}
                                    >
                                        <div className='flex items-center'>
                                            <div className='w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center mr-3'>
                                                {conversation.partner
                                                    .avatarUrl ? (
                                                    <img
                                                        src={
                                                            conversation.partner
                                                                .avatarUrl
                                                        }
                                                        alt={
                                                            conversation.partner
                                                                .fullName
                                                        }
                                                        className='w-full h-full rounded-full object-cover'
                                                    />
                                                ) : (
                                                    <span className='text-gray-600 font-semibold'>
                                                        {conversation.partner
                                                            .fullName?.[0] ||
                                                            conversation.partner
                                                                .email?.[0] ||
                                                            '?'}
                                                    </span>
                                                )}
                                            </div>
                                            <div className='flex-1 min-w-0'>
                                                <div className='flex justify-between items-baseline'>
                                                    <p className='font-medium truncate'>
                                                        {conversation.partner
                                                            .fullName ||
                                                            conversation.partner
                                                                .email}
                                                    </p>
                                                    {unreadCount > 0 && (
                                                        <span className='ml-2 bg-blue-500 text-white text-xs rounded-full px-2 py-0.5'>
                                                            {unreadCount}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className='text-sm text-gray-500 truncate'>
                                                    {displayMessage}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </>
                    )}

                    {/* Show empty state only when no conversations and no search results */}
                    {!showSearchResults &&
                        existingConversations.length === 0 && (
                            <div className='p-4 text-center text-gray-500'>
                                <p>Search for users to start chatting</p>
                            </div>
                        )}
                </div>
            </div>

            {/* Chat Area */}
            <div className='flex-1 flex flex-col'>
                {selectedUser ? (
                    <>
                        {/* Chat Header */}
                        <div className='bg-white border-b border-gray-200 p-4'>
                            <div className='flex items-center'>
                                <div className='w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center mr-3'>
                                    {selectedUser.avatarUrl ? (
                                        <img
                                            src={selectedUser.avatarUrl}
                                            alt={selectedUser.fullName}
                                            className='w-full h-full rounded-full object-cover'
                                        />
                                    ) : (
                                        <span className='text-gray-600 font-semibold'>
                                            {selectedUser.fullName?.[0] ||
                                                selectedUser.email?.[0] ||
                                                '?'}
                                        </span>
                                    )}
                                </div>
                                <div>
                                    <h3 className='font-semibold'>
                                        {selectedUser.fullName ||
                                            selectedUser.email}
                                    </h3>
                                    <p className='text-sm text-gray-500'>
                                        {selectedUser.email}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Messages */}
                        <div
                            ref={chatContainerRef}
                            className='flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50'
                        >
                            {messages.length > 0 ? (
                                messages.map((msg, index) => {
                                    const isOwnMessage =
                                        msg.senderId === currentUser?.id;
                                    return (
                                        <div
                                            key={msg.id || index}
                                            className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div
                                                className={`max-w-xs lg:max-w-md xl:max-w-lg px-4 py-2 rounded-lg ${
                                                    isOwnMessage
                                                        ? 'bg-blue-500 text-white'
                                                        : 'bg-white text-gray-800'
                                                }`}
                                            >
                                                <p className='break-words'>
                                                    {msg.message}
                                                </p>
                                                <p
                                                    className={`text-xs mt-1 ${
                                                        isOwnMessage
                                                            ? 'text-blue-100'
                                                            : 'text-gray-500'
                                                    }`}
                                                >
                                                    {new Date(
                                                        msg.timestamp,
                                                    ).toLocaleTimeString()}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className='flex flex-col items-center justify-center h-full text-gray-500'>
                                    <svg
                                        className='w-16 h-16 mb-4 text-gray-400'
                                        fill='none'
                                        stroke='currentColor'
                                        viewBox='0 0 24 24'
                                    >
                                        <path
                                            strokeLinecap='round'
                                            strokeLinejoin='round'
                                            strokeWidth={2}
                                            d='M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z'
                                        />
                                    </svg>
                                    <p className='text-lg font-medium mb-2'>
                                        No messages yet
                                    </p>
                                    <p className='text-sm'>
                                        Send a message to start the conversation
                                        with{' '}
                                        {selectedUser.fullName ||
                                            selectedUser.email}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Message Input */}
                        <form
                            onSubmit={handleSendMessage}
                            className='bg-white border-t border-gray-200 p-4'
                        >
                            <div className='flex space-x-2'>
                                <input
                                    type='text'
                                    value={messageInput}
                                    onChange={(e) =>
                                        setMessageInput(e.target.value)
                                    }
                                    placeholder='Type a message...'
                                    className='flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
                                    disabled={!connected}
                                />
                                <button
                                    type='submit'
                                    disabled={
                                        !connected || !messageInput.trim()
                                    }
                                    className='bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors'
                                >
                                    Send
                                </button>
                            </div>
                        </form>
                    </>
                ) : (
                    <div className='flex-1 flex items-center justify-center text-gray-500'>
                        <div className='text-center'>
                            <svg
                                className='w-24 h-24 mx-auto mb-4 text-gray-400'
                                fill='none'
                                stroke='currentColor'
                                viewBox='0 0 24 24'
                            >
                                <path
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                    strokeWidth={2}
                                    d='M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z'
                                />
                            </svg>
                            <p className='text-xl font-semibold'>
                                Select a user to start chatting
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatPage;
