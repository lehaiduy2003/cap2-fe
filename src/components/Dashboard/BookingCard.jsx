import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import './css/BookingCard.css';
import { BASE_API_URL } from '../../constants'; // Import BASE_API_URL

const DEFAULT_IMAGE_URL =
    'https://saigon-ecogreen.com.vn/uploads/baiviet/gia-thue-phong-tro-tp-ho-chi-minh.jpg';

const BookingCard = ({
    initialHotel,
    onEditClick,
    onDeleteClick,
    onToggleStatus,
}) => {
    const hotel = initialHotel;

    const [imgSrc, setImgSrc] = useState(DEFAULT_IMAGE_URL);

    // FIX: Hàm xử lý URL ảnh thông minh (Smart URL Logic)
    const getProcessedImageUrl = (url) => {
        if (!url) return DEFAULT_IMAGE_URL;
        // Nếu là link tuyệt đối (Uploadcare/External) thì giữ nguyên
        if (url.trim().toLowerCase().startsWith('http')) {
            return url;
        }
        // Nếu là link tương đối, nối thêm API URL
        return `${BASE_API_URL}/images/${url}`;
    };

    // Sync image source when props change
    useEffect(() => {
        if (hotel.imageUrls && hotel.imageUrls.length > 0) {
            // Xử lý URL trước khi set state
            setImgSrc(getProcessedImageUrl(hotel.imageUrls[0]));
        } else {
            setImgSrc(DEFAULT_IMAGE_URL);
        }
    }, [hotel.imageUrls]);

    const handleImageError = () => {
        // Nếu ảnh load lỗi, fallback về ảnh mặc định ngay
        if (imgSrc !== DEFAULT_IMAGE_URL) {
            setImgSrc(DEFAULT_IMAGE_URL);
        }
    };

    const formattedPrice = new Intl.NumberFormat('vi-VN').format(
        hotel.price || 0,
    );

    return (
        <div
            className={`booking-card ${!hotel.isRoomAvailable ? 'unavailable-mode' : ''}`}
        >
            {/* Status Badge */}
            <div
                className={`status-badge-card ${hotel.isRoomAvailable ? 'status-green' : 'status-red'}`}
            >
                {hotel.isRoomAvailable ? 'Đang hiển thị' : 'Đã ẩn / Hết phòng'}
            </div>

            <div className='booking-image'>
                <img
                    src={imgSrc}
                    alt={hotel.title}
                    onError={handleImageError}
                    loading='lazy'
                />
                <div className='price-tag'>{formattedPrice} VND/Tháng</div>
            </div>

            <div className='booking-info'>
                <div>
                    <div className='hotel-name' title={hotel.title}>
                        {hotel.title}
                    </div>
                    <div className='hotel-location'>
                        📍 {hotel.location || 'Chưa cập nhật vị trí'}
                    </div>
                    <div>
                        <strong>Diện tích:</strong> {hotel.roomSize || 0}m²
                    </div>
                    <div className='address-details'>
                        {hotel.addressDetails}
                    </div>

                    <div className='hotel-description'>
                        {hotel.description || 'Không có mô tả'}
                    </div>
                </div>

                <div className='card-actions'>
                    <button
                        className='edit-btn'
                        onClick={() => onEditClick(hotel)}
                        title='Chỉnh sửa phòng'
                        type='button'
                    >
                        ✏️ Sửa
                    </button>

                    <button
                        className={`toggle-btn ${hotel.isRoomAvailable ? 'btn-warning' : 'btn-success'}`}
                        onClick={onToggleStatus}
                        title={
                            hotel.isRoomAvailable
                                ? 'Đánh dấu hết phòng'
                                : 'Đánh dấu còn trống'
                        }
                        type='button'
                    >
                        {hotel.isRoomAvailable ? '⛔ Hết phòng' : '✅ Mở lại'}
                    </button>

                    <button
                        className='delete-btn'
                        onClick={onDeleteClick}
                        title='Xóa phòng vĩnh viễn'
                        type='button'
                    >
                        🗑️ Xóa
                    </button>
                </div>
            </div>
        </div>
    );
};

BookingCard.propTypes = {
    initialHotel: PropTypes.object.isRequired,
    onEditClick: PropTypes.func.isRequired,
    onDeleteClick: PropTypes.func.isRequired,
    onToggleStatus: PropTypes.func.isRequired,
};

export default BookingCard;
