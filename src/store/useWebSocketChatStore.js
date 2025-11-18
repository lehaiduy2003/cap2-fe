import { create } from 'zustand';
import SockJS from 'sockjs-client';
import { over } from 'stompjs';
import axios from 'axios';
import { BASE_API_URL } from '../constants';
import toast from 'react-hot-toast';

export const useWebSocketChatStore = create((set, get) => ({
    // State
    stompClient: null,
    connected: false,
    connecting: false,
    currentUserId: null,
    currentUserEmail: null,
    selectedUser: null,
    conversations: new Map(), // conversationId -> { partner, messages: [] }
    activeConversationId: null,
    conversationsVersion: 0, // Counter to trigger re-renders when conversations change

    // Helper to normalize conversation IDs to strings
    normalizeConversationId: (id) => {
        if (id === null || id === undefined) return null;
        return String(id);
    },

    // Initialize WebSocket connection
    connectWebSocket: (userId, userEmail) => {
        const { connected, connecting } = get();

        if (connected || connecting) {
            console.log('Already connected or connecting');
            return;
        }

        set({
            connecting: true,
            currentUserId: userId,
            currentUserEmail: userEmail,
        });

        try {
            const sock = new SockJS(
                `${BASE_API_URL}/ws?username=${encodeURIComponent(userEmail)}`,
            );
            const stompClient = over(sock);

            stompClient.connect(
                { username: userEmail },
                () => {
                    console.log('WebSocket connected');
                    set({ connected: true, connecting: false, stompClient });

                    // Subscribe to private messages
                    console.log(`Subscribing to: /user/${userEmail}/private`);
                    stompClient.subscribe(
                        `/user/${userEmail}/private`,
                        (payload) => {
                            console.log(
                                'Received WebSocket message:',
                                payload.body,
                            );
                            const message = JSON.parse(payload.body);
                            console.log('Parsed message:', message);
                            get().handleIncomingMessage(message);
                        },
                    );
                    console.log('WebSocket subscription completed');
                },
                (error) => {
                    console.error('WebSocket connection error:', error);
                    set({ connected: false, connecting: false });
                    toast.error('Failed to connect to chat server');
                },
            );
        } catch (error) {
            console.error('Error creating WebSocket connection:', error);
            set({ connected: false, connecting: false });
        }
    },

    // Disconnect WebSocket
    disconnectWebSocket: () => {
        const { stompClient } = get();
        if (stompClient && stompClient.connected) {
            stompClient.disconnect(() => {
                console.log('WebSocket disconnected');
            });
        }
        set({
            stompClient: null,
            connected: false,
            conversations: new Map(),
            activeConversationId: null,
            conversationsVersion: 0,
        });
    },

    // Load all conversations for the current user
    loadAllConversations: async (userId) => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await axios.get(
                `${BASE_API_URL}/messages/api/messages/conversations/${userId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                },
            );

            const conversationSummaries = response.data || [];
            const normalizeId = get().normalizeConversationId;

            console.log(
                'Loaded conversation summaries:',
                conversationSummaries,
            );

            // Update conversations map with summaries
            set((state) => {
                const newConversations = new Map(state.conversations);

                conversationSummaries.forEach((summary) => {
                    const convId = normalizeId(summary.conversationId);

                    // Only add if conversation doesn't already exist
                    if (!newConversations.has(convId)) {
                        newConversations.set(convId, {
                            id: convId,
                            partner: {
                                id: summary.partnerId,
                                email: summary.partnerEmail,
                                fullName: summary.partnerName,
                                phone: summary.partnerPhone,
                                role: summary.partnerRole,
                            },
                            messages: [], // Messages will be loaded when user selects the conversation
                            lastMessage: summary.lastMessage,
                            lastTimestamp: summary.lastTimestamp,
                            isNew: false,
                        });
                    }
                });

                return {
                    conversations: newConversations,
                    conversationsVersion: state.conversationsVersion + 1,
                };
            });

            return conversationSummaries;
        } catch (error) {
            console.error('Error loading conversations:', error);
            return [];
        }
    },

    // Load conversation history between two users
    loadConversationHistory: async (userId1, userId2, partnerInfo) => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await axios.get(
                `${BASE_API_URL}/messages/conversation/${userId1}/${userId2}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                },
            );

            const messages = response.data || [];
            const normalizeId = get().normalizeConversationId;

            // Determine conversation ID from messages or create a temporary one for new conversations
            // ALWAYS convert to string for consistency
            const conversationId =
                messages.length > 0
                    ? normalizeId(messages[0].conversationId)
                    : `new_${userId1}_${userId2}`;

            // Update conversations map
            set((state) => {
                const newConversations = new Map(state.conversations);

                // Clean up any potential numeric vs string duplicates
                // Check for both string and number versions
                const possibleDuplicateKeys = [conversationId];
                if (!isNaN(conversationId)) {
                    possibleDuplicateKeys.push(Number(conversationId));
                }

                // Remove any non-string versions
                possibleDuplicateKeys.forEach((key) => {
                    if (key !== conversationId && newConversations.has(key)) {
                        console.log(
                            `Removing duplicate key: ${key}, keeping: ${conversationId}`,
                        );
                        newConversations.delete(key);
                    }
                });

                // Check if conversation already exists
                const existingConv = newConversations.get(conversationId);

                if (existingConv) {
                    // Merge messages, avoiding duplicates
                    const existingMessageIds = new Set(
                        existingConv.messages.map(
                            (m) => m.id || `${m.timestamp}-${m.senderId}`,
                        ),
                    );

                    const newMessages = messages.filter(
                        (m) =>
                            !existingMessageIds.has(
                                m.id || `${m.timestamp}-${m.senderId}`,
                            ),
                    );

                    // Update existing conversation
                    newConversations.set(conversationId, {
                        ...existingConv,
                        messages: [
                            ...existingConv.messages,
                            ...newMessages,
                        ].sort(
                            (a, b) => (a.timestamp || 0) - (b.timestamp || 0),
                        ),
                        isNew: false,
                    });
                } else {
                    // Create new conversation
                    newConversations.set(conversationId, {
                        id: conversationId,
                        partner: partnerInfo,
                        messages: messages,
                        userId1,
                        userId2,
                        isNew: messages.length === 0, // Mark as new conversation
                    });
                }

                return {
                    conversations: newConversations,
                    activeConversationId: conversationId,
                    conversationsVersion: state.conversationsVersion + 1,
                };
            });

            return messages;
        } catch (error) {
            console.error('Error loading conversation history:', error);
            return [];
        }
    },

    // Send message via WebSocket
    sendMessage: (messageData) => {
        const { stompClient, connected, currentUserId, currentUserEmail } =
            get();

        if (!connected || !stompClient) {
            toast.error('Not connected to chat server');
            return;
        }

        // For new conversations, conversationId might start with "new_"
        // Backend will create the actual conversation and return real ID
        const isNewConversation =
            typeof messageData.conversationId === 'string' &&
            messageData.conversationId.startsWith('new_');

        const conversationId = isNewConversation
            ? null
            : messageData.conversationId;

        const message = {
            senderId: currentUserId,
            senderName: currentUserEmail,
            receiverId: messageData.receiverId,
            receiverName: messageData.receiverName,
            message: messageData.message,
            media: messageData.media || null,
            mediaType: messageData.mediaType || null,
            status: 'MESSAGE',
            type: 'PRIVATE',
            timestamp: Date.now(),
            conversationId: conversationId,
        };

        try {
            console.log('Sending message via WebSocket:', message);
            stompClient.send(
                '/app/private-message',
                {},
                JSON.stringify(message),
            );
            console.log('Message sent to /app/private-message');

            // Don't add optimistically - wait for backend to return with proper ID and timestamp
            // Backend will send the message back to both sender and receiver
            console.log(
                'Waiting for backend to return message with ID and timestamp',
            );
        } catch (error) {
            console.error('Error sending message:', error);
            toast.error('Failed to send message');
        }
    },

    // Handle incoming WebSocket message
    handleIncomingMessage: (message) => {
        const { currentUserId, activeConversationId } = get();

        console.log('handleIncomingMessage called with:', message);
        console.log('Current user ID:', currentUserId);
        console.log('Active conversation ID:', activeConversationId);

        if (!message.conversationId) {
            console.warn('Message without conversationId:', message);
            return;
        }

        set((state) => {
            const newConversations = new Map(state.conversations);
            const normalizeId = get().normalizeConversationId;

            // Normalize conversation ID
            const messageConvId = normalizeId(message.conversationId);
            let conversation = newConversations.get(messageConvId);
            let newActiveConversationId = state.activeConversationId;

            // Check if this is a response to a "new" conversation (temporary ID)
            const isActiveConvNew =
                typeof activeConversationId === 'string' &&
                activeConversationId.startsWith('new_');

            if (!conversation && isActiveConvNew) {
                const tempConversation =
                    newConversations.get(activeConversationId);
                if (tempConversation && tempConversation.isNew) {
                    // This is the first message response - backend created the conversation
                    // Migrate the temporary conversation to the real one
                    conversation = {
                        ...tempConversation,
                        id: messageConvId,
                        isNew: false,
                    };
                    newConversations.delete(activeConversationId);
                    newConversations.set(messageConvId, conversation);
                    newActiveConversationId = messageConvId;
                    console.log(
                        `Migrated conversation from ${activeConversationId} to ${messageConvId}`,
                    );
                }
            }

            if (conversation) {
                // Check if message already exists (avoid duplicates)
                // Only check if we have a valid message ID
                const messageExists = message.id
                    ? conversation.messages.some((m) => m.id === message.id)
                    : conversation.messages.some(
                          (m) =>
                              m.timestamp === message.timestamp &&
                              m.senderId === message.senderId &&
                              m.message === message.message,
                      );

                console.log('Checking for duplicate:', {
                    messageId: message.id,
                    timestamp: message.timestamp,
                    message: message.message,
                    existingCount: conversation.messages.length,
                    exists: messageExists,
                });

                if (!messageExists) {
                    console.log(
                        'Adding message to existing conversation:',
                        messageConvId,
                    );
                    // Create a new conversation object to ensure immutability
                    const updatedConversation = {
                        ...conversation,
                        messages: [...conversation.messages, message],
                        isNew: false,
                    };
                    newConversations.set(messageConvId, updatedConversation);
                } else {
                    console.log('Message already exists, skipping duplicate');
                    // Still return without incrementing version if no changes
                    return state;
                }
            } else {
                // Create new conversation entry if it doesn't exist
                console.log(
                    'Creating new conversation entry for:',
                    messageConvId,
                );
                const isFromCurrentUser = message.senderId === currentUserId;
                const partnerId = isFromCurrentUser
                    ? message.receiverId
                    : message.senderId;
                const partnerName = isFromCurrentUser
                    ? message.receiverName
                    : message.senderName;

                newConversations.set(messageConvId, {
                    id: messageConvId,
                    partner: {
                        id: partnerId,
                        email: partnerName,
                        fullName: partnerName,
                    },
                    messages: [message],
                    isNew: false,
                });
            }

            return {
                conversations: newConversations,
                activeConversationId: newActiveConversationId,
                conversationsVersion: state.conversationsVersion + 1,
            };
        });
    },

    // Select a user to chat with
    selectUser: async (user) => {
        const { currentUserId, loadConversationHistory } = get();

        set({ selectedUser: user });

        if (currentUserId && user.id) {
            await loadConversationHistory(currentUserId, user.id, user);
        }
    },

    // Get messages for active conversation
    getActiveMessages: () => {
        const { conversations, activeConversationId, normalizeConversationId } =
            get();

        if (!activeConversationId) return [];

        const normalizedId = normalizeConversationId(activeConversationId);
        const conversation = conversations.get(normalizedId);
        return conversation ? conversation.messages : [];
    },

    // Get all conversations as an array
    getAllConversations: () => {
        const { conversations } = get();
        const conversationArray = Array.from(conversations.values());

        // Remove duplicates based on conversation ID (convert to string for comparison)
        const uniqueConversations = conversationArray.reduce((acc, conv) => {
            const convId = String(conv.id);
            // Only add if we haven't seen this ID before
            if (!acc.some((c) => String(c.id) === convId)) {
                acc.push(conv);
            }
            return acc;
        }, []);

        // Sort by last message timestamp (most recent first)
        return uniqueConversations.sort((a, b) => {
            // Use lastTimestamp from summary if messages array is empty
            const lastMessageA = a.messages[a.messages.length - 1];
            const lastMessageB = b.messages[b.messages.length - 1];
            const timeA = lastMessageA?.timestamp || a.lastTimestamp || 0;
            const timeB = lastMessageB?.timestamp || b.lastTimestamp || 0;
            return timeB - timeA;
        });
    },

    // Get unread message count for a conversation
    getUnreadCount: (conversationId) => {
        const { conversations, currentUserId, normalizeConversationId } = get();
        const normalizedId = normalizeConversationId(conversationId);
        const conversation = conversations.get(normalizedId);

        if (!conversation) return 0;

        // Count messages from other user that are unread
        // For now, we'll count messages received after the last time the conversation was active
        return conversation.messages.filter(
            (msg) => msg.senderId !== currentUserId && !msg.read,
        ).length;
    },

    // Clear all data
    clearStore: () => {
        set({
            stompClient: null,
            connected: false,
            connecting: false,
            currentUserId: null,
            currentUserEmail: null,
            selectedUser: null,
            conversations: new Map(),
            activeConversationId: null,
            conversationsVersion: 0,
        });
    },
}));
