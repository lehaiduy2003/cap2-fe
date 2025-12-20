// MatchDetails.jsx
// import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaComments } from 'react-icons/fa'; // Import message icon
import { useEffect, useState } from 'react';
import { BASE_API_URL } from '../../constants';

const MatchDetails = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const match = location.state?.match;

    console.log('Match data received:', match); // Debug log

    const [detailedRecommendations, setDetailedRecommendations] = useState([]);

    // Function to get initials from name
    const getInitials = (name) => {
        if (!name) return '?';
        return name.charAt(0).toUpperCase();
    };

    // Function to generate background color based on first letter
    const getAvatarColor = (name) => {
        if (!name) return 'bg-gray-400';
        const colors = [
            'bg-red-500',
            'bg-blue-500',
            'bg-green-500',
            'bg-yellow-500',
            'bg-purple-500',
            'bg-pink-500',
            'bg-indigo-500',
            'bg-teal-500',
            'bg-orange-500',
            'bg-cyan-500',
        ];
        const charCode = name.charCodeAt(0);
        return colors[charCode % colors.length];
    };

    useEffect(() => {
        const fetchDetails = async () => {
            const token = localStorage.getItem('authToken');
            const recommendations = Array.isArray(match)
                ? match.slice(0, 5)
                : [match];
            const promises = recommendations.map(async (rec) => {
                if (!rec.user_id) return rec;
                const res = await fetch(
                    `${BASE_API_URL}/owner/get-users/${rec.user_id}`,
                    {
                        headers: { Authorization: `Bearer ${token}` },
                    },
                );
                const data = await res.json();
                if (data.usersList && data.usersList.length > 0) {
                    return { ...rec, ...data.usersList[0] };
                }
                return rec;
            });
            const results = await Promise.all(promises);
            setDetailedRecommendations(results);
        };
        fetchDetails();
    }, [match]);

    if (!match) {
        return (
            <div className='max-w-4xl mx-auto p-6'>
                <div className='bg-white rounded-lg shadow-md p-8 text-center'>
                    <h2 className='text-2xl font-semibold text-gray-800'>
                        Không tìm thấy thông tin phù hợp
                    </h2>
                </div>
            </div>
        );
    }

    const handleCardClick = async (recommendation) => {
        // Log dữ liệu recommendation để debug
        console.log('Recommendation data:', recommendation);

        let userInfo = {
            id: recommendation.user_id || recommendation.id,
            fullName: recommendation.fullName || recommendation.username,
            avatarUrl:
                recommendation.avatarUrl ||
                'https://randomuser.me/api/portraits/lego/1.jpg',
            phone: recommendation.phone,
            job: recommendation.job,
            email: recommendation.email || recommendation.username || '', // fallback
            username: recommendation.username || recommendation.email || '', // Thêm username
        };

        // Nếu không có email hoặc username, fetch thêm từ API
        if ((!userInfo.email || !userInfo.username) && userInfo.id) {
            try {
                const token = localStorage.getItem('authToken');
                if (!token) {
                    throw new Error('No authentication token found');
                }

                const res = await fetch(
                    `${BASE_API_URL}/owner/get-users/${userInfo.id}`,
                    {
                        method: 'GET',
                        headers: {
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'application/json',
                            Accept: 'application/json',
                        },
                    },
                );

                console.log('Fetch status:', res.status);

                if (res.status === 403) {
                    throw new Error('Unauthorized access. Please login again.');
                }

                if (!res.ok) {
                    throw new Error(`HTTP error! status: ${res.status}`);
                }

                const data = await res.json();
                console.log('API user detail:', data);

                // Kiểm tra và lấy thông tin user từ usersList
                if (data.usersList && data.usersList.length > 0) {
                    const userDetail = data.usersList[0];
                    // Cập nhật userInfo với dữ liệu từ API
                    userInfo = {
                        ...userInfo,
                        id: userDetail.id || userInfo.id,
                        fullName:
                            userDetail.fullName ||
                            userDetail.username ||
                            userInfo.fullName,
                        email: userDetail.email || userDetail.username || '',
                        username: userDetail.username || userDetail.email || '', // Thêm username
                        avatarUrl: userDetail.avatarUrl || userInfo.avatarUrl,
                        phone: userDetail.phone || userInfo.phone,
                        job: userDetail.job || userInfo.job,
                    };
                } else {
                    throw new Error('No user data found');
                }
            } catch (error) {
                console.error('Error fetching user details:', error);
                if (error.message.includes('Unauthorized')) {
                    localStorage.removeItem('authToken');
                    window.location.href = '/Login';
                } else {
                    alert(
                        'Không thể lấy thông tin người dùng! Vui lòng thử lại sau.',
                    );
                }
                return;
            }
        }

        // Kiểm tra các trường bắt buộc trước khi navigate
        if (!userInfo.id || !userInfo.username) {
            alert('Không thể chat vì thiếu thông tin người dùng!');
            return;
        }

        // Log để debug
        console.log('Navigating to chat with user:', userInfo);

        navigate('/chatpage', {
            state: {
                selectedUser: {
                    id: userInfo.id,
                    fullName: userInfo.fullName,
                    email: userInfo.email,
                    username: userInfo.username, // Thêm username
                    avatarUrl: userInfo.avatarUrl,
                    phone: userInfo.phone,
                    job: userInfo.job,
                },
            },
        });
    };

    return (
        <div className='max-w-4xl mx-auto p-6'>
            <div className='bg-white rounded-lg shadow-md'>
                <div className='border-b border-gray-200 p-6'>
                    <h2 className='text-2xl font-bold text-gray-800'>
                        Danh sách người phù hợp
                    </h2>
                    <p className='text-sm text-gray-600 mt-1'>
                        {detailedRecommendations.length} kết quả
                    </p>
                </div>
                <ul className='divide-y divide-gray-200'>
                    {detailedRecommendations.map((recommendation, index) => (
                        <li
                            key={recommendation.id || index}
                            className='p-4 hover:bg-gray-50 transition-colors duration-150'
                        >
                            <div className='flex items-start gap-3'>
                                {/* Avatar */}
                                <div className='shrink-0'>
                                    {recommendation.avatarUrl ? (
                                        <img
                                            className='w-12 h-12 rounded-full object-cover border-2 border-gray-200'
                                            src={recommendation.avatarUrl}
                                            alt={
                                                recommendation.fullName ||
                                                'Avatar'
                                            }
                                            onError={(e) => {
                                                e.target.style.display = 'none';
                                                e.target.nextSibling.style.display =
                                                    'flex';
                                            }}
                                        />
                                    ) : null}
                                    <div
                                        className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold ${
                                            recommendation.avatarUrl
                                                ? 'hidden'
                                                : ''
                                        } ${getAvatarColor(recommendation.fullName || recommendation.username)}`}
                                        style={{
                                            display: recommendation.avatarUrl
                                                ? 'none'
                                                : 'flex',
                                        }}
                                    >
                                        {getInitials(
                                            recommendation.fullName ||
                                                recommendation.username,
                                        )}
                                    </div>
                                </div>

                                {/* Content */}
                                <div className='flex-1 min-w-0'>
                                    <div className='flex items-center justify-between gap-2 mb-1.5'>
                                        <h3 className='text-base font-semibold text-gray-900 truncate'>
                                            Người phù hợp #{index + 1}
                                        </h3>
                                        <button
                                            onClick={() =>
                                                handleCardClick(recommendation)
                                            }
                                            className='shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-150 font-medium text-md'
                                            title='Nhắn tin'
                                        >
                                            <FaComments size={16} />
                                            <span>Nhắn tin</span>
                                        </button>
                                    </div>

                                    <p className='text-sm text-gray-600 mb-2'>
                                        {recommendation.job ||
                                            'Chưa cập nhật nghề nghiệp'}
                                    </p>

                                    <div className='grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm'>
                                        <div className='flex items-start gap-1.5'>
                                            <span className='font-semibold text-gray-700 min-w-fit'>
                                                Số điện thoại:
                                            </span>
                                            <span className='text-gray-600'>
                                                {recommendation.phone || '--'}
                                            </span>
                                        </div>
                                        <div className='flex items-start gap-1.5'>
                                            <span className='font-semibold text-gray-700 min-w-fit'>
                                                Giới tính:
                                            </span>
                                            <span className='text-gray-600'>
                                                {recommendation.gender || '--'}
                                            </span>
                                        </div>
                                        <div className='flex items-start gap-1.5'>
                                            <span className='font-semibold text-gray-700 min-w-fit'>
                                                Thành phố:
                                            </span>
                                            <span className='text-gray-600'>
                                                {recommendation.city || '--'}
                                            </span>
                                        </div>
                                        <div className='flex items-start gap-1.5'>
                                            <span className='font-semibold text-gray-700 min-w-fit'>
                                                Quận:
                                            </span>
                                            <span className='text-gray-600'>
                                                {recommendation.district ||
                                                    '--'}
                                            </span>
                                        </div>
                                        <div className='flex items-start gap-1.5 sm:col-span-2'>
                                            <span className='font-semibold text-gray-700 min-w-fit'>
                                                Quê quán:
                                            </span>
                                            <span className='text-gray-600'>
                                                {recommendation.hometown ||
                                                    '--'}
                                            </span>
                                        </div>
                                        <div className='flex items-start gap-1.5 sm:col-span-2'>
                                            <span className='font-semibold text-gray-700 min-w-fit'>
                                                Sở thích:
                                            </span>
                                            <span className='text-gray-600'>
                                                {Array.isArray(
                                                    recommendation.hobbies,
                                                )
                                                    ? recommendation.hobbies.join(
                                                          ', ',
                                                      )
                                                    : recommendation.hobbies ||
                                                      'Không có'}
                                            </span>
                                        </div>
                                    </div>

                                    {(recommendation.more ||
                                        recommendation.description) && (
                                        <div className='mt-2 pt-2 border-t border-gray-100'>
                                            <p className='text-sm text-gray-600 leading-relaxed'>
                                                {recommendation.more ||
                                                    recommendation.description}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default MatchDetails;
