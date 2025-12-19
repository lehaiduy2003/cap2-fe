// MatchDetails.jsx
// import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './RoommateForm.css'; // Import CSS
import { FaComments } from 'react-icons/fa'; // Import message icon
import { useEffect, useState } from 'react';
import { BASE_API_URL } from '../../constants';

const MatchDetails = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const match = location.state?.match;

    console.log('Match data received:', match); // Debug log

    const [detailedRecommendations, setDetailedRecommendations] = useState([]);

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
            <div className='roommate-form-container'>
                <div className='match-details-container'>
                    <h2>Không tìm thấy thông tin phù hợp</h2>
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
        <div className='roommate-form-container'>
            <div className='match-details-container card-listing-container'>
                <h2>Danh sách người phù hợp</h2>
                <div className='card-listing-grid'>
                    {detailedRecommendations.map((recommendation, index) => (
                        <div
                            key={recommendation.id || index}
                            className='match-card'
                        >
                            <div className='match-card-avatar-wrapper'>
                                <img
                                    className='match-card-avatar'
                                    src={
                                        recommendation.avatarUrl ||
                                        'https://randomuser.me/api/portraits/lego/1.jpg'
                                    }
                                    alt={recommendation.fullName || 'Avatar'}
                                />
                            </div>
                            <div
                                className='match-card-header'
                                style={{ width: '100%' }}
                            >
                                <span
                                    className='match-card-name'
                                    style={{
                                        flex: 1,
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                    }}
                                >
                                    {`Người phù hợp #${index + 1}`}
                                </span>
                                <button
                                    className='message-button'
                                    onClick={() =>
                                        handleCardClick(recommendation)
                                    }
                                    title='Nhắn tin'
                                    style={{ marginLeft: 8 }}
                                >
                                    <FaComments
                                        size={24}
                                        className='message-icon'
                                    />
                                </button>
                            </div>
                            <div className='match-card-job'>
                                {recommendation.job ||
                                    'Chưa cập nhật nghề nghiệp'}
                            </div>
                            <div className='match-card-field'>
                                <b>Số điện thoại:</b>{' '}
                                {recommendation.phone || '--'}
                            </div>
                            <div className='match-card-field'>
                                <b>Sở thích:</b>{' '}
                                {Array.isArray(recommendation.hobbies)
                                    ? recommendation.hobbies.join(', ')
                                    : recommendation.hobbies || 'Không có'}
                            </div>
                            <div className='match-card-field'>
                                <b>Thành phố:</b> {recommendation.city || '--'}
                            </div>
                            <div className='match-card-field'>
                                <b>Quận:</b> {recommendation.district || '--'}
                            </div>
                            <div className='match-card-field'>
                                <b>Quê quán:</b>{' '}
                                {recommendation.hometown || '--'}
                            </div>
                            <div className='match-card-field'>
                                <b>Giới tính:</b>{' '}
                                {recommendation.gender || '--'}
                            </div>
                            <div className='match-card-desc'>
                                {recommendation.more ||
                                    recommendation.description ||
                                    'Không có mô tả'}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default MatchDetails;
