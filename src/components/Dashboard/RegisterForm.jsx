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

    // Dùng useEffect một lần để load data tĩnh
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
                .map((file) => {
                    let cdnUrl = file.cdnUrl;
                    if (
                        cdnUrl &&
                        cdnUrl.startsWith('http:/') &&
                        !cdnUrl.startsWith('https://')
                    ) {
                        cdnUrl = cdnUrl.replace('http:/', 'https://');
                    }
                    return cdnUrl;
                });
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

    // Hàm lấy tọa độ tách biệt để code gọn hơn
    const getCoordinates = async (address) => {
        const response = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_API_KEY}`,
        );
        const data = await response.json();
        if (data.status !== 'OK') {
            throw new Error(`Geocoding failed: ${data.status}`);
        }
        return data.results[0].geometry.location; // { lat, lng }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // 1. CHỐNG SPAM CLICK: Nếu đang submit thì dừng ngay
        if (isSubmitting) return;

        const token = localStorage.getItem('authToken');
        if (!token) {
            alert('Vui lòng đăng nhập lại.');
            return;
        }

        // 2. BẮT ĐẦU LOCK NÚT
        setIsSubmitting(true);

        try {
            // Validate sơ bộ (Backend vẫn cần check kỹ hơn)
            if (!formData.title.trim() || !formData.price || !formData.city) {
                throw new Error('Vui lòng điền đầy đủ thông tin bắt buộc.');
            }

            const address = `${formData.street}, ${formData.ward}, ${formData.district}, ${formData.city}, Việt Nam`;

            // Lấy tọa độ
            let latitude = null;
            let longitude = null;
            try {
                const location = await getCoordinates(address);
                latitude = location.lat;
                longitude = location.lng;
            } catch (geoError) {
                console.warn('Không lấy được tọa độ:', geoError);
                // Quyết định của Architect: Có cho phép tạo phòng nếu map lỗi không?
                // Tạm thời cho phép, nhưng cảnh báo.
                if (
                    !confirm(
                        'Không thể xác định vị trí trên bản đồ. Bạn có muốn tiếp tục đăng không?',
                    )
                ) {
                    return;
                }
            }

            const roomData = {
                title: formData.title.trim(),
                price: formData.price, // API nên handle string -> number, hoặc convert ở đây: Number(formData.price)
                roomSize: parseFloat(formData.roomSize),
                numBedrooms: 1, // Hardcode theo logic cũ của bạn
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

            // API Create Room
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

            // Xử lý documents (nếu có) - Chạy song song để tối ưu tốc độ
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

            // Success
            onRegister(createdRoom);
            onClose();
        } catch (error) {
            console.error('Error creating room:', error);
            alert(`Lỗi: ${error.message}`);
        } finally {
            // 3. MỞ KHÓA NÚT (Luôn chạy dù thành công hay thất bại)
            // Chỉ cần thiết nếu form không bị đóng (onClose).
            // Nếu onClose chạy, component unmount thì dòng này có thể gây warning nhẹ trên console (không ảnh hưởng app).
            // Để an toàn, ta kiểm tra xem component còn mount không (phức tạp),
            // hoặc đơn giản là để nó ở đây để xử lý trường hợp lọt vào catch block.
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

    // Logic handle change địa chỉ giữ nguyên
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
                <h2>Đăng ký phòng trọ của bạn</h2>
                <form onSubmit={handleSubmit}>
                    <div className='form-section'>
                        {/* Các input giữ nguyên */}
                        {[
                            { label: 'Tiêu đề', name: 'title' },
                            {
                                label: 'Giá (VND/Tháng)',
                                name: 'price',
                                type: 'number',
                            }, // Thêm type number cho UX tốt hơn
                            {
                                label: 'Diện tích (m²)',
                                name: 'roomSize',
                                type: 'number',
                            },
                        ].map(({ label, name, type = 'text' }) => (
                            <div className='form-field' key={name}>
                                <label>{label}</label>
                                <input
                                    type={type}
                                    name={name}
                                    placeholder={label}
                                    value={formData[name] || ''}
                                    onChange={handleChange}
                                    required // Clean Code: Thêm required cho HTML validation cơ bản
                                />
                            </div>
                        ))}

                        {/* Select Tỉnh/Thành */}
                        <div className='form-field'>
                            <label>Thành phố/Tỉnh</label>
                            <select
                                className='custom-select' // Nên move style inline ra file CSS
                                style={{
                                    padding: '10px',
                                    borderRadius: '8px',
                                    border: '1px solid #ccc',
                                }}
                                value={
                                    provinces.find(
                                        (p) => p.name === formData.city,
                                    )?.code || ''
                                }
                                onChange={handleProvinceChange}
                                required
                            >
                                <option value=''>-- Chọn tỉnh/thành --</option>
                                {provinces.map((p) => (
                                    <option key={p.code} value={p.code}>
                                        {p.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Select Quận/Huyện */}
                        <div className='form-field'>
                            <label>Quận/Huyện</label>
                            <select
                                style={{
                                    padding: '10px',
                                    borderRadius: '8px',
                                    border: '1px solid #ccc',
                                }}
                                value={
                                    districts.find(
                                        (d) => d.name === formData.district,
                                    )?.code || ''
                                }
                                onChange={handleDistrictChange}
                                disabled={!districts.length}
                                required
                            >
                                <option value=''>-- Chọn quận/huyện --</option>
                                {districts.map((d) => (
                                    <option key={d.code} value={d.code}>
                                        {d.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Select Phường/Xã */}
                        <div className='form-field'>
                            <label>Phường/Xã</label>
                            <select
                                style={{
                                    padding: '10px',
                                    borderRadius: '8px',
                                    border: '1px solid #ccc',
                                }}
                                value={
                                    wards.find((w) => w.name === formData.ward)
                                        ?.code || ''
                                }
                                onChange={handleWardChange}
                                disabled={!wards.length}
                                required
                            >
                                <option value=''>-- Chọn phường/xã --</option>
                                {wards.map((w) => (
                                    <option key={w.code} value={w.code}>
                                        {w.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className='form-field'>
                            <label>Đường phố</label>
                            <input
                                type='text'
                                name='street'
                                placeholder='Số nhà, tên đường'
                                value={formData.street || ''}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        {/* Upload Care Components giữ nguyên */}
                        <div
                            className='form-field'
                            style={{ gridColumn: '1 / -1' }}
                        >
                            <label>Hình ảnh phòng trọ</label>
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
                                    {formData.imageUrls.map((url, index) => (
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
                                    ))}
                                </div>
                            )}
                        </div>

                        <div
                            className='form-field'
                            style={{ gridColumn: '1 / -1' }}
                        >
                            <label>Tài liệu (PDF, DOC, DOCX, TXT)</label>
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
                                <div style={{ marginTop: '10px' }}>
                                    <p
                                        style={{
                                            fontSize: '14px',
                                            marginBottom: '8px',
                                        }}
                                    >
                                        Đã tải lên{' '}
                                        {formData.documentUrls.length} tài liệu:
                                    </p>
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
                                                        padding: '8px',
                                                        background: '#f3f4f6',
                                                        borderRadius: '4px',
                                                    }}
                                                >
                                                    <span>📄 {doc.name}</span>
                                                    <button
                                                        type='button'
                                                        onClick={() =>
                                                            removeDocument(
                                                                index,
                                                            )
                                                        }
                                                        style={{
                                                            border: 'none',
                                                            color: 'red',
                                                            cursor: 'pointer',
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

                        <div
                            className='form-field'
                            style={{ gridColumn: '1 / -1' }}
                        >
                            <label>Mô tả chi tiết</label>
                            <textarea
                                name='description'
                                placeholder='Mô tả tiện ích, nội quy...'
                                value={formData.description || ''}
                                onChange={handleChange}
                                rows={4}
                            />
                        </div>
                    </div>

                    <div
                        style={{
                            marginTop: '20px',
                            display: 'flex',
                            gap: '12px',
                        }}
                    >
                        <button
                            type='submit'
                            className={`register-btn1 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                            disabled={isSubmitting} // 4. THUỘC TÍNH QUAN TRỌNG NHẤT
                            style={{ position: 'relative' }} // Để custom spinner nếu cần
                        >
                            {isSubmitting ? (
                                <span>⏳ Đang xử lý...</span>
                            ) : (
                                'Đăng Ký'
                            )}
                        </button>
                        <button
                            type='button'
                            onClick={onClose}
                            disabled={isSubmitting} // Không cho đóng khi đang submit dở để tránh lỗi state
                        >
                            Đóng
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RegisterForm;
