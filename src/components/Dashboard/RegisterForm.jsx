import { useState, useEffect, useRef } from 'react';
import './css/RegisterForm.css';
import {
    getProvinces,
    getDistrictsByProvinceCode,
    getWardsByDistrictCode,
} from 'sub-vn';
import {
    BASE_API_URL,
    GOOGLE_MAPS_API_KEY,
    VAT_API_URL,
} from '../../constants';
import * as UC from '@uploadcare/react-uploader';
import '@uploadcare/react-uploader/core.css';

const { FileUploaderRegular } = UC;

const RegisterForm = ({ onClose, onRegister }) => {
    // State quản lý loading để chống double-click
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        price: '',
        roomSize: '',
        numBedrooms: '',
        numBathrooms: '',
        availableFrom: '',
        city: '',
        district: '',
        ward: '',
        street: '',
        imageUrls: [],
        documentUrls: [],
        description: '',
        isRoomAvailable: true,
    });

    const [provinces, setProvinces] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [wards, setWards] = useState([]);
    const uploaderRef = useRef(null);

    useEffect(() => {
        try {
            const provincesData = getProvinces();
            setProvinces(provincesData);
        } catch (error) {
            console.error('Error loading provinces:', error);
        }

        if (uploaderRef.current) {
            uploaderRef.current.cfg.locale = 'vi';
        }
    }, []);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleImageUploadComplete = (items) => {
        if (items && items.allEntries) {
            const newUrls = items.allEntries
                .filter((file) => file.status === 'success')
                .map((file) => file.cdnUrl);

            if (newUrls.length > 0) {
                setFormData((prev) => ({
                    ...prev,
                    imageUrls: [...new Set([...prev.imageUrls, ...newUrls])],
                }));
            }
        }
    };

    const handleDocumentUploadComplete = (items) => {
        if (items && items.allEntries) {
            const newDocUrls = items.allEntries
                .filter((file) => file.status === 'success')
                .map((file) => ({
                    url: file.cdnUrl,
                    name: file.name,
                    size: file.size,
                    mimeType: file.mimeType,
                }));

            if (newDocUrls.length > 0) {
                setFormData((prev) => {
                    const existingUrls = new Set(
                        prev.documentUrls.map((doc) => doc.url),
                    );
                    const uniqueNewDocs = newDocUrls.filter(
                        (doc) => !existingUrls.has(doc.url),
                    );
                    return {
                        ...prev,
                        documentUrls: [...prev.documentUrls, ...uniqueNewDocs],
                    };
                });
            }
        }
    };

    const getCoordinates = async (address) => {
        const response = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_API_KEY}`,
        );
        const data = await response.json();
        if (data.status !== 'OK') {
            throw new Error(`Geocoding failed: ${data.status}`);
        }
        return data.results[0].geometry.location;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;

        const token = localStorage.getItem('authToken');
        if (!token) {
            alert('Vui lòng đăng nhập lại.');
            return;
        }

        setIsSubmitting(true);

        try {
            if (!formData.title.trim() || !formData.price || !formData.city) {
                throw new Error('Vui lòng điền đầy đủ thông tin bắt buộc.');
            }

            const address = `${formData.street}, ${formData.ward}, ${formData.district}, ${formData.city}, Việt Nam`;

            let latitude = null;
            let longitude = null;
            try {
                const location = await getCoordinates(address);
                latitude = location.lat;
                longitude = location.lng;
            } catch (geoError) {
                console.warn('Không lấy được tọa độ:', geoError);
                if (
                    !confirm(
                        'Không thể xác định vị trí trên bản đồ. Bạn có muốn tiếp tục đăng không?',
                    )
                ) {
                    setIsSubmitting(false);
                    return;
                }
            }

            const roomData = {
                title: formData.title.trim(),
                price: formData.price,
                roomSize: parseFloat(formData.roomSize),
                numBedrooms: 1,
                numBathrooms: 1,
                availableFrom: new Date().toISOString(),
                city: formData.city,
                district: formData.district,
                ward: formData.ward,
                street: formData.street,
                description: formData.description,
                isRoomAvailable: formData.isRoomAvailable,
                addressDetails: address,
                latitude: latitude,
                longitude: longitude,
                imageUrls: formData.imageUrls,
            };

            const response = await fetch(`${BASE_API_URL}/api/rooms`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(roomData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Tạo phòng thất bại');
            }

            const data = await response.json();
            const createdRoom = data.data;

            // Fallback image handling
            const finalRoomData = {
                ...createdRoom,
                imageUrls:
                    createdRoom.imageUrls && createdRoom.imageUrls.length > 0
                        ? createdRoom.imageUrls
                        : formData.imageUrls,
            };

            if (formData.documentUrls.length > 0) {
                const userId = localStorage.getItem('userId');
                const docPromises = formData.documentUrls.map((doc) =>
                    fetch(`${VAT_API_URL}/api/v1/documents`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'x-user-id': userId,
                            Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify({
                            title: doc.name || 'Tài liệu phòng trọ',
                            original_filename: doc.name,
                            upload_url: doc.url,
                            property_id: createdRoom.id,
                            metadata: {
                                description: formData.description,
                                address_details: address,
                                price: formData.price,
                                room_size: formData.roomSize,
                                file_size: doc.size,
                                content_type: doc.mimeType,
                            },
                        }),
                    }).catch((err) =>
                        console.error(`Lỗi upload doc ${doc.name}:`, err),
                    ),
                );
                await Promise.all(docPromises);
            }

            onRegister(finalRoomData);
            onClose();
        } catch (error) {
            console.error('Error creating room:', error);
            alert(`Lỗi: ${error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const removeImage = (index) => {
        setFormData((prev) => ({
            ...prev,
            imageUrls: prev.imageUrls.filter((_, i) => i !== index),
        }));
    };

    const removeDocument = (index) => {
        setFormData((prev) => ({
            ...prev,
            documentUrls: prev.documentUrls.filter((_, i) => i !== index),
        }));
    };

    const handleProvinceChange = (e) => {
        const provinceCode = e.target.value;
        const province = provinces.find((p) => p.code === provinceCode);
        setFormData((prev) => ({
            ...prev,
            city: province ? province.name : '',
            district: '',
            ward: '',
        }));

        if (provinceCode) {
            try {
                const districtsData = getDistrictsByProvinceCode(provinceCode);
                setDistricts(districtsData);
                setWards([]);
            } catch (error) {
                setDistricts([]);
                setWards([]);
            }
        } else {
            setDistricts([]);
            setWards([]);
        }
    };

    const handleDistrictChange = (e) => {
        const districtCode = e.target.value;
        const district = districts.find((d) => d.code === districtCode);
        setFormData((prev) => ({
            ...prev,
            district: district ? district.name : '',
            ward: '',
        }));
        if (districtCode) {
            try {
                const wardsData = getWardsByDistrictCode(districtCode);
                setWards(wardsData);
            } catch (error) {
                setWards([]);
            }
        } else {
            setWards([]);
        }
    };

    const handleWardChange = (e) => {
        const wardCode = e.target.value;
        const ward = wards.find((w) => w.code === wardCode);
        setFormData((prev) => ({
            ...prev,
            ward: ward ? ward.name : '',
        }));
    };

    return (
        <div className='register-form-overlay'>
            <div className='register-form'>
                {/* Header */}
                <div className='form-header'>
                    <h2>Đăng ký phòng mới</h2>
                    <button
                        type='button'
                        className='close-icon-btn'
                        onClick={onClose}
                        title='Đóng'
                    >
                        ✕
                    </button>
                </div>

                {/* Form Body - Scrollable */}
                <div className='form-body'>
                    <form onSubmit={handleSubmit} id='createRoomForm'>
                        <div className='form-grid'>
                            {/* Section: Basic Info */}
                            <div className='form-group full-width'>
                                <label>
                                    Tiêu đề bài đăng{' '}
                                    <span className='text-red-500'>*</span>
                                </label>
                                <input
                                    className='form-control'
                                    type='text'
                                    name='title'
                                    placeholder='Ví dụ: Phòng trọ cao cấp gần ĐH FPT'
                                    value={formData.title}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className='form-group'>
                                <label>
                                    Giá (VND/Tháng){' '}
                                    <span className='text-red-500'>*</span>
                                </label>
                                <input
                                    className='form-control'
                                    type='number'
                                    name='price'
                                    placeholder='0'
                                    value={formData.price}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className='form-group'>
                                <label>
                                    Diện tích (m²){' '}
                                    <span className='text-red-500'>*</span>
                                </label>
                                <input
                                    className='form-control'
                                    type='number'
                                    name='roomSize'
                                    placeholder='0'
                                    value={formData.roomSize}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            {/* Section: Location */}
                            <div className='form-group'>
                                <label>
                                    Tỉnh / Thành phố{' '}
                                    <span className='text-red-500'>*</span>
                                </label>
                                <select
                                    className='form-control'
                                    value={
                                        provinces.find(
                                            (p) => p.name === formData.city,
                                        )?.code || ''
                                    }
                                    onChange={handleProvinceChange}
                                    required
                                >
                                    <option value=''>
                                        -- Chọn tỉnh/thành --
                                    </option>
                                    {provinces.map((p) => (
                                        <option key={p.code} value={p.code}>
                                            {p.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className='form-group'>
                                <label>
                                    Quận / Huyện{' '}
                                    <span className='text-red-500'>*</span>
                                </label>
                                <select
                                    className='form-control'
                                    value={
                                        districts.find(
                                            (d) => d.name === formData.district,
                                        )?.code || ''
                                    }
                                    onChange={handleDistrictChange}
                                    disabled={!districts.length}
                                    required
                                >
                                    <option value=''>
                                        -- Chọn quận/huyện --
                                    </option>
                                    {districts.map((d) => (
                                        <option key={d.code} value={d.code}>
                                            {d.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className='form-group'>
                                <label>
                                    Phường / Xã{' '}
                                    <span className='text-red-500'>*</span>
                                </label>
                                <select
                                    className='form-control'
                                    value={
                                        wards.find(
                                            (w) => w.name === formData.ward,
                                        )?.code || ''
                                    }
                                    onChange={handleWardChange}
                                    disabled={!wards.length}
                                    required
                                >
                                    <option value=''>
                                        -- Chọn phường/xã --
                                    </option>
                                    {wards.map((w) => (
                                        <option key={w.code} value={w.code}>
                                            {w.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className='form-group'>
                                <label>
                                    Đường / Số nhà{' '}
                                    <span className='text-red-500'>*</span>
                                </label>
                                <input
                                    className='form-control'
                                    type='text'
                                    name='street'
                                    placeholder='Nhập tên đường, số nhà'
                                    value={formData.street}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            {/* Section: Upload */}
                            <div className='form-group full-width upload-section'>
                                <label className='upload-label'>
                                    📸 Hình ảnh phòng trọ
                                </label>
                                <FileUploaderRegular
                                    pubkey='84bfc996cb9f9a9b5d78'
                                    multiple={true}
                                    imgOnly={true}
                                    sourceList='local, camera, gdrive'
                                    classNameUploader='uc-light'
                                    onChange={handleImageUploadComplete}
                                    locale='vi'
                                />
                                {formData.imageUrls.length > 0 && (
                                    <div className='image-preview-grid'>
                                        {formData.imageUrls.map(
                                            (url, index) => (
                                                <div
                                                    key={index}
                                                    className='image-preview-container'
                                                >
                                                    <img
                                                        src={url}
                                                        alt={`Preview ${index + 1}`}
                                                        className='image-preview'
                                                    />
                                                    <button
                                                        type='button'
                                                        className='remove-image-btn'
                                                        onClick={() =>
                                                            removeImage(index)
                                                        }
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                            ),
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className='form-group full-width upload-section'>
                                <label className='upload-label'>
                                    📄 Tài liệu pháp lý (nếu có)
                                </label>
                                <FileUploaderRegular
                                    ref={uploaderRef}
                                    pubkey='84bfc996cb9f9a9b5d78'
                                    multiple={true}
                                    imgOnly={false}
                                    accept='.pdf,.doc,.docx,.txt'
                                    sourceList='local, gdrive'
                                    classNameUploader='uc-light'
                                    onChange={handleDocumentUploadComplete}
                                    locale='vi'
                                />
                                {formData.documentUrls.length > 0 && (
                                    <div style={{ marginTop: '12px' }}>
                                        <div
                                            style={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '8px',
                                            }}
                                        >
                                            {formData.documentUrls.map(
                                                (doc, index) => (
                                                    <div
                                                        key={index}
                                                        style={{
                                                            display: 'flex',
                                                            justifyContent:
                                                                'space-between',
                                                            padding: '8px 12px',
                                                            background:
                                                                '#e0e7ff',
                                                            borderRadius: '6px',
                                                            fontSize: '0.9rem',
                                                        }}
                                                    >
                                                        <span>
                                                            📄 {doc.name}
                                                        </span>
                                                        <button
                                                            type='button'
                                                            onClick={() =>
                                                                removeDocument(
                                                                    index,
                                                                )
                                                            }
                                                            style={{
                                                                border: 'none',
                                                                background:
                                                                    'transparent',
                                                                color: 'red',
                                                                cursor: 'pointer',
                                                                fontWeight:
                                                                    'bold',
                                                            }}
                                                        >
                                                            ×
                                                        </button>
                                                    </div>
                                                ),
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Section: Description */}
                            <div className='form-group full-width'>
                                <label>Mô tả chi tiết</label>
                                <textarea
                                    className='form-control'
                                    name='description'
                                    placeholder='Mô tả tiện ích, nội quy, giờ giấc...'
                                    value={formData.description}
                                    onChange={handleChange}
                                    rows={4}
                                />
                            </div>
                        </div>
                    </form>
                </div>

                {/* Footer Actions */}
                <div className='form-actions'>
                    <button
                        type='button'
                        onClick={onClose}
                        className='btn btn-secondary'
                        disabled={isSubmitting}
                    >
                        Hủy bỏ
                    </button>
                    <button
                        type='submit'
                        form='createRoomForm' // Link button outside form to the form ID
                        className='btn btn-primary'
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Đang xử lý...' : 'Đăng Ký Phòng'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RegisterForm;
