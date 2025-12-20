import axios from 'axios';
import {
    GoogleMap,
    useJsApiLoader,
    Marker,
    Autocomplete,
    InfoWindow,
} from '@react-google-maps/api';
import { Loader } from 'lucide-react';
import { axiosInstance } from '../../lib/axios'; // Gọi API Java Core
import './css/AddIncidentForm.css';
import { useCallback, useEffect, useRef, useState } from 'react';
import { VAT_API_KEY } from '../../constants';

// --- CẤU HÌNH ---
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const VAT_API_URL =
    import.meta.env.VITE_PUBLIC_VAT_API_URL || 'http://localhost:3000';
const LIBRARIES = ['places'];

const mapContainerStyle = { width: '100%', height: '100%' };
const defaultCenter = { lat: 16.0544, lng: 108.2022 }; // Đà Nẵng

// Hàm tính khoảng cách giữa 2 điểm tọa độ (Haversine Formula) - Trả về mét
const getDistanceFromLatLonInMeters = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Bán kính trái đất (km)
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) *
            Math.cos(deg2rad(lat2)) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Khoảng cách km
    return d * 1000; // Đổi ra mét
};

const deg2rad = (deg) => {
    return deg * (Math.PI / 180);
};

function AddIncidentForm() {
    // State Form
    const [formData, setFormData] = useState({
        propertyId: '',
        incidentType: 'theft',
        severity: 'low',
        dateOccurred: new Date().toISOString().split('T')[0],
        notes: '',
    });

    // State Map
    const [map, setMap] = useState(null);
    const [markerPosition, setMarkerPosition] = useState(null);
    const autocompleteRef = useRef(null);

    // State Data
    const [existingMarkers, setExistingMarkers] = useState([]); // Tất cả phòng trọ (Chấm xanh)
    const [nearbyProperties, setNearbyProperties] = useState([]); // Phòng trọ trong bán kính ghim (Cho Dropdown)
    const [selectedMarker, setSelectedMarker] = useState(null);

    // State UI
    const [isLoadingRooms, setIsLoadingRooms] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: GOOGLE_MAPS_API_KEY,
        libraries: LIBRARIES,
    });

    // --- 1. LOAD DỮ LIỆU PHÒNG TRỌ (Logic chuẩn từ Map.jsx) ---
    useEffect(() => {
        const fetchRoomsAndCoords = async () => {
            setIsLoadingRooms(true);
            try {
                // Bước 1: Lấy danh sách phòng từ Java BE
                const res = await axiosInstance.get('/api/rooms');
                // Xử lý linh hoạt cấu trúc response (có thể là res.data hoặc res.data.data)
                const rooms = Array.isArray(res.data)
                    ? res.data
                    : res.data.data || [];

                // Bước 2: Lọc các phòng thiếu tọa độ
                const roomsWithoutCoords = rooms.filter(
                    (room) => !room.latitude || !room.longitude,
                );

                let finalRooms = rooms;

                // Bước 3: Gọi API maps/markers để lấy tọa độ còn thiếu
                if (roomsWithoutCoords.length > 0) {
                    // Tạo payload chỉ chứa id và địa chỉ
                    const addressData = roomsWithoutCoords.map((room) => ({
                        id: room.id,
                        address:
                            `${room.addressDetails || ''} ${room.ward || ''} ${room.district || ''} ${room.city || ''}`.trim(),
                    }));

                    try {
                        const coordRes = await axiosInstance.post(
                            '/api/markers',
                            addressData,
                        );

                        // Merge tọa độ vào danh sách gốc
                        finalRooms = rooms.map((room) => {
                            const coordData = coordRes.data.find(
                                (c) => c.id === room.id,
                            );
                            if (coordData) {
                                return {
                                    ...room,
                                    latitude: coordData.latitude,
                                    longitude: coordData.longitude,
                                };
                            }
                            return room;
                        });
                    } catch (err) {
                        console.error('Lỗi lấy tọa độ bổ sung:', err);
                    }
                }

                // Lọc bỏ những phòng vẫn không có tọa độ
                const validRooms = finalRooms.filter(
                    (r) => r.latitude && r.longitude,
                );
                setExistingMarkers(validRooms);
            } catch (error) {
                console.error('Lỗi tải dữ liệu phòng trọ:', error);
            } finally {
                setIsLoadingRooms(false);
            }
        };

        fetchRoomsAndCoords();
    }, []);

    // --- LOGIC TÍNH TOÁN KHOẢNG CÁCH (FIX LỖI DROPDOWN) ---
    const updateNearbyProperties = (lat, lng) => {
        if (!existingMarkers.length) return;

        // Tìm các phòng trọ trong bán kính 100m tính từ điểm ghim
        // Sử dụng dữ liệu đã có sẵn ở Frontend (existingMarkers) thay vì gọi lại Backend
        const SEARCH_RADIUS_METERS = 100;

        const nearby = existingMarkers
            .map((room) => {
                const dist = getDistanceFromLatLonInMeters(
                    lat,
                    lng,
                    parseFloat(room.latitude),
                    parseFloat(room.longitude),
                );
                return { ...room, dist };
            })
            .filter((room) => room.dist <= SEARCH_RADIUS_METERS)
            .sort((a, b) => a.dist - b.dist); // Sắp xếp gần nhất trước

        setNearbyProperties(nearby);

        // Reset lựa chọn cũ
        setFormData((prev) => ({ ...prev, propertyId: '' }));
    };

    // --- MAP HANDLERS ---

    const onLoad = useCallback((map) => setMap(map), []);
    const onUnmount = useCallback(() => setMap(null), []);

    const onPlaceChanged = () => {
        if (autocompleteRef.current !== null) {
            const place = autocompleteRef.current.getPlace();
            if (place.geometry && place.geometry.location) {
                const lat = place.geometry.location.lat();
                const lng = place.geometry.location.lng();
                updateLocation(lat, lng, true);
            }
        }
    };

    const handleMapClick = (e) => {
        setSelectedMarker(null);
        updateLocation(e.latLng.lat(), e.latLng.lng(), false);
    };

    const handleMarkerDragEnd = (e) => {
        updateLocation(e.latLng.lat(), e.latLng.lng(), false);
    };

    const updateLocation = (lat, lng, shouldZoom) => {
        setMarkerPosition({ lat, lng });
        if (shouldZoom && map) {
            map.panTo({ lat, lng });
            map.setZoom(17);
        }
        // [QUAN TRỌNG] Cập nhật danh sách gợi ý ngay lập tức
        updateNearbyProperties(lat, lng);
    };

    const handleCurrentLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) =>
                    updateLocation(
                        pos.coords.latitude,
                        pos.coords.longitude,
                        true,
                    ),
                () => alert('Không thể lấy vị trí hiện tại.'),
            );
        }
    };

    // --- FORM HANDLER ---

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage({ type: '', text: '' });

        if (!markerPosition) {
            setMessage({
                type: 'error',
                text: 'Vui lòng ghim vị trí sự cố trên bản đồ!',
            });
            setIsLoading(false);
            return;
        }

        if (formData.incidentType === 'theft' && !formData.propertyId) {
            setMessage({
                type: 'error',
                text: 'Với trộm cắp, bạn PHẢI chọn 1 phòng trọ bị ảnh hưởng.',
            });
            setIsLoading(false);
            return;
        }

        const token = localStorage.getItem('authToken');
        const payload = {
            property_id: formData.propertyId
                ? parseInt(formData.propertyId)
                : null,
            incident_type: formData.incidentType,
            severity: formData.severity,
            incident_date: formData.dateOccurred,
            notes: formData.notes,
            latitude: markerPosition.lat,
            longitude: markerPosition.lng,
        };

        try {
            // Gửi dữ liệu sang Node.js Backend để lưu và tính điểm
            const res = await axios.post(
                `${VAT_API_URL}/api/v1/admin/incidents`,
                payload,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'x-api-key': VAT_API_KEY,
                    },
                },
            );
            if (res.status === 201) {
                setMessage({
                    type: 'success',
                    text: 'Thành công! Hệ thống đang tính lại điểm.',
                });
                setFormData((prev) => ({ ...prev, notes: '', propertyId: '' }));
                setMarkerPosition(null);
                setNearbyProperties([]);
            }
        } catch (err) {
            console.error(err);
            setMessage({
                type: 'error',
                text: err.response?.data?.error || 'Lỗi server.',
            });
        } finally {
            setIsLoading(false);
        }
    };

    if (!isLoaded)
        return <div className='p-5 text-center'>Đang tải bản đồ...</div>;

    return (
        <div className='add-incident-container'>
            <div className='form-header'>
                <h2>🛡️ Báo Cáo Sự Cố An Ninh</h2>
            </div>

            <div className='form-content'>
                {/* --- CỘT TRÁI: FORM NHẬP --- */}
                <div className='form-sidebar'>
                    {message.text && (
                        <div className={`incident-alert ${message.type}`}>
                            {message.text}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className='incident-form'>
                        <div className='form-group'>
                            <label>Loại sự cố</label>
                            <select
                                value={formData.incidentType}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        incidentType: e.target.value,
                                    })
                                }
                            >
                                <option value='theft'>🕵️ Trộm cắp vặt</option>
                                <option value='robbery'>🔪 Cướp giật</option>
                                <option value='harassment'>🤬 Quấy rối</option>
                                <option value='noise'>📢 Gây rối ồn ào</option>
                                <option value='accident'>🚑 Tai nạn</option>
                                <option value='other'>❓ Khác</option>
                            </select>
                        </div>

                        {/* --- DROPDOWN GỢI Ý THÔNG MINH --- */}
                        {formData.incidentType === 'theft' && (
                            <div className='form-group highlight-box'>
                                <label style={{ color: '#d35400' }}>
                                    Phòng trọ bị mất trộm (Bắt buộc)
                                </label>
                                <select
                                    value={formData.propertyId}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            propertyId: e.target.value,
                                        })
                                    }
                                    style={{
                                        borderColor: !formData.propertyId
                                            ? '#e74c3c'
                                            : '',
                                    }}
                                >
                                    <option value=''>
                                        -- Chọn trọ gần điểm ghim (100m) --
                                    </option>
                                    {nearbyProperties.map((p) => (
                                        <option key={p.id} value={p.id}>
                                            {p.title || p.name} (
                                            {Math.round(p.dist)}m)
                                        </option>
                                    ))}
                                </select>
                                {nearbyProperties.length === 0 &&
                                    markerPosition && (
                                        <small className='text-warning'>
                                            ⚠️ Không tìm thấy trọ nào trong
                                            100m. Hãy ghim sát vào chấm xanh
                                            trên bản đồ.
                                        </small>
                                    )}
                            </div>
                        )}

                        <div className='form-group'>
                            <label>Mức độ nghiêm trọng</label>
                            <select
                                value={formData.severity}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        severity: e.target.value,
                                    })
                                }
                            >
                                <option value='low'>🟢 Thấp</option>
                                <option value='medium'>🟡 Trung bình</option>
                                <option value='high'>🔴 Cao</option>
                            </select>
                        </div>

                        <div className='form-group'>
                            <label>Thời gian xảy ra</label>
                            <input
                                type='date'
                                value={formData.dateOccurred}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        dateOccurred: e.target.value,
                                    })
                                }
                                required
                            />
                        </div>

                        <div className='form-group'>
                            <label>Ghi chú thêm</label>
                            <textarea
                                rows='4'
                                value={formData.notes}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        notes: e.target.value,
                                    })
                                }
                                placeholder='Mô tả chi tiết...'
                            />
                        </div>

                        <button
                            type='submit'
                            className='submit-btn'
                            disabled={isLoading}
                        >
                            {isLoading ? 'Đang xử lý...' : 'LƯU BÁO CÁO'}
                        </button>
                    </form>
                </div>

                {/* --- CỘT PHẢI: BẢN ĐỒ --- */}
                <div className='map-sidebar'>
                    {isLoadingRooms && (
                        <div className='absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 rounded-lg'>
                            <div className='bg-white p-3 rounded-lg flex items-center shadow-lg'>
                                <Loader className='w-5 h-5 animate-spin text-blue-600 mr-2' />
                                <span className='text-sm font-medium'>
                                    Đang tải vị trí phòng trọ...
                                </span>
                            </div>
                        </div>
                    )}

                    <div className='map-controls'>
                        <Autocomplete
                            onLoad={(ref) => (autocompleteRef.current = ref)}
                            onPlaceChanged={onPlaceChanged}
                            className='google-search-container'
                        >
                            <input
                                type='text'
                                placeholder='Tìm địa điểm...'
                                className='google-search-input'
                            />
                        </Autocomplete>
                        <button
                            type='button'
                            className='locate-btn'
                            onClick={handleCurrentLocation}
                            title='Vị trí của tôi'
                        >
                            📍
                        </button>
                    </div>

                    <GoogleMap
                        mapContainerStyle={mapContainerStyle}
                        center={defaultCenter}
                        zoom={14}
                        onLoad={onLoad}
                        onUnmount={onUnmount}
                        onClick={handleMapClick}
                        options={{
                            streetViewControl: false,
                            mapTypeControl: false,
                            fullscreenControl: false,
                        }}
                    >
                        {/* 1. HIỂN THỊ PHÒNG TRỌ (MARKER XANH) */}
                        {existingMarkers.map((marker) => (
                            <Marker
                                key={marker.id}
                                position={{
                                    lat: parseFloat(marker.latitude),
                                    lng: parseFloat(marker.longitude),
                                }}
                                icon={{
                                    url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
                                }} // Blue
                                onClick={() => setSelectedMarker(marker)}
                            />
                        ))}

                        {/* InfoWindow khi click trọ */}
                        {selectedMarker && (
                            <InfoWindow
                                position={{
                                    lat: parseFloat(selectedMarker.latitude),
                                    lng: parseFloat(selectedMarker.longitude),
                                }}
                                onCloseClick={() => setSelectedMarker(null)}
                            >
                                <div
                                    style={{
                                        color: '#333',
                                        padding: '5px',
                                        maxWidth: '200px',
                                    }}
                                >
                                    <h4
                                        style={{
                                            margin: '0 0 5px 0',
                                            fontSize: '14px',
                                            fontWeight: 'bold',
                                        }}
                                    >
                                        {selectedMarker.title || 'Phòng trọ'}
                                    </h4>
                                    <p
                                        style={{
                                            margin: 0,
                                            fontSize: '12px',
                                            color: '#666',
                                        }}
                                    >
                                        {selectedMarker.addressDetails},{' '}
                                        {selectedMarker.ward}
                                    </p>
                                    <p
                                        style={{
                                            margin: '5px 0 0 0',
                                            fontSize: '12px',
                                            color: '#2ecc71',
                                            fontWeight: 'bold',
                                        }}
                                    >
                                        {selectedMarker.price
                                            ? new Intl.NumberFormat('vi-VN', {
                                                  style: 'currency',
                                                  currency: 'VND',
                                              }).format(selectedMarker.price)
                                            : 'Liên hệ'}
                                    </p>
                                </div>
                            </InfoWindow>
                        )}

                        {/* 2. ĐIỂM GHIM SỰ CỐ (MARKER ĐỎ) */}
                        {markerPosition && (
                            <Marker
                                position={markerPosition}
                                draggable={true}
                                onDragEnd={handleMarkerDragEnd}
                                animation={window.google.maps.Animation.DROP}
                                icon={{
                                    url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
                                }} // Red
                            />
                        )}
                    </GoogleMap>

                    <div className='map-info-bar'>
                        <span>
                            {markerPosition
                                ? `🔥 Vị trí: ${markerPosition.lat.toFixed(5)}, ${markerPosition.lng.toFixed(5)}`
                                : '👆 Click bản đồ để ghim sự cố (Chấm đỏ)'}
                        </span>
                        <span style={{ color: '#007bff', fontWeight: 'bold' }}>
                            🏠 {existingMarkers.length} trọ hiện có
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AddIncidentForm;
