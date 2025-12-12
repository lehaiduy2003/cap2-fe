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
        imageUrls: [], // For images only
        documentUrls: [], // For documents (PDF, DOC, DOCX, TXT)
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
            console.log('Loaded provinces:', provincesData.length);
            setProvinces(provincesData);
        } catch (error) {
            console.error('Error loading provinces:', error);
        }

        // Configure Uploadcare locale
        if (uploaderRef.current) {
            uploaderRef.current.cfg.locale = 'vi';
        }
    }, []);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        if (type === 'checkbox') {
            setFormData((prev) => ({ ...prev, [name]: checked }));
        } else {
            setFormData((prev) => ({ ...prev, [name]: value }));
        }
    };

    const handleImageUploadComplete = (items) => {
        if (items && items.allEntries) {
            // Get all successfully uploaded files with proper CDN URLs
            const newUrls = items.allEntries
                .filter((file) => file.status === 'success')
                .map((file) => file.cdnUrl);

            if (newUrls.length > 0) {
                setFormData((prev) => {
                    // Filter out duplicates by creating a Set
                    const uniqueUrls = [
                        ...new Set([...prev.imageUrls, ...newUrls]),
                    ];
                    return {
                        ...prev,
                        imageUrls: uniqueUrls,
                    };
                });
            }
        }
    };

    const handleDocumentUploadComplete = (items) => {
        if (items && items.allEntries) {
            // Get all successfully uploaded document files
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
                    // Filter out duplicates by URL to prevent duplicate uploads
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

    const handleSubmit = async (e) => {
        e.preventDefault();

        const token = localStorage.getItem('authToken');

        try {
            const address = `${formData.street}, ${formData.ward}, ${formData.district}, ${formData.city}, Việt Nam`;

            // Get geocode
            let latitude = null;
            let longitude = null;
            try {
                const geocodeResponse = await fetch(
                    `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_API_KEY}`,
                );
                const geocodeData = await geocodeResponse.json();
                if (geocodeData.status === 'OK') {
                    const location = geocodeData.results[0].geometry.location;
                    latitude = location.lat;
                    longitude = location.lng;
                } else {
                    throw new Error('Geocoding failed: ' + geocodeData.status);
                }
            } catch (error) {
                console.error('Error geocoding:', error);
                alert('Không thể lấy tọa độ địa chỉ: ' + error.message);
                return;
            }

            // Create room data object
            const roomData = {
                title: formData.title,
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
                isRoomAvailable: formData.isRoomAvailable || true,
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
                throw new Error(errorData.message || 'Failed to create room');
            }

            const data = await response.json();
            const createdRoom = data.data;

            // Create document records if there are any documents uploaded
            try {
                const userId = localStorage.getItem('userId');

                if (formData.documentUrls.length > 0) {
                    for (const doc of formData.documentUrls) {
                        await fetch(`${VAT_API_URL}/api/v1/documents`, {
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
                        });
                    }
                }
                console.log(
                    `Created ${formData.documentUrls.length} document records`,
                );
            } catch (docError) {
                console.error('Error creating document records:', docError);
                // Don't fail the room creation if document upload fails
            }

            onRegister(createdRoom);
            onClose();
        } catch (error) {
            console.error('Error creating room:', error);
            alert('Tạo phòng thất bại: ' + error.message);
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
            console.log(`Selected province: ${province?.name}`);
            try {
                // Load districts first to get wards
                const districtsData = getDistrictsByProvinceCode(provinceCode);
                console.log(
                    `Loaded districts for ${province?.name}:`,
                    districtsData.length,
                );
                setDistricts(districtsData);
                setWards([]);
            } catch (error) {
                console.error('Error loading districts:', error);
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
                console.log(
                    `Loaded wards for ${district?.name}:`,
                    wardsData.length,
                );
                setWards(wardsData);
            } catch (error) {
                console.error('Error loading wards:', error);
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
                        {[
                            { label: 'Tiêu đề', name: 'title' },
                            { label: 'Giá', name: 'price' },
                            { label: 'Diện tích phòng', name: 'roomSize' },
                        ].map(({ label, name, type = 'text' }) => (
                            <div className='form-field' key={name}>
                                <label>{label}</label>
                                <input
                                    type={type}
                                    name={name}
                                    placeholder={label}
                                    value={formData[name] || ''}
                                    onChange={handleChange}
                                />
                            </div>
                        ))}

                        {/* Thành phố */}
                        <div className='form-field'>
                            <label>Thành phố/Tỉnh</label>
                            <select
                                style={{
                                    padding: '10px 12px',
                                    fontSize: '15px',
                                    border: '1px solid #ccc',
                                    borderRadius: '8px',
                                    backgroundColor: '#fff',
                                    color: '#333',
                                    outline: 'none',
                                    transition: 'border 0.3s, box-shadow 0.3s',
                                }}
                                value={
                                    provinces.find(
                                        (p) => p.name === formData.city,
                                    )?.code || ''
                                }
                                onChange={handleProvinceChange}
                            >
                                <option value=''>-- Chọn tỉnh/thành --</option>
                                {provinces.map((p) => (
                                    <option key={p.code} value={p.code}>
                                        {p.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Quận/Huyện */}
                        <div className='form-field'>
                            <label>Quận/Huyện</label>
                            <select
                                style={{
                                    padding: '10px 12px',
                                    fontSize: '15px',
                                    border: '1px solid #ccc',
                                    borderRadius: '8px',
                                    backgroundColor: '#fff',
                                    color: '#333',
                                    outline: 'none',
                                    transition: 'border 0.3s, box-shadow 0.3s',
                                }}
                                value={
                                    districts.find(
                                        (d) => d.name === formData.district,
                                    )?.code || ''
                                }
                                onChange={handleDistrictChange}
                                disabled={!districts.length}
                            >
                                <option value=''>-- Chọn quận/huyện --</option>
                                {districts.map((d) => (
                                    <option key={d.code} value={d.code}>
                                        {d.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Phường/Xã */}
                        <div className='form-field'>
                            <label>Phường/Xã</label>
                            <select
                                style={{
                                    padding: '10px 12px',
                                    fontSize: '15px',
                                    border: '1px solid #ccc',
                                    borderRadius: '8px',
                                    backgroundColor: '#fff',
                                    color: '#333',
                                    outline: 'none',
                                    transition: 'border 0.3s, box-shadow 0.3s',
                                }}
                                value={
                                    wards.find((w) => w.name === formData.ward)
                                        ?.code || ''
                                }
                                onChange={handleWardChange}
                                disabled={!wards.length}
                            >
                                <option value=''>-- Chọn phường/xã --</option>
                                {wards.map((w) => (
                                    <option key={w.code} value={w.code}>
                                        {w.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Đường phố */}
                        <div className='form-field'>
                            <label>Đường phố</label>
                            <input
                                type='text'
                                name='street'
                                placeholder='Đường phố'
                                value={formData.street || ''}
                                onChange={handleChange}
                            />
                        </div>

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
                                localeDefinitionOverride={{
                                    en: {
                                        'upload-file': 'Tải lên tệp',
                                        'upload-files': 'Tải lên tệp',
                                        'choose-file': 'Chọn tệp',
                                        'choose-files': 'Chọn tệp',
                                        'drop-files-here':
                                            'Kéo thả tệp vào đây',
                                        'select-file-source': 'Chọn nguồn tệp',
                                        selected: 'Đã chọn',
                                        upload: 'Tải lên',
                                        'add-more': 'Thêm',
                                        cancel: 'Hủy',
                                        clear: 'Xóa',
                                        'camera-shot': 'Chụp ảnh',
                                        'upload-url': 'Nhập URL',
                                        'upload-url-placeholder':
                                            'Dán URL ở đây',
                                        'edit-image': 'Chỉnh sửa ảnh',
                                        edit: 'Chỉnh sửa',
                                        remove: 'Xóa',
                                        'no-files': 'Chưa có tệp nào',
                                        done: 'Hoàn tất',
                                        'file-type-not-allowed':
                                            'Loại tệp không được phép',
                                        'file-size-exceeded':
                                            'Kích thước tệp vượt quá giới hạn',
                                        'upload-error': 'Lỗi tải lên',
                                        'no-camera': 'Không tìm thấy camera',
                                        'camera-access-denied':
                                            'Quyền truy cập camera bị từ chối',
                                        'camera-error': 'Lỗi camera',
                                        // Source names
                                        'source-local': 'Từ thiết bị',
                                        'source-camera': 'Máy ảnh',
                                        'source-gdrive': 'Google Drive',
                                        'source-dropbox': 'Dropbox',
                                        'source-url': 'URL',
                                        // Alternative keys for sources
                                        local: 'Từ thiết bị',
                                        camera: 'Máy ảnh',
                                        gdrive: 'Google Drive',
                                        dropbox: 'Dropbox',
                                        url: 'URL',
                                        // Modal text
                                        'from-device': 'Từ thiết bị',
                                        'from-camera': 'Máy ảnh',
                                        'from-gdrive': 'Google Drive',
                                        'from-url': 'Từ URL',
                                    },
                                }}
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
                            <label>
                                Tài liệu phòng trọ (PDF, DOC, DOCX, TXT)
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
                                <div style={{ marginTop: '10px' }}>
                                    <p
                                        style={{
                                            fontSize: '14px',
                                            marginBottom: '8px',
                                            fontWeight: '500',
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
                                                        alignItems: 'center',
                                                        justifyContent:
                                                            'space-between',
                                                        padding: '8px 12px',
                                                        backgroundColor:
                                                            '#f3f4f6',
                                                        borderRadius: '6px',
                                                    }}
                                                >
                                                    <span
                                                        style={{
                                                            fontSize: '14px',
                                                        }}
                                                    >
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
                                                            background: 'none',
                                                            border: 'none',
                                                            color: '#ef4444',
                                                            fontSize: '18px',
                                                            cursor: 'pointer',
                                                            padding: '0 8px',
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
                            <label>Mô tả</label>
                            <textarea
                                name='description'
                                placeholder='Mô tả chi tiết'
                                value={formData.description || ''}
                                onChange={handleChange}
                            />
                        </div>

                        {/* <div
                            className='form-field'
                            style={{ gridColumn: '1 / -1' }}
                        >
                            <label>Tình trạng phòng trọ</label>
                            <input
                                type='checkbox'
                                name='isRoomAvailable'
                                checked={formData.isRoomAvailable}
                                onChange={handleChange}
                            />
                        </div> */}
                    </div>

                    <div
                        style={{
                            marginTop: '20px',
                            display: 'flex',
                            gap: '12px',
                        }}
                    >
                        <button type='submit' className='register-btn1'>
                            Đăng Ký
                        </button>
                        <button type='button' onClick={onClose}>
                            Đóng
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RegisterForm;
