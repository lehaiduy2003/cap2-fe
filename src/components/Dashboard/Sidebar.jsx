// Sidebar.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
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
        ...(userRole === 'ADMIN'
            ? [
                  { label: 'Báo Cáo', key: 'report' },
                  { label: 'Thêm sự cố', key: 'add-incident' },
              ]
            : []),
        { label: 'Hóa đơn', key: 'invoices' },
        { label: 'Cài đặt', key: '/' },
    ];

    const handleBackClick = () => {
        navigate('/room');
    };

    return (
        <div className='sidebar1'>
            <div className='sidebar-header'>
                <button
                    className='back-button'
                    onClick={handleBackClick}
                    title='Quay lại trang chủ'
                >
                    <ArrowLeft className='back-icon' />
                </button>
                <div className='logo-container'>
                    <h1 className='logo-text1'>ROOMIEGO</h1>
                </div>
            </div>

            <nav className='sidebar-nav'>
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
            </nav>
        </div>
    );
};

export default Sidebar;
