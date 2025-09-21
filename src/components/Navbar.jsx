import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { Link, useLocation } from 'react-router-dom';
import SockJS from 'sockjs-client';
import * as Stomp from 'stompjs';
import '../styles/Navbar.css';
import trash from '../assets/trash.png';
// import chatbox from "../assets/chatbox.png";
// import user from "../assets/user.png";
import logout from '../assets/logout.png';
import dashboard from '../assets/dashboard.png';
import user2 from '../assets/user2.png';
import friends from '../assets/high-five.png';
import living from '../assets/living.png';
// import home_icon from "../assets/house.png";
import bell from '../assets/bell.png';
import { BASE_API_URL } from '../constants';

function Navbar() {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [notificationOpen, setNotificationOpen] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [fullName, setFullName] = useState('');
    const [role, setRole] = useState('');
    const [notifications, setNotifications] = useState([]); // Danh sách thông báo động
    const location = useLocation();
    const dropdownRef = useRef(null);
    const notificationRef = useRef(null);
    const stompClientRef = useRef(null);

    // Function to translate notification type to Vietnamese
    const translateNotificationType = (type) => {
        const translations = {
            RENT_REQUEST_CREATED: 'Yêu cầu thuê phòng mới',
            RENT_REQUEST_APPROVED: 'Yêu cầu thuê phòng được chấp nhận',
            RENT_REQUEST_REJECTED: 'Yêu cầu thuê phòng bị từ chối',
            VIEW_CONFIRMED: 'Xác nhận xem phòng',
            CONTRACT_CREATED: 'Hợp đồng mới được tạo',
            ROOM_HIDDEN: 'Phòng đã bị ẩn',
            TENANT_CONFIRMED_VIEWING: 'Người thuê đã xác nhận xem phòng',
            RENT_REQUEST_VIEW_ROOM: 'Yêu cầu xem phòng',
            OWNER_REJECTED: 'Chủ nhà đã từ chối',
            OWNER_APPROVED: 'Chủ nhà đã chấp nhận',
            BREACH: 'Vi phạm hợp đồng',
            NON_BREACH: 'Không vi phạm hợp đồng',
        };
        return translations[type] || type;
    };

    // delete notification function
    const handleDeleteNotification = (indexToDelete) => {
        setNotifications((prev) =>
            prev.filter((_, index) => index !== indexToDelete),
        );
    };

    // Fetch historical notifications
    const fetchNotifications = async (userEmail) => {
        const token = localStorage.getItem('authToken');
        if (!token || !userEmail) {
            console.log('Missing token or user email for notifications');
            return;
        }

        try {
            const response = await axios.get(
                `${BASE_API_URL}/api/notifications`,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                },
            );
            const fetchedNotifications = response.data.map((notification) => ({
                message: notification.message || 'No message',
                type: notification.type || 'Unknown',
                userId: notification.userId || 'Unknown',
                timestamp: new Date().toLocaleTimeString(), // You can adjust this based on the BE response
            }));
            setNotifications(fetchedNotifications.reverse().slice(0, 5)); // Giới hạn số lượng thông báo hiển thị
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    // Lấy thông tin người dùng và userId để đăng ký WebSocket
    const fetchUserProfile = async () => {
        const token = localStorage.getItem('authToken');
        if (!token) {
            console.log('No auth token found');
            setIsLoggedIn(false);
            return;
        }

        try {
            const response = await axios.get(
                `${BASE_API_URL}/renterowner/get-profile`,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                },
            );

            if (response.data && response.data.statusCode === 200) {
                const { fullName, role, email } = response.data;
                console.log('User profile data:', response.data);

                if (!email) {
                    console.error('User email is missing from profile data');
                    setIsLoggedIn(false);
                    return;
                }

                setFullName(fullName);
                setRole(role);
                setIsLoggedIn(true);

                // Fetch historical notifications using email as identifier
                await fetchNotifications(email);

                // Kết nối WebSocket sau khi lấy profile
                connectWebSocket(email);
            } else {
                console.error('Invalid response format:', response.data);
                setIsLoggedIn(false);
            }
        } catch (error) {
            console.error('Error fetching user profile:', error);
            setIsLoggedIn(false);
        }
    };

    // Kết nối WebSocket và đăng ký topic thông báo
    const connectWebSocket = (userEmail) => {
        if (typeof window === 'undefined' || !userEmail) {
            console.log(
                'Cannot connect to WebSocket: missing user email or window',
            );
            return;
        }

        try {
            const socket = new SockJS(`${BASE_API_URL}/api/socket`);
            const stompClient = Stomp.over(socket);

            stompClient.connect(
                {},
                (frame) => {
                    console.log('Connected to WebSocket with frame:', frame);
                    stompClientRef.current = stompClient;

                    stompClient.subscribe(
                        `/topic/notifications/${userEmail}`,
                        (message) => {
                            console.log('Received raw message:', message);
                            try {
                                const notification = JSON.parse(
                                    message.body || '{}',
                                );
                                console.log(
                                    'Parsed notification:',
                                    notification,
                                );
                                setNotifications((prev) =>
                                    [
                                        {
                                            message:
                                                notification.message ||
                                                'No message',
                                            type:
                                                notification.type || 'Unknown',
                                            userId:
                                                notification.userId ||
                                                'Unknown',
                                            timestamp:
                                                new Date().toLocaleTimeString(),
                                        },
                                        ...prev,
                                    ].slice(0, 5),
                                ); // Giới hạn số lượng thông báo hiển thị
                            } catch (parseError) {
                                console.error(
                                    'Error parsing WebSocket message:',
                                    parseError,
                                    'Body:',
                                    message.body,
                                );
                            }
                        },
                    );
                },
                (error) => {
                    console.error('WebSocket connection error:', error);
                    // Reconnection logic
                    setTimeout(() => connectWebSocket(userEmail), 5000);
                },
            );
        } catch (error) {
            console.error('Error initializing WebSocket:', error);
        }
    };

    // Xử lý đăng xuất
    const handleLogout = () => {
        if (stompClientRef.current) {
            stompClientRef.current.disconnect(() => {
                console.log('Disconnected from WebSocket');
            });
        }
        localStorage.removeItem('authToken');
        setIsLoggedIn(false);
        setFullName('');
        setNotifications([]);
        window.location.href = '/';
    };

    // useEffect để lấy profile và xử lý click ngoài
    useEffect(() => {
        fetchUserProfile();

        const handleClickOutside = (event) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target)
            ) {
                setDropdownOpen(false);
            }
            if (
                notificationRef.current &&
                !notificationRef.current.contains(event.target)
            ) {
                setNotificationOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            if (stompClientRef.current) {
                stompClientRef.current.disconnect(() => {
                    console.log('Disconnected from WebSocket on unmount');
                });
            }
        };
    }, []);

    // Ẩn Navbar trên trang Login và Register
    if (location.pathname === '/Login' || location.pathname === '/Register') {
        return null;
    }

    return (
        <div className='navbar-container'>
            <div className='leftside'>
                <Link to='/'>
                    <h1 className='logo-text'>ROOMIEGO</h1>
                </Link>
            </div>
            <div className='rightside'>
                <Link to='/Room' className='nav-link'>
                    <img src={living} alt='' className='img-living' />
                    <span>Phòng trọ</span>
                </Link>
                <Link to='/Roommates' className='nav-link'>
                    <img src={friends} alt='' className='img-living' />
                    <span>Bạn cùng phòng</span>
                </Link>
                <div className='group relative'>
                    <button onClick={() => (window.location.href = '/chat')}>
                        <svg
                            strokeLinejoin='round'
                            strokeLinecap='round'
                            stroke='currentColor'
                            strokeWidth='2'
                            viewBox='0 0 24 24'
                            height='44'
                            width='44'
                            xmlns='http://www.w3.org/2000/svg'
                            className='w-8 hover:scale-125 duration-200 hover:stroke-blue-500'
                            fill='none'
                        >
                            <path
                                fill='none'
                                d='M0 0h24v24H0z'
                                stroke='none'
                            ></path>
                            <path d='M8 9h8'></path>
                            <path d='M8 13h6'></path>
                            <path d='M18 4a3 3 0 0 1 3 3v8a3 3 0 0 1 -3 3h-5l-5 3v-3h-2a3 3 0 0 1 -3 -3v-8a3 3 0 0 1 3 -3h12z'></path>
                        </svg>
                    </button>
                    <span className='absolute -top-14 left-[50%] -translate-x-[50%] z-20 origin-left scale-0 px-3 rounded-lg border border-gray-300 bg-white py-2 text-sm font-bold shadow-md transition-all duration-300 ease-in-out group-hover:scale-100'>
                        Comment <span> </span>
                    </span>
                </div>
                {isLoggedIn ? (
                    <>
                        {/* Bell notification */}
                        <div
                            className='notification-wrapper'
                            ref={notificationRef}
                        >
                            <div
                                className='notification-bell'
                                onClick={() =>
                                    setNotificationOpen(!notificationOpen)
                                }
                            >
                                <img src={bell} alt='Notifications' />
                                <span>{notifications.length}</span>
                            </div>
                            {notificationOpen && (
                                <div className='notification-bell_dropdown'>
                                    <div className='notification-header'>
                                        <h3>Thông báo</h3>
                                    </div>
                                    {notifications.length > 0 ? (
                                        notifications.map((note, index) => (
                                            <div
                                                key={index}
                                                className='notification-card'
                                            >
                                                <div className='notification-avatar'>
                                                    <img
                                                        src={user2}
                                                        alt='avatar'
                                                    />
                                                </div>
                                                <div className='notification-content'>
                                                    <p className='notification-title'>
                                                        {translateNotificationType(
                                                            note.type,
                                                        )}
                                                    </p>
                                                    <p className='notification-message'>
                                                        {note.message}
                                                    </p>
                                                    <a
                                                        href={`https://zalo.me/${note.message.match(/\b0\d{9}\b/)?.[0]}`}
                                                        target='_blank'
                                                        rel='noopener noreferrer'
                                                        className='text-blue-600 hover:text-blue-800 font-medium underline hover:underline-offset-2 transition duration-150'
                                                    >
                                                        Nhắn Zalo
                                                    </a>
                                                    <div className='notification-footer'>
                                                        <span className='notification-time'>
                                                            {note.timestamp}
                                                        </span>
                                                    </div>
                                                </div>
                                                <button
                                                    className='notification-delete-button'
                                                    onClick={() =>
                                                        handleDeleteNotification(
                                                            index,
                                                        )
                                                    }
                                                >
                                                    <span className='notification-delete-icon'>
                                                        <img
                                                            src={trash}
                                                            alt=''
                                                        />
                                                    </span>
                                                </button>
                                            </div>
                                        ))
                                    ) : (
                                        <p>Không có thông báo mới</p>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* User menu */}
                        <div className='user-menu'>
                            <div
                                className='user-avatar'
                                onClick={() => setDropdownOpen(!dropdownOpen)}
                            >
                                <img src={user2} alt='User Avatar' />
                            </div>
                            {dropdownOpen && (
                                <div
                                    className='dropdown-menu'
                                    ref={dropdownRef}
                                >
                                    <span className='user-name'>
                                        {fullName}
                                    </span>
                                    <button
                                        onClick={() =>
                                            (window.location.href = '/profile')
                                        }
                                    >
                                        <img src={user2} alt='' /> Hồ sơ
                                    </button>
                                    {(role === 'OWNER' || role === 'ADMIN') && (
                                        <button
                                            onClick={() =>
                                                (window.location.href =
                                                    '/dashboard')
                                            }
                                        >
                                            <img
                                                src={dashboard}
                                                alt=''
                                                className='dashboard-user'
                                            />{' '}
                                            Bảng điều khiển
                                        </button>
                                    )}
                                    <button onClick={handleLogout}>
                                        <img src={logout} alt='' /> Đăng xuất
                                    </button>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <>
                        <Link to='/Register' className='nav-link'>
                            Đăng ký
                        </Link>
                        <Link to='/Login' className='nav-link'>
                            <button className='get-started-btn'>
                                Đăng Nhập
                            </button>
                        </Link>
                    </>
                )}
            </div>
        </div>
    );
}

export default Navbar;
