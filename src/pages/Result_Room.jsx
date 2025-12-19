import { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import '../styles/Result_Room.css';
import { axiosInstance } from '../lib/axios';
import axios from 'axios';
import {
    showErrorToast,
    showSuccessToast,
    showInfoToast,
} from '../components/toast';
import { BASE_API_URL, VAT_API_URL } from '../constants';
import LocationSummary from '../components/LocationSummary';

// IMPORT COMPONENT SAFETY
import SafetyWidget from '../components/Safety/SafetyWidget';
import FloodReportModal from '../components/Safety/FloodReportModal';
//import FloodHistoryList from '../components/Safety/FloodHistoryList';
import ReviewSection from '../components/Safety/ReviewSection';

const DEFAULT_IMAGE =
    'https://imperiaskygardens.com/wp-content/uploads/2023/01/unnamed-3.jpg';

// Helper: Component chọn sao
// eslint-disable-next-line react-refresh/only-export-components
const StarRatingInput = ({ label, value, onChange }) => {
    return (
        <div className='flex flex-col mb-3'>
            <label className='text-sm font-bold text-gray-700 mb-1'>
                {label}
            </label>
            <div className='flex gap-1'>
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        type='button'
                        onClick={() => onChange(star)}
                        className={`text-2xl transition-colors ${
                            star <= value ? 'text-yellow-400' : 'text-gray-300'
                        }`}
                    >
                        ★
                    </button>
                ))}
            </div>
        </div>
    );
};

function Result_Room() {
    const { id } = useParams();
    const navigate = useNavigate();
    const authUser = JSON.parse(localStorage.getItem('authUser') || '{}');
    const currentUserId = authUser?.id;

    // Helper: Initials
    const getInitials = (name) => {
        if (!name) return '?';
        const parts = name.trim().split(' ');
        return parts.length === 1
            ? parts[0].charAt(0).toUpperCase()
            : (
                  parts[0].charAt(0) + parts[parts.length - 1].charAt(0)
              ).toUpperCase();
    };

    // --- STATES ---
    const [room, setRoom] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [activeTab, setActiveTab] = useState('reviews');
    const [floodHistory, setFloodHistory] = useState([]);
    const [showFloodModal, setShowFloodModal] = useState(false);

    const [showReportForm, setShowReportForm] = useState(false);
    const [reportReason, setReportReason] = useState('');
    const [showViewRequestForm, setShowViewRequestForm] = useState(false);
    const [viewRequestMessage, setViewRequestMessage] = useState('');
    const [showRentalRequestForm, setShowRentalRequestForm] = useState(false);
    const [rentalRequestMessage, setRentalRequestMessage] = useState('');

    const [selectedImageIndex, setSelectedImageIndex] = useState(0);

    const [reviews, setReviews] = useState([]);
    const [userReview, setUserReview] = useState(null);

    const [showReviewForm, setShowReviewForm] = useState(false);
    const [reviewData, setReviewData] = useState({
        safety_rating: 5,
        cleanliness_rating: 5,
        amenities_rating: 5,
        host_rating: 5,
        review_text: '',
    });
    const [submittingReview, setSubmittingReview] = useState(false);
    const [locationData, setLocationData] = useState(null);

    // 1. Fetch Room Info
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
    useEffect(() => {
        if (room?.latitude) {
            axios
                .get(`${VAT_API_URL}/api/v1/flood-reports`, {
                    params: { lat: room.latitude, lng: room.longitude },
                })
                .then((res) => setFloodHistory(res.data || []));
        }
    }, [room]);
    // 2. Fetch Location Data (cho Map)
    useEffect(() => {
        if (!room) return;
        const fetchLocationData = async () => {
            try {
                const addressParts = [
                    room.addressDetails,
                    room.ward,
                    room.district,
                    room.city,
                ]
                    .filter((p) => p)
                    .join(', ');
                const nearbyResponse = await axiosInstance.post(
                    '/maps/locations',
                    { address: addressParts },
                );
                setLocationData(nearbyResponse.data);
            } catch (error) {
                console.error('Error fetching location data:', error);
            }
        };
        fetchLocationData();
    }, [room]);

    // 3. Fetch Reviews
    const fetchReviews = useCallback(
        async (page = 1) => {
            try {
                const token = localStorage.getItem('authToken');
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
                } else {
                    setReviews([]);
                }
            } catch (error) {
                console.error('Error fetching reviews:', error);
            }
        },
        [id, currentUserId],
    );

    useEffect(() => {
        if (room) fetchReviews(1);
    }, [room, fetchReviews]);

    // 4. Fetch Flood History
    useEffect(() => {
        if (room?.latitude && room?.longitude) {
            const fetchFloodHistory = async () => {
                try {
                    const floodRes = await axios.get(
                        `${VAT_API_URL}/api/v1/flood-reports`,
                        {
                            params: { lat: room.latitude, lng: room.longitude },
                        },
                    );
                    setFloodHistory(floodRes.data || []);
                } catch (e) {
                    console.error('Lỗi lấy lịch sử ngập:', e);
                }
            };
            fetchFloodHistory();
        }
    }, [room]);
    // 1. Click nút "Sửa": Đổ dữ liệu cũ vào form và hiện popup
    const handleEditReview = (existingReview) => {
        setReviewData({
            safety_rating: existingReview.safety_rating,
            cleanliness_rating: existingReview.cleanliness_rating,
            amenities_rating: existingReview.amenities_rating,
            host_rating: existingReview.host_rating,
            review_text: existingReview.review_text || '',
        });
        setShowReviewForm(true);
    };
    // Keyboard nav for images
    useEffect(() => {
        const handleKey = (e) => {
            if (!room) return;
            const imageUrls = room.imageUrls || [];
            if (imageUrls.length === 0) return;
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
    }, [room, selectedImageIndex]);

    // --- HANDLERS ---
    const handleFloodReportSuccess = async () => {
        if (room?.latitude && room?.longitude) {
            try {
                const floodRes = await axios.get(
                    `${VAT_API_URL}/api/v1/flood-reports`,
                    {
                        params: { lat: room.latitude, lng: room.longitude },
                    },
                );
                setFloodHistory(floodRes.data || []);
                setActiveTab('flood');
            } catch (e) {
                console.error(e);
            }
        }
    };

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
                body: JSON.stringify({ roomId: room.id, reason: reportReason }),
            });
            if (!response.ok) throw new Error(`HTTP error!`);
            showInfoToast('Đã gửi báo cáo thành công.');
            setShowReportForm(false);
            setReportReason('');
        } catch (error) {
            console.error(error);
            showErrorToast('Gửi báo cáo thất bại.');
        }
    };

    const handleSendViewRequest = async () => {
        const token = localStorage.getItem('authToken');
        if (!token) {
            showInfoToast('Vui lòng đăng nhập.');
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
            if (!response.ok) throw new Error('Gửi yêu cầu thất bại');
            showSuccessToast('Đã gửi yêu cầu xem phòng.');
            setShowViewRequestForm(false);
            setViewRequestMessage('');
        } catch (error) {
            showErrorToast(error.message);
        }
    };

    const handleSendRentalRequest = async () => {
        const token = localStorage.getItem('authToken');
        if (!token) {
            showInfoToast('Vui lòng đăng nhập.');
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
            if (!response.ok) throw new Error('Gửi yêu cầu thất bại');
            showInfoToast('Đã gửi yêu cầu thuê phòng.');
            setShowRentalRequestForm(false);
            setRentalRequestMessage('');
        } catch (error) {
            showErrorToast(error.message);
        }
    };

    const handleSubmitReview = async (e) => {
        e.preventDefault();
        setSubmittingReview(true);
        const token = localStorage.getItem('authToken');
        if (!token) {
            showInfoToast('Vui lòng đăng nhập.');
            navigate('/login');
            return;
        }
        try {
            const response = await fetch(`${VAT_API_URL}/api/v1/reviews`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                    'x-user-id': currentUserId,
                },
                body: JSON.stringify({ property_id: room.id, ...reviewData }),
            });
            if (!response.ok) throw new Error('Lỗi gửi đánh giá');
            showSuccessToast('Gửi đánh giá thành công!');
            setShowReviewForm(false);
            fetchReviews(1);
        } catch (error) {
            console.error(error);
            showErrorToast('Gửi đánh giá thất bại.');
        } finally {
            setSubmittingReview(false);
        }
    };

    if (loading) return <div className='loading-spinner'>Loading...</div>;
    if (error || !room) return <div className='error-message'>{error}</div>;

    const addressParts = [
        room.addressDetails,
        room.ward,
        room.district,
        room.city,
    ]
        .filter(Boolean)
        .join(', ');
    const baseURL = `${BASE_API_URL}/images/`;
    const imageUrls =
        room.imageUrls?.length > 0
            ? room.imageUrls.map((url) => baseURL + url)
            : [DEFAULT_IMAGE];

    return (
        <div className='result-room font-sans text-gray-800 bg-gray-50 min-h-screen pb-10'>
            <nav className='breadcrumb max-w-7xl mx-auto px-4 py-4 text-sm text-gray-500'>
                <Link to='/Room' className='hover:text-blue-600'>
                    Phòng trọ
                </Link>
                <span className='mx-2'>/</span>
                <span className='text-gray-900 font-medium'>
                    Chi tiết phòng
                </span>
            </nav>

            <header className='page-header max-w-7xl mx-auto px-4 mb-6'>
                <h1 className='text-3xl font-bold text-gray-900 mb-2'>
                    {room.title}
                </h1>
            </header>

            {/* --- MAIN LAYOUT --- */}
            <div className='max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-3 gap-8'>
                {/* --- LEFT COLUMN --- */}
                <div className='lg:col-span-2 flex flex-col gap-6'>
                    {/* Image Gallery */}
                    <div className='bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden'>
                        <div
                            className='main-image-container relative w-full bg-gray-100'
                            style={{ height: '400px' }}
                        >
                            <img
                                src={imageUrls[0]}
                                alt='Main Room'
                                className='w-full h-full object-cover'
                                onError={(e) => {
                                    e.target.src = DEFAULT_IMAGE;
                                }}
                            />
                            {imageUrls.length > 1 && (
                                <div className='absolute bottom-4 right-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm font-medium'>
                                    <i className='fas fa-images mr-2'></i>{' '}
                                    {imageUrls.length} ảnh
                                </div>
                            )}
                        </div>
                    </div>

                    {/* SAFETY WIDGET */}
                    <SafetyWidget propertyId={id} />
                </div>

                {/* --- RIGHT COLUMN --- */}
                <div className='lg:col-span-1'>
                    <div className='bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sticky top-4 flex flex-col h-full max-h-[calc(100vh-2rem)] overflow-y-auto custom-scrollbar'>
                        <div className='mb-6 text-center border-b border-gray-100 pb-6'>
                            <div className='text-3xl font-bold text-blue-600 mb-1'>
                                {room.price.toLocaleString('vi-VN')}{' '}
                                <span className='text-lg text-gray-500 font-normal'>
                                    VND/tháng
                                </span>
                            </div>
                            <span
                                className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${room.isRoomAvailable ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                            >
                                {room.isRoomAvailable
                                    ? 'Còn phòng'
                                    : 'Hết phòng'}
                            </span>
                        </div>

                        {/* Owner Info */}
                        <div className='flex items-center gap-3 mb-6 bg-gray-50 p-3 rounded-xl'>
                            <div className='w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg'>
                                {getInitials(room.ownerName)}
                            </div>
                            <div>
                                <div className='text-xs text-gray-500'>
                                    Chủ nhà
                                </div>
                                <div className='font-bold text-gray-900'>
                                    {room.ownerName}
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className='flex flex-col gap-3 mb-6'>
                            <button
                                onClick={() => {
                                    if (!authUser.id) {
                                        showInfoToast('Vui lòng đăng nhập.');
                                        navigate('/login');
                                        return;
                                    }
                                    setShowViewRequestForm(true);
                                }}
                                className='w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition shadow-md'
                            >
                                Gửi yêu cầu xem phòng
                            </button>
                            <button
                                onClick={() => {
                                    if (!authUser.id) {
                                        showInfoToast('Vui lòng đăng nhập.');
                                        navigate('/login');
                                        return;
                                    }
                                    window.open(
                                        `/chat?ownerId=${room.ownerId}&roomId=${room.id}`,
                                        '_blank',
                                    );
                                }}
                                className='w-full bg-white border border-blue-600 text-blue-600 hover:bg-blue-50 font-bold py-3 rounded-xl transition'
                            >
                                <i className='fa-solid fa-comment mr-2'></i> Trò
                                chuyện ngay
                            </button>
                            <button
                                onClick={() => {
                                    if (!authUser.id) {
                                        showInfoToast('Vui lòng đăng nhập.');
                                        navigate('/login');
                                        return;
                                    }
                                    setShowReportForm(true);
                                }}
                                className='text-gray-400 text-sm hover:text-red-500 transition mt-2 flex items-center justify-center gap-2'
                            >
                                <i className='fa-solid fa-flag'></i> Báo cáo bài
                                viết
                            </button>
                        </div>

                        {/* Details */}
                        <div className='space-y-4 mb-6'>
                            <h3 className='font-bold text-gray-800 border-l-4 border-blue-500 pl-3'>
                                Thông tin chi tiết
                            </h3>
                            <div className='grid grid-cols-2 gap-4 text-sm'>
                                <div className='flex flex-col p-3 bg-gray-50 rounded-lg'>
                                    <span className='text-gray-500 text-xs'>
                                        Diện tích
                                    </span>
                                    <span className='font-bold'>
                                        {room.roomSize} m²
                                    </span>
                                </div>
                                <div className='flex flex-col p-3 bg-gray-50 rounded-lg'>
                                    <span className='text-gray-500 text-xs'>
                                        Phòng ngủ
                                    </span>
                                    <span className='font-bold'>
                                        {room.numBedrooms || 1}
                                    </span>
                                </div>
                            </div>
                            <div className='text-sm text-gray-600 leading-relaxed max-h-32 overflow-hidden relative group'>
                                <div className='line-clamp-4'>
                                    {room.description}
                                </div>
                            </div>
                        </div>

                        {/* Map Mini */}
                        <div className='mt-auto pt-4 border-t border-gray-100'>
                            <LocationSummary
                                address={addressParts}
                                nearbyPlaces={locationData?.nearbyPlaces}
                                location={locationData?.location}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* --- REVIEWS & FLOOD HISTORY SECTION --- */}
            <div className='max-w-7xl mx-auto px-4 mt-8'>
                <div className='max-w-7xl mx-auto px-4 mt-8'>
                    <ReviewSection
                        reviews={reviews}
                        userReview={userReview}
                        floodHistory={floodHistory}
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                        authUser={authUser}
                        onWriteReview={() => {
                            setReviewData({
                                safety_rating: 5,
                                cleanliness_rating: 5,
                                amenities_rating: 5,
                                host_rating: 5,
                                review_text: '',
                            });
                            setShowReviewForm(true);
                        }}
                        onEditReview={handleEditReview} // <-- Truyền hàm Sửa
                        // onDeleteReview={handleDeleteReview} // <-- Truyền hàm Xóa
                        onReportFlood={() => setShowFloodModal(true)}
                    />
                </div>
            </div>

            {/* --- MODALS --- */}
            <FloodReportModal
                isOpen={showFloodModal}
                onClose={() => {
                    setShowFloodModal(false);
                    handleFloodReportSuccess();
                }}
                nodeServerUrl='${VAT_API_URL}'
                defaultLocation={{
                    lat: room.latitude,
                    lng: room.longitude,
                    address: addressParts,
                }}
            />

            {showReviewForm && (
                <div className='fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4'>
                    <div className='bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl animate-fade-in-up'>
                        <h3 className='text-xl font-bold mb-6 text-center text-gray-800'>
                            Đánh giá trải nghiệm
                        </h3>
                        <form onSubmit={handleSubmitReview}>
                            <div className='grid grid-cols-2 gap-x-8 gap-y-4 mb-6'>
                                <StarRatingInput
                                    label='Hàng xóm'
                                    value={reviewData.safety_rating}
                                    onChange={(v) =>
                                        setReviewData({
                                            ...reviewData,
                                            safety_rating: v,
                                        })
                                    }
                                />
                                <StarRatingInput
                                    label='Sạch sẽ'
                                    value={reviewData.cleanliness_rating}
                                    onChange={(v) =>
                                        setReviewData({
                                            ...reviewData,
                                            cleanliness_rating: v,
                                        })
                                    }
                                />
                                <StarRatingInput
                                    label='Tiện nghi'
                                    value={reviewData.amenities_rating}
                                    onChange={(v) =>
                                        setReviewData({
                                            ...reviewData,
                                            amenities_rating: v,
                                        })
                                    }
                                />
                                <StarRatingInput
                                    label='Chủ nhà'
                                    value={reviewData.host_rating}
                                    onChange={(v) =>
                                        setReviewData({
                                            ...reviewData,
                                            host_rating: v,
                                        })
                                    }
                                />
                            </div>

                            <div className='mb-6'>
                                <label className='block text-sm font-bold text-gray-700 mb-2'>
                                    Nhận xét chi tiết
                                </label>
                                <textarea
                                    className='w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none resize-none'
                                    value={reviewData.review_text}
                                    onChange={(e) =>
                                        setReviewData({
                                            ...reviewData,
                                            review_text: e.target.value,
                                        })
                                    }
                                    placeholder='Chia sẻ trải nghiệm thực tế của bạn về phòng trọ này...'
                                    rows={4}
                                />
                            </div>
                            <div className='flex gap-3 justify-end'>
                                <button
                                    type='button'
                                    onClick={() => setShowReviewForm(false)}
                                    className='px-5 py-2 rounded-xl text-gray-600 font-bold hover:bg-gray-100 transition'
                                >
                                    Hủy
                                </button>
                                <button
                                    type='submit'
                                    disabled={submittingReview}
                                    className='px-6 py-2 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition shadow-md disabled:bg-gray-400'
                                >
                                    {submittingReview
                                        ? 'Đang gửi...'
                                        : 'Gửi đánh giá'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showReportForm && (
                <div className='fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4'>
                    <div className='bg-white rounded-xl p-6 w-full max-w-md'>
                        <h3 className='font-bold text-red-600 mb-4'>
                            <i className='fa-solid fa-flag mr-2'></i> Báo cáo
                            bài viết
                        </h3>
                        <textarea
                            className='w-full border p-2 rounded mb-4'
                            value={reportReason}
                            onChange={(e) => setReportReason(e.target.value)}
                            placeholder='Lý do...'
                            rows={3}
                        />
                        <div className='flex justify-end gap-2'>
                            <button
                                onClick={() => setShowReportForm(false)}
                                className='px-4 py-2 text-gray-600'
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleReportSubmit}
                                className='px-4 py-2 bg-red-600 text-white rounded'
                            >
                                Gửi
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {(showViewRequestForm || showRentalRequestForm) && (
                <div className='fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4'>
                    <div className='bg-white rounded-xl p-6 w-full max-w-md'>
                        <h3 className='font-bold mb-4'>
                            {showViewRequestForm
                                ? 'Yêu cầu xem phòng'
                                : 'Yêu cầu thuê phòng'}
                        </h3>
                        <textarea
                            className='w-full border p-2 rounded mb-4'
                            value={
                                showViewRequestForm
                                    ? viewRequestMessage
                                    : rentalRequestMessage
                            }
                            onChange={(e) =>
                                showViewRequestForm
                                    ? setViewRequestMessage(e.target.value)
                                    : setRentalRequestMessage(e.target.value)
                            }
                            placeholder='Lời nhắn...'
                            rows={3}
                        />
                        <div className='flex justify-end gap-2'>
                            <button
                                onClick={() => {
                                    setShowViewRequestForm(false);
                                    setShowRentalRequestForm(false);
                                }}
                                className='px-4 py-2 text-gray-600'
                            >
                                Hủy
                            </button>
                            <button
                                onClick={
                                    showViewRequestForm
                                        ? handleSendViewRequest
                                        : handleSendRentalRequest
                                }
                                className='px-4 py-2 bg-blue-600 text-white rounded'
                            >
                                Gửi
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Result_Room;
