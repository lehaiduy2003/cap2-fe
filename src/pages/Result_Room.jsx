import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import '../styles/Result_Room.css';
import { axiosInstance } from '../lib/axios';
import {
    showErrorToast,
    showSuccessToast,
    showInfoToast,
} from '../components/toast';
import { BASE_API_URL, VAT_API_URL } from '../constants';
import LocationSummary from '../components/LocationSummary';
import ReactMarkdown from 'react-markdown';

const DEFAULT_IMAGE = '/default-room.jpg';

function Result_Room() {
    const { id } = useParams();
    const navigate = useNavigate();

    // 1. LẤY DỮ LIỆU USER AN TOÀN
    const token = localStorage.getItem('authToken');
    const rawRole = localStorage.getItem('userRole');
    const authUser = JSON.parse(localStorage.getItem('authUser') || '{}');
    const currentUserId = authUser?.id;

    // Helper: Get initials
    const getInitials = (name) => {
        if (!name) return '?';
        const parts = name.trim().split(' ');
        return parts.length === 1
            ? parts[0].charAt(0).toUpperCase()
            : (
                  parts[0].charAt(0) + parts[parts.length - 1].charAt(0)
              ).toUpperCase();
    };

    const [room, setRoom] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Form states
    const [showReportForm, setShowReportForm] = useState(false);
    const [reportReason, setReportReason] = useState('');
    const [showViewRequestForm, setShowViewRequestForm] = useState(false);
    const [viewRequestMessage, setViewRequestMessage] = useState('');

    // Gallery state
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);

    // Reviews state
    const [reviews, setReviews] = useState([]);
    const [reviewsPagination, setReviewsPagination] = useState(null);
    const [currentReviewPage, setCurrentReviewPage] = useState(1);
    const [loadingReviews, setLoadingReviews] = useState(false);
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [userReview, setUserReview] = useState(null);

    // Safety & Location state
    const [safetyData, setSafetyData] = useState(null);
    const [loadingSafety, setLoadingSafety] = useState(false);
    const [locationData, setLocationData] = useState(null);

    // Image Logic
    const processedImageUrls = useMemo(() => {
        if (!room?.imageUrls || room.imageUrls.length === 0) {
            return [DEFAULT_IMAGE];
        }
        return room.imageUrls.map((url) => {
            if (url.startsWith('http://') || url.startsWith('https://')) {
                return url;
            }
            return `${BASE_API_URL}/images/${url}`;
        });
    }, [room]);

    // Address Logic
    const formattedAddress = useMemo(() => {
        if (!room) return '';
        if (room.ward && room.district && room.city) {
            const streetPart = room.street || room.addressDetails || '';
            if (
                streetPart.includes(room.district) ||
                streetPart.includes(room.city)
            ) {
                return streetPart;
            }
            return [
                room.street || room.addressDetails,
                room.ward,
                room.district,
                room.city,
            ]
                .filter((part) => part && part.trim() !== '')
                .join(', ');
        }
        return room.addressDetails || '';
    }, [room]);

    // Fetch Room Details
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
                setError('Không thể tải thông tin phòng.');
            } finally {
                setLoading(false);
            }
        };
        fetchRoomDetails();
    }, [id]);

    // Fetch Safety Data
    useEffect(() => {
        if (!room) return;
        const fetchSafetyData = async () => {
            setLoadingSafety(true);
            try {
                const nearbyResponse = await axiosInstance.post(
                    '/maps/locations',
                    {
                        address: formattedAddress,
                    },
                );
                setLocationData(nearbyResponse.data);

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

                const safetyResponse = await fetch(
                    `${VAT_API_URL}/api/v1/properties/${id}/safety`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
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
                }
            } catch (error) {
                console.error('Error fetching safety data:', error);
            } finally {
                setLoadingSafety(false);
            }
        };
        fetchSafetyData();
    }, [room, formattedAddress, id]);

    // Fetch Reviews
    const fetchReviews = useCallback(
        async (page = 1) => {
            setLoadingReviews(true);
            try {
                const response = await fetch(
                    `${VAT_API_URL}/api/v1/reviews/${id}?page=${page}&limit=5`,
                    {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            ...(token && { Authorization: `Bearer ${token}` }),
                            'x-user-id': currentUserId || '',
                        },
                    },
                );

                if (response.ok) {
                    const data = await response.json();
                    const reviewsData = data.reviews || [];
                    const currentUserReview = reviewsData.find(
                        (review) => review.user_id === currentUserId,
                    );
                    setUserReview(currentUserReview || null);
                    const otherReviews = reviewsData.filter(
                        (review) => review.user_id !== currentUserId,
                    );
                    setReviews(otherReviews);
                    setReviewsPagination(data.pagination);
                }
            } catch (error) {
                console.error('Error fetching reviews:', error);
            } finally {
                setLoadingReviews(false);
            }
        },
        [id, token, currentUserId],
    );

    useEffect(() => {
        if (room) fetchReviews(currentReviewPage);
    }, [room, currentReviewPage, fetchReviews]);

    // Keyboard navigation
    useEffect(() => {
        const handleKey = (e) => {
            if (!room) return;
            if (e.key === 'ArrowLeft') {
                setSelectedImageIndex((prev) =>
                    prev === 0 ? processedImageUrls.length - 1 : prev - 1,
                );
            }
            if (e.key === 'ArrowRight') {
                setSelectedImageIndex((prev) =>
                    prev === processedImageUrls.length - 1 ? 0 : prev + 1,
                );
            }
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [room, processedImageUrls]);

    const handleNextImage = () => {
        setSelectedImageIndex((prev) =>
            prev === processedImageUrls.length - 1 ? 0 : prev + 1,
        );
    };

    const handlePrevImage = () => {
        setSelectedImageIndex((prev) =>
            prev === 0 ? processedImageUrls.length - 1 : prev - 1,
        );
    };

    if (loading)
        return (
            <div className='loading-container'>Đang tải chi tiết phòng...</div>
        );
    if (error) return <div className='error-container'>{error}</div>;
    if (!room)
        return <div className='error-container'>Không tìm thấy phòng.</div>;

    // -----------------------------------------------------------------
    // FIX LOGIC ẨN NÚT CHAT (ROBUST CHECK)
    // -----------------------------------------------------------------

    // 1. Kiểm tra Role: Chuyển về Uppercase và Trim khoảng trắng để so sánh chính xác
    const isOwnerRole = rawRole
        ? String(rawRole).trim().toUpperCase() === 'OWNER'
        : false;

    // 2. Kiểm tra ID: Chuyển cả 2 ID về String để so sánh (tránh lỗi 123 !== "123")
    const isMyRoom =
        currentUserId &&
        room.ownerId &&
        String(currentUserId) === String(room.ownerId);

    // 3. Quyết định ẩn
    const shouldHideChatButton = isOwnerRole || isMyRoom;

    // Log debug nếu vẫn lỗi (Bạn có thể xóa sau khi fix xong)
    console.log('Check Hide Chat:', {
        isOwnerRole,
        isMyRoom,
        rawRole,
        currentUserId,
        roomOwnerId: room.ownerId,
    });
    // -----------------------------------------------------------------

    return (
        <div className='result-room'>
            <nav className='breadcrumb'>
                <Link to='/Room' style={{ color: '#6b7280' }}>
                    Phòng trọ
                </Link>
                <span className='divider'>/</span>
                <span>Chi tiết phòng</span>
            </nav>

            <header className='page-header'>
                <h1 className='text-black text-2xl font-semibold'>
                    {room.title}
                </h1>
                {/* <p style={{ color: '#666', fontSize: '1.1rem', marginTop: '5px' }}>
                    📍 {formattedAddress}
                </p> */}
            </header>

            <section className='room-layout'>
                <div className='left-column'>
                    {/* Gallery Code Giữ Nguyên */}
                    <div className='image-gallery'>
                        <div className='main-image' tabIndex={0}>
                            {processedImageUrls.length > 1 && (
                                <>
                                    <button
                                        className='gallery-nav-btn prev'
                                        onClick={handlePrevImage}
                                    >
                                        &#8592;
                                    </button>
                                    <button
                                        className='gallery-nav-btn next'
                                        onClick={handleNextImage}
                                    >
                                        &#8594;
                                    </button>
                                </>
                            )}
                            <img
                                src={processedImageUrls[selectedImageIndex]}
                                alt={`Room view ${selectedImageIndex + 1}`}
                                onError={(e) => {
                                    e.target.src = DEFAULT_IMAGE;
                                }}
                                style={{
                                    objectFit: 'contain',
                                    backgroundColor: '#000',
                                }}
                            />
                        </div>
                        {processedImageUrls.length > 1 && (
                            <div className='thumbnail-container'>
                                {processedImageUrls.map((url, index) => (
                                    <div
                                        key={index}
                                        className={`thumbnail ${selectedImageIndex === index ? 'active' : ''}`}
                                        onClick={() =>
                                            setSelectedImageIndex(index)
                                        }
                                    >
                                        <img
                                            src={url}
                                            alt={`Thumbnail ${index + 1}`}
                                            onError={(e) => {
                                                e.target.src = DEFAULT_IMAGE;
                                            }}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    {/* Safety Code Giữ Nguyên */}
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
                                Chưa có dữ liệu phân tích an toàn.
                            </div>
                        )}
                    </section>
                </div>

                <div className='right-column'>
                    <section className='combined-panel section-card booking-card'>
                        <div className='combined-header'>
                            <div className='price-row'>
                                <div className='price'>
                                    {room.price?.toLocaleString('vi-VN')}{' '}
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

                        <p
                            className='room-description'
                            style={{ whiteSpace: 'pre-line' }}
                        >
                            {room.description}
                        </p>

                        <div className='room-details'>
                            <span>
                                <strong>Diện tích:</strong> {room.roomSize} m²
                            </span>
                            {room.numBedrooms > 0 && (
                                <span>
                                    <strong>Phòng ngủ:</strong>{' '}
                                    {room.numBedrooms}
                                </span>
                            )}
                            {room.numBathrooms > 0 && (
                                <span>
                                    <strong>Phòng tắm:</strong>{' '}
                                    {room.numBathrooms}
                                </span>
                            )}
                        </div>

                        <div className='meta-info'>
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
                                    if (!token) {
                                        showInfoToast('Vui lòng đăng nhập.');
                                        navigate('/login');
                                        return;
                                    }
                                    setShowViewRequestForm(true);
                                }}
                                className='primary-cta'
                            >
                                Gửi yêu cầu xem phòng
                            </button>

                            {/* --- NÚT CHAT ĐƯỢC ẨN NẾU shouldHideChatButton LÀ TRUE --- */}
                            {!shouldHideChatButton && (
                                <button
                                    onClick={() => {
                                        if (!token) {
                                            showInfoToast(
                                                'Vui lòng đăng nhập.',
                                            );
                                            navigate('/login');
                                            return;
                                        }
                                        window.open(
                                            `/chat?ownerId=${room.ownerId}&roomId=${room.id}`,
                                            '_blank',
                                        );
                                    }}
                                    className='secondary-cta'
                                >
                                    💬 Trò chuyện ngay
                                </button>
                            )}
                            {/* -------------------------------------------------------- */}

                            <button
                                className='report-button'
                                onClick={() => {
                                    if (!token) {
                                        showInfoToast(
                                            'Bạn cần đăng nhập để gửi báo cáo.',
                                        );
                                        navigate('/login');
                                        return;
                                    }
                                    setShowReportForm(true);
                                }}
                            >
                                🚩 Báo cáo bài viết
                            </button>
                        </div>

                        <div className='location-wrapper'>
                            <LocationSummary
                                address={formattedAddress}
                                nearbyPlaces={locationData?.nearbyPlaces}
                                location={locationData?.location}
                            />
                        </div>
                    </section>
                </div>
            </section>

            {/* Reviews Section và Modal giữ nguyên */}
            {/* ... */}
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
                        <div className='report_inside-buttons'>
                            <button
                                onClick={() => {
                                    /* Logic Gửi */
                                }}
                            >
                                Gửi
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
            <section className='reviews-section section-card'>
                <div className='reviews-header'>
                    <h2 className='reviews-title'>Đánh giá từ người dùng</h2>
                    {token && !userReview && (
                        <button
                            onClick={() => setShowReviewForm(true)}
                            className='write-review-btn'
                        >
                            Viết đánh giá
                        </button>
                    )}
                </div>
                {loadingReviews ? (
                    <div className='loading-reviews'>Đang tải đánh giá...</div>
                ) : reviews.length > 0 || userReview ? (
                    <div className='reviews-list'>
                        {userReview && (
                            <div className='review-item user-review'>
                                <div className='review-header'>
                                    <div className='reviewer-name'>
                                        {userReview.reviewer_name} (Bạn)
                                    </div>
                                    <div className='review-date'>
                                        {new Date(
                                            userReview.created_at,
                                        ).toLocaleDateString('vi-VN')}
                                    </div>
                                </div>
                                <div className='review-text'>
                                    {userReview.review_text}
                                </div>
                            </div>
                        )}
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
                                <div className='review-text'>
                                    {review.review_text}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className='no-reviews'>
                        Chưa có đánh giá nào cho phòng này.
                    </div>
                )}
            </section>
            {/* Modal Reports/Review (Bạn tự thêm lại phần modal ReviewForm cũ nếu cần, hoặc để như cũ) */}
        </div>
    );
}

export default Result_Room;
