// Sidebar.jsx
import back from '../../assets/back.png';
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './css/Sidebar.css';

const Sidebar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const current = location.pathname.split('/').pop(); // Lấy phần sau cùng của path
    const [userRole, setUserRole] = useState(null);

    useEffect(() => {
        // Get user role from localStorage
        const userData = JSON.parse(localStorage.getItem('userData'));
        if (userData) {
            setUserRole(userData.role);
        }
    }, []);

    const menuItems = [
        { label: 'Đặt phòng', key: 'bookings' },
        { label: 'Yêu Cầu', key: 'requests' },
        ...(userRole === 'ADMIN' ? [{ label: 'Báo Cáo', key: 'report' }] : []),
        { label: 'Hóa đơn', key: 'invoices' },
        { label: 'Cài đặt', key: '/' },
    ];

    return (
        <div className='sidebar1'>
            <div className='back-sidebar'>
                <a href='http://localhost:5173/room'>
                    <img className='back-sidebar' src={back} alt='' />
                </a>
            </div>
            <div className='logo-sideBar'>
                <br />
                <h1 className='logo-text1'>ROOMIEGO</h1>
            </div>
            <ul>
                {menuItems.map((item) => (
                    <li
                        key={item.key}
                        className={current === item.key ? 'active' : ''}
                        onClick={() => navigate(`/dashboard/${item.key}`)}
                    >
                        {item.label}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default Sidebar;
