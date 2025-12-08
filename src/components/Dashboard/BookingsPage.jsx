import { useState, useEffect, useRef } from 'react';
import BookingCard from './BookingCard';
import RegisterForm from './RegisterForm';
import EditForm from './EditForm';
import './css/BookingsPage.css';
import { BASE_API_URL } from '../../constants';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';

const BookingsPage = () => {
    const [hotels, setHotels] = useState([]);
    const [showRegisterForm, setShowRegisterForm] = useState(false);
    const [editingHotel, setEditingHotel] = useState(null);
    const [initialLoading, setInitialLoading] = useState(true);
    const [searching, setSearching] = useState(false);
    const [error, setError] = useState(null);

    const token = localStorage.getItem('authToken');
    const userRole = localStorage.getItem('userRole');

    const [searchTerm, setSearchTerm] = useState('');
    const [inputValue, setInputValue] = useState('');
    const isFirstLoad = useRef(true);

    // Debounce effect
    useEffect(() => {
        const timer = setTimeout(() => {
            setSearchTerm(inputValue);
        }, 300);

        return () => {
            clearTimeout(timer);
        };
    }, [inputValue]);

    const handleSearch = (e) => {
        setInputValue(e.target.value);
    };

    useEffect(() => {
        console.log('Current user role:', userRole); // Debug log

        if (!token) {
            setError('Vui lòng đăng nhập để xem danh sách phòng');
            setInitialLoading(false);
            return;
        }

        // Kiểm tra role chính xác hơn
        if (userRole !== 'ADMIN' && userRole !== 'OWNER') {
            console.log('Invalid role:', userRole); // Debug log
            setError('Bạn không có quyền truy cập trang này');
            setInitialLoading(false);
            return;
        }

        const fetchMyRooms = async () => {
            try {
                // Show searching indicator for subsequent searches, not first load
                if (!isFirstLoad.current) {
                    setSearching(true);
                }

                // Nếu là ADMIN thì dùng endpoint khác
                let endpoint =
                    userRole === 'ADMIN'
                        ? `${BASE_API_URL}/api/rooms`
                        : `${BASE_API_URL}/api/rooms/owner`;

                if (searchTerm && searchTerm.trim() !== '') {
                    endpoint += `?search=${encodeURIComponent(searchTerm.trim())}`;
                }

                console.log('Fetching from endpoint:', endpoint); // Debug log
                const response = await fetch(endpoint, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    // Không throw error nếu không tìm thấy phòng
                    if (response.status === 404) {
                        setHotels([]);
                        setInitialLoading(false);
                        setSearching(false);
                        return;
                    }
                    throw new Error(
                        errorData.message || 'Không thể lấy danh sách phòng',
                    );
                }

                const result = await response.json();
                console.log('Dữ liệu lấy được từ API:', result);

                // Kiểm tra và xử lý dữ liệu trước khi set state
                if (result && result.data) {
                    const validHotels = Array.isArray(result.data)
                        ? result.data.filter((hotel) => hotel && hotel.id) // Lọc ra các hotel hợp lệ
                        : [];
                    setHotels(validHotels);
                } else {
                    setHotels([]);
                }
            } catch (err) {
                console.error('Lỗi khi fetch danh sách phòng:', err);
                setError(err.message);
            } finally {
                setInitialLoading(false);
                setSearching(false);
                isFirstLoad.current = false;
            }
        };

        fetchMyRooms();
    }, [token, userRole, searchTerm]);

    const handleAddHotel = (newHotel) => {
        if (newHotel && newHotel.id) {
            setHotels((prev) => [...prev, newHotel]);
            setShowRegisterForm(false);
        }
    };

    const handleEditClick = (hotel) => {
        if (hotel && hotel.id) {
            setEditingHotel(hotel);
        }
    };

    const handleUpdateHotel = (updatedHotel) => {
        if (updatedHotel && updatedHotel.id) {
            setHotels((prev) =>
                prev.map((h) => (h.id === updatedHotel.id ? updatedHotel : h)),
            );
            setEditingHotel(null);
        }
    };

    const markHotelUnavailable = async (hotelId) => {
        if (!hotelId) return;
        const hotel = hotels.find((h) => h.id === hotelId);
        if (!hotel) return;

        try {
            const response = await fetch(
                `${BASE_API_URL}/api/rooms/${hotelId}`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ ...hotel, isRoomAvailable: false }),
                },
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(
                    errorData.message || 'Cập nhật trạng thái thất bại',
                );
            }

            const updatedHotel = await response.json();

            setHotels((prev) =>
                prev.map((h) => (h.id === updatedHotel.id ? updatedHotel : h)),
            );
        } catch (err) {
            alert('Lỗi khi cập nhật trạng thái phòng: ' + err.message);
        }
    };

    const handleDeleteHotel = async (hotelId) => {
        if (!hotelId) return;

        if (!window.confirm('Bạn có chắc muốn xóa phòng này?')) return;

        try {
            const response = await fetch(
                `${BASE_API_URL}/api/rooms/${hotelId}`,
                {
                    method: 'DELETE',
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                },
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Xóa phòng thất bại');
            }

            setHotels((prev) => prev.filter((hotel) => hotel.id !== hotelId));
        } catch (err) {
            alert('Lỗi khi xóa phòng: ' + err.message);
        }
    };

    if (initialLoading) {
        return <div className='BookingsPage-content'>Đang tải...</div>;
    }

    if (error && error !== 'Không có phòng nào được tìm thấy cho owner này') {
        return <div className='BookingsPage-content error'>{error}</div>;
    }

    return (
        <div className='BookingsPage-content'>
            <div className='filter-bar'>
                <div className='search-container mt-5'>
                    <input
                        className='search-input'
                        type='text'
                        placeholder='Tìm kiếm phòng trọ...'
                        value={inputValue}
                        onChange={handleSearch}
                    />
                </div>

                <button
                    className='add-btn extended'
                    onClick={() => setShowRegisterForm(true)}
                    title='Thêm phòng mới'
                >
                    <FontAwesomeIcon icon={faPlus} />
                    <span>Thêm phòng mới</span>
                </button>
            </div>

            {showRegisterForm && (
                <RegisterForm
                    onClose={() => setShowRegisterForm(false)}
                    onRegister={handleAddHotel}
                />
            )}

            {editingHotel && (
                <EditForm
                    hotel={editingHotel}
                    onClose={() => setEditingHotel(null)}
                    onUpdate={handleUpdateHotel}
                />
            )}

            <div className='booking-list'>
                {searching ? (
                    <div className='no-rooms-message'>
                        <p>Đang tìm kiếm...</p>
                    </div>
                ) : hotels.length > 0 ? (
                    hotels.map((hotel) => (
                        <BookingCard
                            key={hotel.id}
                            initialHotel={hotel}
                            onEditClick={handleEditClick}
                            onDeleteClick={() => handleDeleteHotel(hotel.id)}
                            markUnavailable={() =>
                                markHotelUnavailable(hotel.id)
                            }
                        />
                    ))
                ) : (
                    <div className='no-rooms-message'>
                        <p>
                            {searchTerm
                                ? 'Không tìm thấy phòng nào phù hợp.'
                                : 'Chưa có phòng nào được đăng.'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BookingsPage;
