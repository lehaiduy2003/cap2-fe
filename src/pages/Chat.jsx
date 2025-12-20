import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { showErrorToast, showInfoToast } from '../components/toast';
import Navbar from '../components/Navbar';
import { RAG_API_KEY, RAG_API_URL } from '../constants';

function Chat() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const ownerId = searchParams.get('ownerId');
    const roomId = searchParams.get('roomId');

    useEffect(() => {
        const token = localStorage.getItem('authToken');
        if (!token) {
            showInfoToast('Vui lòng đăng nhập để trò chuyện.');
            navigate('/login');
            return;
        }

        if (!ownerId || !roomId) {
            showErrorToast('Thông tin phòng không hợp lệ.');
            window.close();
            return;
        }

        // Add welcome message
        setMessages([
            {
                role: 'assistant',
                content: `Xin chào! Tôi là trợ lý AI của SafeNestly. Tôi có thể giúp bạn giải đáp thắc mắc về phòng trọ này. Bạn muốn biết điều gì?`,
                timestamp: new Date(),
            },
        ]);
    }, [ownerId, roomId, navigate]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!inputMessage.trim() || isLoading) return;

        const userMessage = {
            role: 'user',
            content: inputMessage,
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMessage]);
        const currentMessage = inputMessage;
        setInputMessage('');
        setIsLoading(true);

        try {
            // Get user info for session ID
            const userStr = localStorage.getItem('userData');
            const user = userStr ? JSON.parse(userStr) : null;
            const userId = user?.id || 'guest';

            // Call RAG chat API
            const response = await fetch(`${RAG_API_URL}/api/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': RAG_API_KEY,
                },
                body: JSON.stringify({
                    message: currentMessage,
                    property_id: roomId,
                    owner_id: ownerId,
                    user_id: userId,
                    session_id: `${userId}-property-${roomId}`,
                }),
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            const data = await response.json();

            const aiMessage = {
                role: 'assistant',
                content: data.response,
                timestamp: new Date(),
                sources: data.sources,
                sourceCount: data.source_count,
            };

            setMessages((prev) => [...prev, aiMessage]);
        } catch (error) {
            console.error('Error sending message:', error);
            showErrorToast('Không thể gửi tin nhắn. Vui lòng thử lại.');

            // Add error message to chat
            const errorMessage = {
                role: 'assistant',
                content:
                    'Xin lỗi, tôi gặp sự cố khi xử lý tin nhắn của bạn. Vui lòng thử lại sau.',
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const formatTime = (date) => {
        return new Date(date).toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className='h-screen overflow-hidden flex flex-col'>
            {/* Reuse existing Navbar */}
            <Navbar />

            {/* Chat Messages */}
            <div className='flex-1 overflow-y-auto bg-linear-to-br from-blue-50 via-white to-purple-50'>
                <div className='max-w-4xl mx-auto px-4 py-6 space-y-6'>
                    {messages.map((message, index) => (
                        <div
                            key={index}
                            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
                        >
                            <div
                                className={`flex items-start space-x-2 max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}
                            >
                                {/* Avatar */}
                                <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                                        message.role === 'user'
                                            ? 'bg-blue-500'
                                            : 'bg-linear-to-r from-purple-500 to-pink-500'
                                    }`}
                                >
                                    <i
                                        className={`fa-solid ${message.role === 'user' ? 'fa-user' : 'fa-robot'} text-white text-sm`}
                                    ></i>
                                </div>

                                {/* Message Bubble */}
                                <div className='flex flex-col'>
                                    <div
                                        className={`px-4 py-3 rounded-2xl shadow-sm ${
                                            message.role === 'user'
                                                ? 'bg-blue-500 text-white rounded-tr-sm'
                                                : 'bg-white text-gray-800 rounded-tl-sm border border-gray-200'
                                        }`}
                                    >
                                        <p className='text-sm leading-relaxed whitespace-pre-wrap'>
                                            {message.content}
                                        </p>
                                        {/* Show sources for AI messages */}
                                        {message.role === 'assistant' &&
                                            message.sources &&
                                            message.sources.length > 0 && (
                                                <div className='mt-3 pt-3 border-t border-gray-200'>
                                                    <p className='text-xs text-gray-500 mb-2'>
                                                        <i className='fa-solid fa-book mr-1'></i>
                                                        Nguồn tham khảo (
                                                        {message.sourceCount}{' '}
                                                        tài liệu):
                                                    </p>
                                                    <div className='space-y-1'>
                                                        {message.sources
                                                            .slice(0, 3)
                                                            .map(
                                                                (
                                                                    source,
                                                                    idx,
                                                                ) => (
                                                                    <div
                                                                        key={
                                                                            idx
                                                                        }
                                                                        className='text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded'
                                                                    >
                                                                        <span className='font-medium'>
                                                                            {
                                                                                source.document_title
                                                                            }
                                                                        </span>
                                                                        {source.score && (
                                                                            <span className='text-gray-400 ml-2'>
                                                                                (
                                                                                {(
                                                                                    source.score *
                                                                                    100
                                                                                ).toFixed(
                                                                                    0,
                                                                                )}

                                                                                %
                                                                                liên
                                                                                quan)
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                ),
                                                            )}
                                                    </div>
                                                </div>
                                            )}
                                    </div>
                                    <span
                                        className={`text-xs text-gray-400 mt-1 ${message.role === 'user' ? 'text-right' : 'text-left'}`}
                                    >
                                        {formatTime(message.timestamp)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}

                    {isLoading && (
                        <div className='flex justify-start animate-fade-in'>
                            <div className='flex items-start space-x-2 max-w-[80%]'>
                                <div className='w-8 h-8 rounded-full bg-linear-to-r from-purple-500 to-pink-500 flex items-center justify-center shrink-0'>
                                    <i className='fa-solid fa-robot text-white text-sm'></i>
                                </div>
                                <div className='px-4 py-3 bg-white rounded-2xl rounded-tl-sm shadow-sm border border-gray-200'>
                                    <div className='flex space-x-2'>
                                        <div className='w-2 h-2 bg-gray-400 rounded-full animate-bounce'></div>
                                        <div className='w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100'></div>
                                        <div className='w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200'></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Input Area */}
            <div className='bg-white border-t border-gray-200 shadow-lg shrink-0'>
                <div className='max-w-4xl mx-auto px-4 py-4'>
                    <form
                        onSubmit={handleSendMessage}
                        className='flex space-x-3'
                    >
                        <div className='flex-1 relative'>
                            <input
                                type='text'
                                value={inputMessage}
                                onChange={(e) =>
                                    setInputMessage(e.target.value)
                                }
                                placeholder='Nhập câu hỏi của bạn...'
                                disabled={isLoading}
                                className='w-full px-4 py-3 pr-12 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed transition-all'
                            />
                        </div>
                        <button
                            type='submit'
                            disabled={!inputMessage.trim() || isLoading}
                            className='px-6 py-3 bg-linear-to-r from-blue-500 to-purple-600 text-white rounded-full font-medium hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg'
                        >
                            {isLoading ? (
                                <i className='fa-solid fa-spinner fa-spin'></i>
                            ) : (
                                <i className='fa-solid fa-paper-plane'></i>
                            )}
                        </button>
                    </form>
                    <p className='text-xs text-gray-400 text-center mt-2'>
                        AI Assistant có thể mắc sai lầm. Vui lòng kiểm tra thông
                        tin quan trọng.
                    </p>
                </div>
            </div>
        </div>
    );
}

export default Chat;
