import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Profile from './Profile';
import RentHistory from './RentHistory';

const ProfileLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [activeTab, setActiveTab] = useState(location.pathname);

    const handleTabChange = (path) => {
        setActiveTab(path);
        navigate(path);
    };

    const renderContent = () => {
        if (activeTab === '/profile') {
            return <Profile />;
        } else if (activeTab === '/rent-history') {
            return <RentHistory />;
        }
        return <Profile />;
    };

    return (
        <div className='min-h-screen bg-gray-50 py-8'>
            <div className='max-w-6xl mx-auto px-4'>
                <div className='bg-white rounded-lg shadow-lg overflow-hidden'>
                    <div className='flex'>
                        {/* Sidebar */}
                        <div className='w-64 bg-gray-50 border-r border-gray-200 p-6'>
                            <h2 className='text-lg font-semibold text-gray-800 mb-6'>
                                Tài khoản
                            </h2>
                            <nav className='space-y-2'>
                                <button
                                    onClick={() => handleTabChange('/profile')}
                                    className={`w-full text-left px-4 py-3 rounded-lg font-medium transition duration-200 ${
                                        activeTab === '/profile'
                                            ? 'bg-blue-600 text-white shadow-md'
                                            : 'text-gray-700 hover:bg-gray-100'
                                    }`}
                                >
                                    <i className='fas fa-user mr-3'></i>
                                    Hồ sơ cá nhân
                                </button>
                                <button
                                    onClick={() =>
                                        handleTabChange('/rent-history')
                                    }
                                    className={`w-full text-left px-4 py-3 rounded-lg font-medium transition duration-200 ${
                                        activeTab === '/rent-history'
                                            ? 'bg-blue-600 text-white shadow-md'
                                            : 'text-gray-700 hover:bg-gray-100'
                                    }`}
                                >
                                    <i className='fas fa-history mr-3'></i>
                                    Lịch sử thuê
                                </button>
                            </nav>
                        </div>

                        {/* Content */}
                        <div className='flex-1'>{renderContent()}</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileLayout;
