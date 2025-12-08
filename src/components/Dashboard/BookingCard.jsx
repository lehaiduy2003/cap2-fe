import { useState } from 'react';
import './css/BookingCard.css';
import { BASE_API_URL } from '../../constants';

const BookingCard = ({
    initialHotel,
    onEditClick,
    onDeleteClick,
    markUnavailable,
}) => {
    const [hotelInfo] = useState(initialHotel);

    // Get the first image URL or use default
    const getImageUrl = () => {
        if (hotelInfo.imageUrls?.length > 0) {
            return `${BASE_API_URL}/images/${hotelInfo.imageUrls[0]}`;
        }
        return '/default-room.jpg';
    };

    return (
        <div className='booking-card'>
            <div className='booking-image'>
                <img src={getImageUrl()} alt={hotelInfo.title} />
                <div className='price-tag'>{hotelInfo.price} VND/Tháng</div>
            </div>
            <div className='booking-info'>
                <div className='hotel-name'>{hotelInfo.title}</div>
                <div className='hotel-location'>{hotelInfo.location}</div>
                {/* <div>Có sẵn từ: {hotelInfo.availableFrom}</div> */}
                <div>Diện tích: {hotelInfo.roomSize}m²</div>
                {/* <div>
                    Phòng ngủ: {hotelInfo.numBedrooms} | Phòng tắm:{' '}
                    {hotelInfo.numBathrooms}
                </div> */}
                <div>{hotelInfo.addressDetails}</div>
                <div className='hotel-description'>
                    Mô tả: {hotelInfo.description}
                </div>
                <div className='card-actions'>
                    <button
                        className='edit-btn'
                        onClick={() => onEditClick(hotelInfo)}
                        title='Chỉnh sửa phòng'
                    >
                        ✏️
                    </button>
                    <button
                        className='delete-btn'
                        onClick={onDeleteClick}
                        title='Xóa phòng'
                    >
                        🗑️
                    </button>
                    <button
                        className='bg-[#f0f0f0] flex justify-center items-center p-3 rounded-md hover:bg-slate-200'
                        onClick={markUnavailable}
                        title='Đánh dấu hết phòng'
                    >
                        ❌
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BookingCard;
