import { useEffect, useState } from 'react';
import { BASE_API_URL, VAT_API_URL } from '../constants';

const RentHistory = () => {
    const [rentHistory, setRentHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [reviewData, setReviewData] = useState({
        safety_rating: 5,
        cleanliness_rating: 5,
        amenities_rating: 5,
        host_rating: 5,
        review_text: '',
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const fetchRentHistory = async () => {
            const authUser = JSON.parse(localStorage.getItem('authUser'));
            const token = localStorage.getItem('authToken');
            if (!token || !authUser) {
                setError('Không có token hoặc thông tin người dùng');
                setLoading(false);
                return;
            }

            try {
                const response = await fetch(
                    `${BASE_API_URL}/api/rent-histories/user/${authUser.id}`,
                    {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${token}`,
                        },
                    },
                );

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const result = await response.json();
                setRentHistory(result || []);
            } catch (error) {
                console.error('Không lấy được lịch sử thuê:', error);
                setError('Không thể tải lịch sử thuê');
            } finally {
                setLoading(false);
            }
        };

        fetchRentHistory();
    }, []);

    const handleSubmitReview = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        const token = localStorage.getItem('authToken');
        const authUser = JSON.parse(localStorage.getItem('authUser'));
        try {
            const response = await fetch(`${VAT_API_URL}/api/v1/reviews`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                    'x-user-id': authUser.id,
                },
                body: JSON.stringify({
                    property_id: selectedItem.roomId,
                    rentHistoryId: selectedItem.id,
                    ...reviewData,
                }),
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            alert('Đánh giá đã được gửi thành công!');
            setShowModal(false);
            setReviewData({
                safety_rating: 5,
                cleanliness_rating: 5,
                amenities_rating: 5,
                host_rating: 5,
                review_text: '',
            });
        } catch (error) {
            console.error('Lỗi khi gửi đánh giá:', error);
            alert('Không thể gửi đánh giá. Vui lòng thử lại.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            <div className='p-6'>
                <h2 className='text-xl font-semibold text-gray-800 mb-6'>
                    Danh sách phòng đã thuê
                </h2>

                {error && (
                    <div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6'>
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className='text-center py-8'>
                        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto'></div>
                        <p className='text-gray-600 mt-4'>
                            Đang tải lịch sử...
                        </p>
                    </div>
                ) : rentHistory.length > 0 ? (
                    <div className='space-y-4'>
                        {rentHistory.map((item, index) => (
                            <div
                                key={index}
                                className='border border-gray-200 rounded-lg p-4 hover:shadow-md transition duration-200'
                            >
                                <div className='flex justify-between items-start'>
                                    <div className='flex-1'>
                                        <h3 className='text-lg font-semibold text-gray-800'>
                                            {item.roomTitle ||
                                                `Phòng ${item.roomId}`}
                                        </h3>
                                        <p className='text-gray-600 mt-1'>
                                            {item.address || 'Địa chỉ không có'}
                                        </p>
                                        {item.description && (
                                            <p className='text-gray-500 mt-1 text-sm'>
                                                {item.description}
                                            </p>
                                        )}
                                        <div className='flex items-center space-x-4 mt-2 text-sm text-gray-500'>
                                            <span>
                                                <i className='fas fa-calendar-alt mr-1'></i>
                                                {item.rentDate
                                                    ? new Date(
                                                          item.rentDate,
                                                      ).toLocaleDateString(
                                                          'vi-VN',
                                                      )
                                                    : 'N/A'}{' '}
                                                -{' '}
                                                {item.returnDate
                                                    ? new Date(
                                                          item.returnDate,
                                                      ).toLocaleDateString(
                                                          'vi-VN',
                                                      )
                                                    : 'N/A'}
                                            </span>
                                        </div>
                                    </div>
                                    {item.returnDate &&
                                        new Date() >
                                            new Date(item.returnDate) && (
                                            <div className='ml-4 self-center'>
                                                <button
                                                    onClick={() => {
                                                        setSelectedItem(item);
                                                        setShowModal(true);
                                                    }}
                                                    disabled={item.reviewed}
                                                    className={`px-4 py-2 rounded text-sm ${
                                                        item.reviewed
                                                            ? 'bg-gray-400 text-gray-700'
                                                            : 'bg-blue-500 hover:bg-blue-600 text-white'
                                                    }`}
                                                >
                                                    {item.reviewed
                                                        ? 'Đã đánh giá'
                                                        : 'Đánh giá'}
                                                </button>
                                            </div>
                                        )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className='text-center py-12'>
                        <i className='fas fa-inbox text-6xl text-gray-300 mb-4'></i>
                        <h3 className='text-lg font-medium text-gray-900 mb-2'>
                            Chưa có lịch sử thuê
                        </h3>
                        <p className='text-gray-500'>
                            Bạn chưa thuê phòng nào.
                        </p>
                    </div>
                )}
            </div>
            {showModal && (
                <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
                    <div className='bg-white p-6 rounded-lg max-w-md w-full mx-4'>
                        <h3 className='text-lg font-semibold mb-4'>
                            Đánh giá phòng
                        </h3>
                        <form onSubmit={handleSubmitReview}>
                            <div className='mb-4'>
                                <label className='block text-sm font-medium mb-1'>
                                    An toàn
                                </label>
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
                                    className='w-full border border-gray-300 rounded px-3 py-2'
                                >
                                    {[1, 2, 3, 4, 5].map((n) => (
                                        <option key={n} value={n}>
                                            {n}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className='mb-4'>
                                <label className='block text-sm font-medium mb-1'>
                                    Sạch sẽ
                                </label>
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
                                    className='w-full border border-gray-300 rounded px-3 py-2'
                                >
                                    {[1, 2, 3, 4, 5].map((n) => (
                                        <option key={n} value={n}>
                                            {n}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className='mb-4'>
                                <label className='block text-sm font-medium mb-1'>
                                    Tiện nghi
                                </label>
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
                                    className='w-full border border-gray-300 rounded px-3 py-2'
                                >
                                    {[1, 2, 3, 4, 5].map((n) => (
                                        <option key={n} value={n}>
                                            {n}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className='mb-4'>
                                <label className='block text-sm font-medium mb-1'>
                                    Chủ nhà
                                </label>
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
                                    className='w-full border border-gray-300 rounded px-3 py-2'
                                >
                                    {[1, 2, 3, 4, 5].map((n) => (
                                        <option key={n} value={n}>
                                            {n}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className='mb-4'>
                                <label className='block text-sm font-medium mb-1'>
                                    Nhận xét
                                </label>
                                <textarea
                                    value={reviewData.review_text}
                                    onChange={(e) =>
                                        setReviewData({
                                            ...reviewData,
                                            review_text: e.target.value,
                                        })
                                    }
                                    className='w-full border border-gray-300 rounded px-3 py-2'
                                    rows={3}
                                    placeholder='Viết nhận xét của bạn...'
                                />
                            </div>
                            <div className='flex justify-end space-x-2'>
                                <button
                                    type='button'
                                    onClick={() => setShowModal(false)}
                                    className='px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50'
                                >
                                    Hủy
                                </button>
                                <button
                                    type='submit'
                                    disabled={submitting}
                                    className='px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50'
                                >
                                    {submitting
                                        ? 'Đang gửi...'
                                        : 'Gửi đánh giá'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default RentHistory;
