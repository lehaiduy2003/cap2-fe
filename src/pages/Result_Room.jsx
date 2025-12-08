import { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import '../styles/Result_Room.css';
import { axiosInstance } from '../lib/axios';
// import { useNotifications } from "../components/NotificationComponent/NotificationContext";
import sink from '../assets/sink.png';
import bedroom from '../assets/bedroom.png';
import {
    showErrorToast,
    showSuccessToast,
    showInfoToast,
} from '../components/toast';
import { BASE_API_URL, VAT_API_URL } from '../constants';
import LocationSummary from '../components/LocationSummary';
import ReactMarkdown from 'react-markdown';

function Result_Room() {
    const { id } = useParams();
    const navigate = useNavigate();
    // const { sendNotification, isConnected } = useNotifications();

    // Helper function to get initials from name
    const getInitials = (name) => {
        if (!name) return '?';
        const parts = name.trim().split(' ');
        if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
        return (
            parts[0].charAt(0) + parts[parts.length - 1].charAt(0)
        ).toUpperCase();
    };

    const [room, setRoom] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [showReportForm, setShowReportForm] = useState(false);
    const [reportReason, setReportReason] = useState('');

    const [showViewRequestForm, setShowViewRequestForm] = useState(false);
    const [viewRequestMessage, setViewRequestMessage] = useState('');

    const [showRentalRequestForm, setShowRentalRequestForm] = useState(false);
    const [rentalRequestMessage, setRentalRequestMessage] = useState('');

    const [selectedImageIndex, setSelectedImageIndex] = useState(0);

    const [reviews, setReviews] = useState([]);
    const [reviewsPagination, setReviewsPagination] = useState(null);
    const [currentReviewPage, setCurrentReviewPage] = useState(1);
    const [loadingReviews, setLoadingReviews] = useState(false);

    const [showReviewForm, setShowReviewForm] = useState(false);
    const [reviewData, setReviewData] = useState({
        safety_rating: 5,
        cleanliness_rating: 5,
        amenities_rating: 5,
        host_rating: 5,
        review_text: '',
    });
    const [submittingReview, setSubmittingReview] = useState(false);
    const [userReview, setUserReview] = useState(null);

    const [safetyData, setSafetyData] = useState(null);
    const [loadingSafety, setLoadingSafety] = useState(false);
    const [locationData, setLocationData] = useState(null);

    // Build address from parts
    const addressParts = room
        ? [room.addressDetails, room.ward, room.district, room.city]
              .filter((part) => part)
              .join(', ')
        : '';

    useEffect(() => {
        const fetchRoomDetails = async () => {
            try {
                const response = await axiosInstance.get(
                    `${BASE_API_URL}/api/rooms/${id}`,
                );
                const roomData = response.data.data;
                if (roomData && roomData.price != null) {
                    setRoom(roomData);
                } else {
                    setError('Dữ liệu phòng không hợp lệ.');
                }
            } catch (err) {
                console.error('Error fetching room details:', err.message);
                setError('Failed to fetch room details.');
            } finally {
                setLoading(false);
            }
        };

        fetchRoomDetails();
    }, [id]);

    // Fetch safety data after room is loaded
    useEffect(() => {
        if (!room) return;

        const fetchSafetyData = async () => {
            setLoadingSafety(true);
            try {
                // First, get nearby places data
                const nearbyResponse = await axiosInstance.post(
                    '/maps/locations',
                    {
                        address: addressParts,
                    },
                );
                // Store the complete location data response
                setLocationData(nearbyResponse.data);

                // Format property data for the API
                const propertyData = {
                    id: room.id,
                    title: room.title,
                    description: room.description,
                    price: room.price,
                    roomSize: room.roomSize,
                    numBedrooms: room.numBedrooms,
                    numBathrooms: room.numBathrooms,
                    availableFrom: room.availableFrom,
                    isRoomAvailable: room.isRoomAvailable,
                    ownerId: room.ownerId,
                    ownerName: room.ownerName,
                    imageUrls: room.imageUrls,
                    location: nearbyResponse.data?.location || null,
                };

                // Call VAT API for safety analysis
                const safetyResponse = await fetch(
                    `${VAT_API_URL}/api/v1/properties/${id}/safety`,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            property: propertyData,
                            nearbyPlaces:
                                nearbyResponse.data?.nearbyPlaces || [],
                        }),
                    },
                );

                if (safetyResponse.ok) {
                    const safetyResult = await safetyResponse.json();
                    setSafetyData(safetyResult);
                } else {
                    console.error('Failed to fetch safety data');
                }
            } catch (error) {
                console.error('Error fetching safety data:', error);
            } finally {
                setLoadingSafety(false);
            }
        };

        fetchSafetyData();
    }, [room, addressParts, id]);

    const fetchReviews = useCallback(
        async (page = 1) => {
            setLoadingReviews(true);
            try {
                const token = localStorage.getItem('authToken');
                const authUser = JSON.parse(
                    localStorage.getItem('authUser') || '{}',
                );
                const userId = authUser.id;

                const response = await fetch(
                    `${VAT_API_URL}/api/v1/reviews/${id}?page=${page}&limit=5`,
                    {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            ...(token && { Authorization: `Bearer ${token}` }),
                            'x-user-id': userId || '',
                        },
                    },
                );

                if (response.ok) {
                    const data = await response.json();
                    const reviewsData = data.reviews || [];

                    // Check if current user has already reviewed
                    const currentUserReview = reviewsData.find(
                        (review) => review.user_id === userId,
                    );
                    setUserReview(currentUserReview || null);

                    // Filter out user's review from the general reviews list
                    const otherReviews = reviewsData.filter(
                        (review) => review.user_id !== userId,
                    );
                    setReviews(otherReviews);
                    setReviewsPagination(data.pagination);
                } else {
                    console.error('Failed to fetch reviews');
                    setReviews([]);
                    setReviewsPagination(null);
                    setUserReview(null);
                }
            } catch (error) {
                console.error('Error fetching reviews:', error);
                setReviews([]);
                setReviewsPagination(null);
                setUserReview(null);
            } finally {
                setLoadingReviews(false);
            }
        },
        [id],
    );

    useEffect(() => {
        if (room) {
            fetchReviews(currentReviewPage);
        }
    }, [room, currentReviewPage, fetchReviews]);

    // Keyboard navigation for gallery
    useEffect(() => {
        const handleKey = (e) => {
            if (!room) return;
            if (e.key === 'ArrowLeft') {
                setSelectedImageIndex((prev) =>
                    prev === 0 ? imageUrls.length - 1 : prev - 1,
                );
            }
            if (e.key === 'ArrowRight') {
                setSelectedImageIndex((prev) =>
                    prev === imageUrls.length - 1 ? 0 : prev + 1,
                );
            }
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [room, selectedImageIndex]);

    const handleReportSubmit = async () => {
        const token = localStorage.getItem('authToken');
        if (!token) {
            showInfoToast('Bạn cần đăng nhập để gửi báo cáo.');
            navigate('/login');
            return;
        }

        try {
            const response = await fetch(`${BASE_API_URL}/api/reports`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    roomId: room.id,
                    reason: reportReason,
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            showInfoToast('Đã gửi báo cáo thành công.');
            setShowReportForm(false);
            setReportReason('');
        } catch (error) {
            showErrorToast('Gửi báo cáo thất bại.');
            console.error('Error submitting report:', error);
        }
    };

    const handleSendViewRequest = async () => {
        const token = localStorage.getItem('authToken');
        if (!token) {
            showInfoToast('Vui lòng đăng nhập để gửi yêu cầu.');
            navigate('/login');
            return;
        }

        if (!viewRequestMessage.trim()) {
            showErrorToast('Vui lòng nhập lời nhắn.');
            return;
        }

        try {
            const response = await fetch(`${BASE_API_URL}/api/view-requests`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    roomId: room.id,
                    message: viewRequestMessage,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Gửi yêu cầu thất bại');
            }

            showSuccessToast('Đã gửi yêu cầu xem phòng thành công.');
            setShowViewRequestForm(false);
            setViewRequestMessage('');
        } catch (error) {
            console.error(error);
            showErrorToast(error.message || 'Đã xảy ra lỗi khi gửi yêu cầu.');
        }
    };

    const handleSendRentalRequest = async () => {
        const token = localStorage.getItem('authToken');
        if (!token) {
            showInfoToast('Vui lòng đăng nhập để gửi yêu cầu.');
            navigate('/login');
            return;
        }

        if (!rentalRequestMessage.trim()) {
            showErrorToast('Vui lòng nhập lời nhắn.');
            return;
        }

        try {
            const response = await fetch(`${BASE_API_URL}/api/rent-requests`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    roomId: room.id,
                    message: rentalRequestMessage,
                }),
            });

            if (!response.ok) {
                if (response.status === 403) {
                    throw new Error(
                        'Bạn không có quyền gửi yêu cầu thuê phòng. Vui lòng đăng nhập với tài khoản người thuê.',
                    );
                }
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Gửi yêu cầu thất bại');
            }

            showInfoToast('Đã gửi yêu cầu thuê phòng thành công.');
            setShowRentalRequestForm(false);
            setRentalRequestMessage('');
        } catch (error) {
            console.error('Error sending rental request:', error);
            showErrorToast(error.message || 'Đã xảy ra lỗi khi gửi yêu cầu.');
        }
    };

    const handleSubmitReview = async (e) => {
        e.preventDefault();
        setSubmittingReview(true);
        const token = localStorage.getItem('authToken');
        const authUser = JSON.parse(localStorage.getItem('authUser'));

        if (!token || !authUser) {
            showInfoToast('Vui lòng đăng nhập để gửi đánh giá.');
            navigate('/login');
            setSubmittingReview(false);
            return;
        }

        try {
            const response = await fetch(`${VAT_API_URL}/api/v1/reviews`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                    'x-user-id': authUser.id,
                },
                body: JSON.stringify({
                    property_id: room.id,
                    ...reviewData,
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            showSuccessToast('Đánh giá đã được gửi thành công!');
            setShowReviewForm(false);
            setReviewData({
                safety_rating: 5,
                cleanliness_rating: 5,
                amenities_rating: 5,
                host_rating: 5,
                review_text: '',
            });
            // Refresh reviews to show the new user review
            fetchReviews(currentReviewPage);
        } catch (error) {
            console.error('Lỗi khi gửi đánh giá:', error);
            showErrorToast('Không thể gửi đánh giá. Vui lòng thử lại.');
        } finally {
            setSubmittingReview(false);
        }
    };

    if (loading) return <p>Đang tải chi tiết phòng...</p>;
    if (error) return <p>{error}</p>;
    if (!room) return <p>Không tìm thấy phòng.</p>;

    const baseURL = `${BASE_API_URL}/images/`;
    const imageUrls =
        room.imageUrls?.length > 0
            ? room.imageUrls.map((url) => baseURL + url)
            : ['/default-room.jpg'];

    return (
        <div className='result-room'>
            <nav className='breadcrumb'>
                <Link to='/Room' style={{ color: 'white' }}>
                    Phòng trọ
                </Link>
                <span className='divider' style={{ color: 'white' }}>
                    /
                </span>
                <span style={{ color: 'white' }}>Chi tiết phòng</span>
            </nav>

            <header className='page-header'>
                <h1 className='text-black text-2xl font-semibold'>
                    {room.title}
                </h1>
                <p>{room.addressDetails}</p>
            </header>

            {/* Two-column layout: left = images (50%), right = details + actions */}
            <section className='room-layout'>
                {/* LEFT: Image gallery */}
                <div className='left-column'>
                    <div
                        className='image-gallery'
                        aria-label='Thư viện hình ảnh phòng'
                    >
                        <div
                            className='main-image'
                            tabIndex={0}
                            aria-label='Ảnh lớn của phòng'
                        >
                            {/* <button
                                className='gallery-nav-btn prev'
                                onClick={() =>
                                    setSelectedImageIndex((prev) =>
                                        prev === 0
                                            ? imageUrls.length - 1
                                            : prev - 1,
                                    )
                                }
                                aria-label='Previous image'
                            >
                                &#8592;
                            </button> */}
                            <img
                                src='https://offer.rever.vn/hubfs/cho_thue_phong_tro_moi_xay_gia_re_ngay_phuong_15_tan_binh3.jpg'
                                alt='Main Room'
                                onError={(e) => {
                                    e.target.src = '/default-room.jpg';
                                }}
                            />
                            {/* <button
                                className='gallery-nav-btn next'
                                onClick={() =>
                                    setSelectedImageIndex((prev) =>
                                        prev === imageUrls.length - 1
                                            ? 0
                                            : prev + 1,
                                    )
                                }
                                aria-label='Next image'
                            >
                                &#8594;
                            </button> */}
                        </div>
                        {/* <div className='thumbnail-container'>
                            {imageUrls.map((url, index) => (
                                <div
                                    key={index}
                                    className={`thumbnail ${selectedImageIndex === index ? 'active' : ''}`}
                                    onClick={() => setSelectedImageIndex(index)}
                                    role='button'
                                    tabIndex={0}
                                    aria-label={`Xem ảnh ${index + 1}`}
                                >
                                    <img
                                        src={url}
                                        alt={`Room ${index + 1}`}
                                        onError={(e) => {
                                            e.target.src = '/default-room.jpg';
                                        }}
                                    />
                                </div>
                            ))}
                        </div> */}
                    </div>
                    {/* Safety Analysis Section */}
                    <section className='safety-section section-card'>
                        <h2 className='safety-title'>
                            Phân tích an toàn khu vực
                        </h2>

                        {loadingSafety ? (
                            <div className='loading-safety'>
                                Đang phân tích an toàn...
                            </div>
                        ) : safetyData ? (
                            <div className='safety-content'>
                                {/* Safety Scores */}
                                <div className='safety-scores'>
                                    <div className='score-item'>
                                        <div className='score-label'>
                                            Điểm tổng thể
                                        </div>
                                        <div className='score-value'>
                                            {safetyData.overall_score}/10
                                        </div>
                                        <div className='score-bar'>
                                            <div
                                                className='score-fill'
                                                style={{
                                                    width: `${(safetyData.overall_score / 10) * 100}%`,
                                                }}
                                            ></div>
                                        </div>
                                    </div>
                                    <div className='score-breakdown'>
                                        <div className='score-item small'>
                                            <div className='score-label'>
                                                An ninh
                                            </div>
                                            <div className='score-value'>
                                                {safetyData.crime_score}/10
                                            </div>
                                        </div>
                                        <div className='score-item small'>
                                            <div className='score-label'>
                                                Cộng đồng
                                            </div>
                                            <div className='score-value'>
                                                {safetyData.user_score}/10
                                            </div>
                                        </div>
                                        <div className='score-item small'>
                                            <div className='score-label'>
                                                Môi trường
                                            </div>
                                            <div className='score-value'>
                                                {safetyData.environment_score}
                                                /10
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* AI Summary */}
                                {safetyData.ai_summary && (
                                    <div className='ai-summary'>
                                        <h3>Đánh giá AI</h3>
                                        <div className='summary-text'>
                                            <ReactMarkdown>
                                                {safetyData.ai_summary}
                                            </ReactMarkdown>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className='no-safety-data'>
                                Không thể tải dữ liệu phân tích an toàn.
                            </div>
                        )}
                    </section>
                </div>

                {/* RIGHT: Combined details + actions */}
                <div className='right-column'>
                    <section className='combined-panel section-card booking-card'>
                        <div className='combined-header'>
                            <div className='price-row'>
                                <div className='price'>
                                    {room.price.toLocaleString('vi-VN')}{' '}
                                    <span className='currency'>VND</span>
                                </div>
                                <div className='per'>/ tháng</div>
                            </div>
                            <span
                                className={`status-badge ${room.isRoomAvailable ? 'available' : 'unavailable'}`}
                            >
                                {room.isRoomAvailable
                                    ? 'Còn trống'
                                    : 'Hết phòng'}
                            </span>
                        </div>

                        <p className='room-description'>{room.description}</p>
                        <div className='room-details'>
                            <span>
                                <strong>Diện tích:</strong> {room.roomSize} m²
                            </span>
                            {/* <span>
                                <img src={bedroom} alt='Số người' />
                                <strong>Số người:</strong> {room.numBedrooms}
                            </span>
                            <span>
                                <img src={sink} alt='Phòng tắm' />
                                <strong>Phòng tắm:</strong> {room.numBathrooms}
                            </span> */}
                        </div>
                        <div className='meta-info'>
                            {/* <p>
                                <strong>Có sẵn từ ngày:</strong>{' '}
                                {new Date(
                                    room.availableFrom,
                                ).toLocaleDateString('vi-VN')}
                            </p> */}
                            <div className='owner-info'>
                                <div className='owner-avatar'>
                                    {getInitials(room.ownerName)}
                                </div>
                                <div className='owner-details'>
                                    <strong>Chủ sở hữu:</strong>{' '}
                                    {room.ownerName}
                                </div>
                            </div>
                        </div>

                        <div className='cta-group'>
                            <button
                                onClick={() => {
                                    const token =
                                        localStorage.getItem('authToken');
                                    if (!token) {
                                        showInfoToast(
                                            'Vui lòng đăng nhập để gửi yêu cầu.',
                                        );
                                        navigate('/login');
                                        return;
                                    }
                                    setShowViewRequestForm(true);
                                }}
                                className='primary-cta'
                            >
                                Gửi yêu cầu xem phòng
                            </button>
                            <button
                                className='report-button'
                                onClick={() => {
                                    const token =
                                        localStorage.getItem('authToken');
                                    if (!token) {
                                        showInfoToast(
                                            'Bạn cần đăng nhập để gửi báo cáo.',
                                        );
                                        navigate('/login');
                                        return;
                                    }
                                    setShowReportForm(true);
                                }}
                                aria-label='Báo cáo bài viết'
                            >
                                <i className='fa-solid fa-flag'> </i> Báo cáo
                                bài viết
                            </button>
                        </div>
                        {/* Location map + nearby summary */}
                        <div className='location-wrapper'>
                            <LocationSummary
                                address={addressParts}
                                nearbyPlaces={locationData?.nearbyPlaces}
                                location={locationData?.location}
                            />
                        </div>
                    </section>
                </div>
            </section>

            {/* Reviews Section */}
            <section className='reviews-section section-card'>
                <div className='reviews-header'>
                    <h2 className='reviews-title'>Đánh giá từ người dùng</h2>
                    {localStorage.getItem('authToken') && !userReview && (
                        <button
                            onClick={() => setShowReviewForm(true)}
                            className='write-review-btn'
                        >
                            Viết đánh giá
                        </button>
                    )}
                </div>

                {/* User's Review */}
                {userReview && (
                    <div className='user-review-section'>
                        <h3 className='user-review-title'>Đánh giá của bạn</h3>
                        <div className='review-item user-review'>
                            <div className='review-header'>
                                <div className='reviewer-name'>
                                    {userReview.reviewer_name}
                                </div>
                                <div className='review-date'>
                                    {new Date(
                                        userReview.created_at,
                                    ).toLocaleDateString('vi-VN')}
                                </div>
                            </div>
                            <div className='review-ratings'>
                                <div className='rating-item'>
                                    <span>An toàn:</span>
                                    <div className='stars'>
                                        {'★'.repeat(userReview.safety_rating)}
                                        {'☆'.repeat(
                                            5 - userReview.safety_rating,
                                        )}
                                    </div>
                                </div>
                                <div className='rating-item'>
                                    <span>Sạch sẽ:</span>
                                    <div className='stars'>
                                        {'★'.repeat(
                                            userReview.cleanliness_rating,
                                        )}
                                        {'☆'.repeat(
                                            5 - userReview.cleanliness_rating,
                                        )}
                                    </div>
                                </div>
                                <div className='rating-item'>
                                    <span>Tiện nghi:</span>
                                    <div className='stars'>
                                        {'★'.repeat(
                                            userReview.amenities_rating,
                                        )}
                                        {'☆'.repeat(
                                            5 - userReview.amenities_rating,
                                        )}
                                    </div>
                                </div>
                                <div className='rating-item'>
                                    <span>Chủ nhà:</span>
                                    <div className='stars'>
                                        {'★'.repeat(userReview.host_rating)}
                                        {'☆'.repeat(5 - userReview.host_rating)}
                                    </div>
                                </div>
                            </div>
                            {userReview.review_text && (
                                <div className='review-text'>
                                    {userReview.review_text}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {loadingReviews ? (
                    <div className='loading-reviews'>Đang tải đánh giá...</div>
                ) : reviews.length > 0 ? (
                    <>
                        <div className='reviews-list'>
                            {reviews.map((review, index) => (
                                <div key={index} className='review-item'>
                                    <div className='review-header'>
                                        <div className='reviewer-name'>
                                            {review.reviewer_name}
                                        </div>
                                        <div className='review-date'>
                                            {new Date(
                                                review.created_at,
                                            ).toLocaleDateString('vi-VN')}
                                        </div>
                                    </div>
                                    <div className='review-ratings'>
                                        <div className='rating-item'>
                                            <span>An toàn:</span>
                                            <div className='stars'>
                                                {'★'.repeat(
                                                    review.safety_rating,
                                                )}
                                                {'☆'.repeat(
                                                    5 - review.safety_rating,
                                                )}
                                            </div>
                                        </div>
                                        <div className='rating-item'>
                                            <span>Sạch sẽ:</span>
                                            <div className='stars'>
                                                {'★'.repeat(
                                                    review.cleanliness_rating,
                                                )}
                                                {'☆'.repeat(
                                                    5 -
                                                        review.cleanliness_rating,
                                                )}
                                            </div>
                                        </div>
                                        <div className='rating-item'>
                                            <span>Tiện nghi:</span>
                                            <div className='stars'>
                                                {'★'.repeat(
                                                    review.amenities_rating,
                                                )}
                                                {'☆'.repeat(
                                                    5 - review.amenities_rating,
                                                )}
                                            </div>
                                        </div>
                                        <div className='rating-item'>
                                            <span>Chủ nhà:</span>
                                            <div className='stars'>
                                                {'★'.repeat(review.host_rating)}
                                                {'☆'.repeat(
                                                    5 - review.host_rating,
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    {review.review_text && (
                                        <div className='review-text'>
                                            {review.review_text}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Pagination */}
                        {reviewsPagination &&
                            reviewsPagination.totalPages > 1 && (
                                <div className='pagination'>
                                    <button
                                        onClick={() =>
                                            setCurrentReviewPage((prev) =>
                                                Math.max(1, prev - 1),
                                            )
                                        }
                                        disabled={!reviewsPagination.hasPrev}
                                        className='pagination-btn'
                                    >
                                        ‹ Trước
                                    </button>

                                    <span className='pagination-info'>
                                        Trang {reviewsPagination.currentPage} /{' '}
                                        {reviewsPagination.totalPages}
                                    </span>

                                    <button
                                        onClick={() =>
                                            setCurrentReviewPage((prev) =>
                                                Math.min(
                                                    reviewsPagination.totalPages,
                                                    prev + 1,
                                                ),
                                            )
                                        }
                                        disabled={!reviewsPagination.hasNext}
                                        className='pagination-btn'
                                    >
                                        Sau ›
                                    </button>
                                </div>
                            )}
                    </>
                ) : !userReview ? (
                    <div className='no-reviews'>
                        Chưa có đánh giá nào cho phòng này.
                    </div>
                ) : null}
            </section>

            {showReportForm && (
                <div className='report-overlay'>
                    <div className='report-form'>
                        <h3 className='text-red-600'>
                            <i className='fa-solid fa-flag'> </i>{' '}
                            <b>Báo cáo bài viết</b>
                        </h3>
                        <textarea
                            value={reportReason}
                            onChange={(e) => setReportReason(e.target.value)}
                            placeholder='Nhập lý do báo cáo...'
                        />
                        <div className='report_inside-buttons'>
                            <button onClick={handleReportSubmit}>
                                Gửi báo cáo
                            </button>
                            <button onClick={() => setShowReportForm(false)}>
                                Hủy
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showViewRequestForm && (
                <div className='report-overlay'>
                    <div className='report-form'>
                        <h3>Yêu cầu xem phòng</h3>
                        <textarea
                            value={viewRequestMessage}
                            onChange={(e) =>
                                setViewRequestMessage(e.target.value)
                            }
                            placeholder='Nhập lời nhắn cho chủ phòng...'
                        />
                        <div className='report-buttons'>
                            <button
                                className='send-request'
                                onClick={handleSendViewRequest}
                            >
                                Gửi yêu cầu
                            </button>
                            <button
                                onClick={() => setShowViewRequestForm(false)}
                            >
                                Hủy
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showRentalRequestForm && (
                <div className='report-overlay'>
                    <div className='report-form'>
                        <h3>Yêu cầu thuê phòng</h3>
                        <textarea
                            value={rentalRequestMessage}
                            onChange={(e) =>
                                setRentalRequestMessage(e.target.value)
                            }
                            placeholder='Nhập lời nhắn cho chủ phòng...'
                        />
                        <div className='report-buttons'>
                            <button
                                className='send-request'
                                onClick={handleSendRentalRequest}
                            >
                                Gửi yêu cầu
                            </button>
                            <button
                                onClick={() => setShowRentalRequestForm(false)}
                            >
                                Hủy
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showReviewForm && (
                <div className='report-overlay'>
                    <div className='report-form'>
                        <h3>Đánh giá phòng</h3>
                        <form onSubmit={handleSubmitReview}>
                            <div className='review-rating-field'>
                                <label>An toàn</label>
                                <select
                                    value={reviewData.safety_rating}
                                    onChange={(e) =>
                                        setReviewData({
                                            ...reviewData,
                                            safety_rating: parseInt(
                                                e.target.value,
                                            ),
                                        })
                                    }
                                >
                                    {[1, 2, 3, 4, 5].map((n) => (
                                        <option key={n} value={n}>
                                            {n} sao
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className='review-rating-field'>
                                <label>Sạch sẽ</label>
                                <select
                                    value={reviewData.cleanliness_rating}
                                    onChange={(e) =>
                                        setReviewData({
                                            ...reviewData,
                                            cleanliness_rating: parseInt(
                                                e.target.value,
                                            ),
                                        })
                                    }
                                >
                                    {[1, 2, 3, 4, 5].map((n) => (
                                        <option key={n} value={n}>
                                            {n} sao
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className='review-rating-field'>
                                <label>Tiện nghi</label>
                                <select
                                    value={reviewData.amenities_rating}
                                    onChange={(e) =>
                                        setReviewData({
                                            ...reviewData,
                                            amenities_rating: parseInt(
                                                e.target.value,
                                            ),
                                        })
                                    }
                                >
                                    {[1, 2, 3, 4, 5].map((n) => (
                                        <option key={n} value={n}>
                                            {n} sao
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className='review-rating-field'>
                                <label>Chủ nhà</label>
                                <select
                                    value={reviewData.host_rating}
                                    onChange={(e) =>
                                        setReviewData({
                                            ...reviewData,
                                            host_rating: parseInt(
                                                e.target.value,
                                            ),
                                        })
                                    }
                                >
                                    {[1, 2, 3, 4, 5].map((n) => (
                                        <option key={n} value={n}>
                                            {n} sao
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className='review-text-field'>
                                <label>Nhận xét</label>
                                <textarea
                                    value={reviewData.review_text}
                                    onChange={(e) =>
                                        setReviewData({
                                            ...reviewData,
                                            review_text: e.target.value,
                                        })
                                    }
                                    placeholder='Viết nhận xét của bạn...'
                                    rows={3}
                                />
                            </div>
                            <div className='report-buttons'>
                                <button
                                    type='submit'
                                    disabled={submittingReview}
                                    className='send-request'
                                >
                                    {submittingReview
                                        ? 'Đang gửi...'
                                        : 'Gửi đánh giá'}
                                </button>
                                <button
                                    type='button'
                                    onClick={() => setShowReviewForm(false)}
                                >
                                    Hủy
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Result_Room;
