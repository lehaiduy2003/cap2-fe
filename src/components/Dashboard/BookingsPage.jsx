import { useState, useEffect, useRef } from 'react';
import BookingCard from './BookingCard';
import RegisterForm from './RegisterForm';
import EditForm from './EditForm';
import './css/BookingsPage.css';
import { BASE_API_URL } from '../../constants';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { showSuccessToast, showErrorToast } from '../toast';

const BookingsPage = () => {
    const [hotels, setHotels] = useState([]);
    const [showRegisterForm, setShowRegisterForm] = useState(false);
    const [editingHotel, setEditingHotel] = useState(null);
    const [initialLoading, setInitialLoading] = useState(true);
    const [searching, setSearching] = useState(false);
    const [error, setError] = useState(null);

    // Lấy thông tin User
    const token = localStorage.getItem('authToken');
    const userRole = localStorage.getItem('userRole');
    const authUser = JSON.parse(localStorage.getItem('authUser') || '{}');

    const [searchTerm, setSearchTerm] = useState('');
    const [inputValue, setInputValue] = useState('');
    const isFirstLoad = useRef(true);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setSearchTerm(inputValue);
        }, 300);
        return () => clearTimeout(timer);
    }, [inputValue]);

    const handleSearch = (e) => {
        setInputValue(e.target.value);
    };

    // Fetch Data
    useEffect(() => {
        if (!token) {
            setError('Vui lòng đăng nhập để xem danh sách phòng');
            setInitialLoading(false);
            return;
        }

        // Validate Role (Case insensitive)
        const role = userRole ? userRole.toUpperCase() : '';
        if (role !== 'ADMIN' && role !== 'OWNER') {
            setError('Bạn không có quyền truy cập trang này');
            setInitialLoading(false);
            return;
        }

        const fetchMyRooms = async () => {
            try {
                if (!isFirstLoad.current) setSearching(true);

                // Endpoint logic
                let endpoint =
                    role === 'ADMIN'
                        ? `${BASE_API_URL}/api/rooms` // Admin xem tất cả
                        : `${BASE_API_URL}/api/rooms/owner`; // Owner xem của mình

                if (searchTerm && searchTerm.trim() !== '') {
                    endpoint += `?search=${encodeURIComponent(searchTerm.trim())}`;
                }

                const response = await fetch(endpoint, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (!response.ok) {
                    if (response.status === 404) {
                        setHotels([]);
                        return;
                    }
                    const errorData = await response.json();
                    throw new Error(
                        errorData.message || 'Không thể lấy danh sách phòng',
                    );
                }

                const result = await response.json();

                // Xử lý dữ liệu trả về an toàn
                if (result && result.data) {
                    const validHotels = Array.isArray(result.data)
                        ? result.data.filter((hotel) => hotel && hotel.id)
                        : [];
                    // Sắp xếp: Mới nhất lên đầu (dựa vào id hoặc createdAt nếu có)
                    // Giả sử ID lớn là mới hơn
                    validHotels.sort((a, b) => b.id - a.id);
                    setHotels(validHotels);
                } else {
                    setHotels([]);
                }
            } catch (err) {
                console.error('Lỗi fetch:', err);
                setError(err.message);
            } finally {
                setInitialLoading(false);
                setSearching(false);
                isFirstLoad.current = false;
            }
        };

        fetchMyRooms();
    }, [token, userRole, searchTerm]);

    // --- FIX LỖI 1: XỬ LÝ DỮ LIỆU KHI THÊM MỚI ---
    const handleAddHotel = (newHotel) => {
        if (!newHotel || !newHotel.id) return;

        // Bổ sung dữ liệu hiển thị nếu API trả về thiếu (đặc biệt là owner info)
        // Vì người tạo chắc chắn là người đang đăng nhập (Owner)
        const enrichedHotel = {
            ...newHotel,
            ownerName:
                newHotel.ownerName ||
                authUser.fullName ||
                authUser.username ||
                'Tôi',
            // Đảm bảo imageUrls là mảng
            imageUrls: Array.isArray(newHotel.imageUrls)
                ? newHotel.imageUrls
                : [],
        };

        console.log('Adding new hotel to list:', enrichedHotel);

        setHotels((prev) => {
            // Chống trùng lặp ID
            if (prev.find((h) => h.id === enrichedHotel.id)) return prev;
            return [enrichedHotel, ...prev];
        });

        setShowRegisterForm(false);
        showSuccessToast('Thêm phòng mới thành công!');
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
            showSuccessToast('Cập nhật thông tin thành công!');
        }
    };

    // --- FIX LỖI 2: ADMIN UPDATE PERMISSION ---
    const handleToggleRoomStatus = async (hotelId) => {
        if (!hotelId) return;
        const hotel = hotels.find((h) => h.id === hotelId);
        if (!hotel) return;

        const newStatus = !hotel.isRoomAvailable;
        const statusText = newStatus ? 'Còn trống' : 'Đã thuê';

        try {
            // LOGIC QUAN TRỌNG:
            // Nếu là Admin, Backend thường yêu cầu endpoint khác hoặc logic khác.
            // Nếu Backend của bạn CHƯA hỗ trợ Admin sửa bài người khác tại endpoint thường,
            // thì đây là lúc bạn cần sửa Backend.
            // Tuy nhiên, ở đây tôi sẽ giữ endpoint chuẩn, nhưng handle lỗi rõ ràng hơn.

            // Một số hệ thống dùng: /api/admin/rooms/${id}
            // Hãy thử kiểm tra endpoint này nếu endpoint thường thất bại

            const endpoint = `${BASE_API_URL}/api/rooms/${hotelId}`;

            const response = await fetch(endpoint, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ ...hotel, isRoomAvailable: newStatus }),
            });

            if (!response.ok) {
                const errorData = await response.json();

                // Bắt lỗi 403 Forbidden (Không có quyền)
                if (response.status === 403) {
                    throw new Error(
                        'Backend từ chối: Admin chưa được cấp quyền sửa bài của Owner này. Vui lòng kiểm tra logic Backend.',
                    );
                }

                throw new Error(
                    errorData.message || 'Cập nhật trạng thái thất bại',
                );
            }

            const updatedDataWrapper = await response.json();
            // Xử lý trường hợp API trả về { data: ... } hoặc trả về trực tiếp object
            const updatedHotel = updatedDataWrapper.data || updatedDataWrapper;

            setHotels((prev) =>
                prev.map((h) => (h.id === updatedHotel.id ? updatedHotel : h)),
            );

            showSuccessToast(`Đã cập nhật trạng thái: ${statusText}`);
        } catch (err) {
            console.error(err);
            showErrorToast(err.message);
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
                    headers: { Authorization: `Bearer ${token}` },
                },
            );

            if (!response.ok) {
                // Handle Admin delete permission similarly
                if (response.status === 403) {
                    showErrorToast(
                        'Admin không có quyền xóa bài này (Backend restricted).',
                    );
                    return;
                }
                const errorData = await response.json();
                throw new Error(errorData.message || 'Xóa phòng thất bại');
            }

            setHotels((prev) => prev.filter((hotel) => hotel.id !== hotelId));
            showSuccessToast('Đã xóa phòng thành công.');
        } catch (err) {
            showErrorToast('Lỗi khi xóa phòng: ' + err.message);
        }
    };

    if (initialLoading) {
        return <div className='BookingsPage-content'>Đang tải...</div>;
    }

    if (error) {
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
                            onToggleStatus={() =>
                                handleToggleRoomStatus(hotel.id)
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
