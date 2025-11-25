// src/components/Dashboard/AddIncidentForm.jsx
import React, { useState, useCallback, useRef } from 'react';
import axios from 'axios';
import {
    GoogleMap,
    useJsApiLoader,
    Marker,
    Autocomplete,
} from '@react-google-maps/api';
import './css/AddIncidentForm.css';

// --- CẤU HÌNH ---
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const VAT_API_URL =
    import.meta.env.VITE_PUBLIC_VAT_API_URL || 'http://localhost:3000';
const LIBRARIES = ['places'];

const mapContainerStyle = { width: '100%', height: '100%' };
const defaultCenter = { lat: 16.0544, lng: 108.2022 }; // Đà Nẵng

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

    // State Logic
    const [nearbyProperties, setNearbyProperties] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: GOOGLE_MAPS_API_KEY,
        libraries: LIBRARIES,
    });

    // --- LOGIC MAP ---

    const onLoad = useCallback((map) => setMap(map), []);
    const onUnmount = useCallback(() => setMap(null), []);

    // 1. Xử lý tìm địa chỉ (Autocomplete)
    const onPlaceChanged = () => {
        if (autocompleteRef.current !== null) {
            const place = autocompleteRef.current.getPlace();
            if (place.geometry && place.geometry.location) {
                const lat = place.geometry.location.lat();
                const lng = place.geometry.location.lng();
                updateLocation(lat, lng, true); // true = zoom vào
            }
        }
    };

    // 2. Xử lý Click bản đồ
    const handleMapClick = (e) => {
        updateLocation(e.latLng.lat(), e.latLng.lng(), false);
    };

    // 3. Xử lý Kéo thả Marker (Drag End)
    const handleMarkerDragEnd = (e) => {
        updateLocation(e.latLng.lat(), e.latLng.lng(), false);
    };

    // 4. Hàm cập nhật vị trí chung
    const updateLocation = (lat, lng, shouldZoom) => {
        setMarkerPosition({ lat, lng });
        if (shouldZoom && map) {
            map.panTo({ lat, lng });
            map.setZoom(17);
        }
        // Luôn tìm trọ mới khi vị trí thay đổi
        fetchNearbyProperties(lat, lng);
    };

    // 5. Nút "Vị trí của tôi"
    const handleCurrentLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    updateLocation(
                        pos.coords.latitude,
                        pos.coords.longitude,
                        true,
                    );
                },
                () => alert('Không thể lấy vị trí của bạn.'),
            );
        }
    };

    // --- LOGIC API ---

    const fetchNearbyProperties = async (lat, lng) => {
        const token = localStorage.getItem('authToken');
        try {
            // Tìm trong 100m
            const res = await axios.get(
                `${VAT_API_URL}/api/v1/admin/properties-search`,
                {
                    params: { lat, lng, radius: 100 },
                    headers: { Authorization: `Bearer ${token}` },
                },
            );
            setNearbyProperties(res.data);
            // Reset lựa chọn cũ vì danh sách đã đổi
            setFormData((prev) => ({ ...prev, propertyId: '' }));
        } catch (e) {
            console.error('Lỗi tìm trọ:', e);
        }
    };

    // --- LOGIC FORM ---

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage({ type: '', text: '' });

        if (!markerPosition) {
            setMessage({
                type: 'error',
                text: 'Vui lòng ghim vị trí trên bản đồ!',
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
            const res = await axios.post(
                `${VAT_API_URL}/api/v1/admin/incidents`,
                payload,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'x-api-key': 'my-secret-key-123',
                    },
                },
            );
            if (res.status === 201) {
                setMessage({
                    type: 'success',
                    text: 'Thành công! Hệ thống đang tính lại điểm.',
                });
                setFormData((prev) => ({ ...prev, notes: '', propertyId: '' }));
            }
        } catch (err) {
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

            {/* GRID LAYOUT */}
            <div className='form-content'>
                {/* CỘT TRÁI: FORM */}
                <div className='form-sidebar'>
                    {message.text && (
                        <div
                            style={{
                                padding: '10px',
                                marginBottom: '15px',
                                borderRadius: '6px',
                                background:
                                    message.type === 'error'
                                        ? '#ffebee'
                                        : '#e8f5e9',
                                color:
                                    message.type === 'error'
                                        ? '#c62828'
                                        : '#2e7d32',
                                border: `1px solid ${message.type === 'error' ? '#ef9a9a' : '#a5d6a7'}`,
                            }}
                        >
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

                        {/* LOGIC DROP DOWN THÔNG MINH */}
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
                                        -- Chọn trọ gần điểm ghim --
                                    </option>
                                    {nearbyProperties.map((p) => (
                                        <option key={p.id} value={p.id}>
                                            {p.name} ({Math.round(p.dist)}m)
                                        </option>
                                    ))}
                                </select>
                                {nearbyProperties.length === 0 &&
                                    markerPosition && (
                                        <small
                                            style={{
                                                color: '#e67e22',
                                                marginTop: '5px',
                                                display: 'block',
                                            }}
                                        >
                                            ⚠️ Không tìm thấy trọ nào trong
                                            100m. Hãy thử kéo ghim sát hơn.
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

                {/* CỘT PHẢI: MAP */}
                <div className='map-sidebar'>
                    <div className='map-controls'>
                        <Autocomplete
                            onLoad={(ref) => (autocompleteRef.current = ref)}
                            onPlaceChanged={onPlaceChanged}
                            className='google-search-container'
                        >
                            <input
                                type='text'
                                placeholder='Tìm địa điểm (VD: 15 Tiểu La)...'
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
                        {markerPosition && (
                            <Marker
                                position={markerPosition}
                                draggable={true} // CHO PHÉP KÉO THẢ
                                onDragEnd={handleMarkerDragEnd}
                                animation={window.google.maps.Animation.DROP}
                            />
                        )}
                    </GoogleMap>

                    <div className='map-info-bar'>
                        <span>
                            {markerPosition
                                ? `📍 ${markerPosition.lat.toFixed(5)}, ${markerPosition.lng.toFixed(5)}`
                                : '👆 Click hoặc tìm kiếm để ghim vị trí'}
                        </span>
                        {nearbyProperties.length > 0 && (
                            <span
                                style={{ color: '#27ae60', fontWeight: 'bold' }}
                            >
                                {nearbyProperties.length} trọ lân cận
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AddIncidentForm;
