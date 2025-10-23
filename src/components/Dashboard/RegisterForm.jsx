import React, { useState, useEffect } from 'react';
import './css/RegisterForm.css';
import {
    getProvinces,
    getDistrictsByProvinceCode,
    getWardsByDistrictCode,
} from 'sub-vn';
import { BASE_API_URL } from '../../constants';

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
        imageFiles: [],
        description: '',
        isRoomAvailable: true,
    });

    const [imagePreviews, setImagePreviews] = useState([]);
    const [provinces, setProvinces] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [wards, setWards] = useState([]);

    useEffect(() => {
        try {
            const provincesData = getProvinces();
            console.log('Loaded provinces:', provincesData.length);
            setProvinces(provincesData);
        } catch (error) {
            console.error('Error loading provinces:', error);
        }
    }, []);

    const handleChange = (e) => {
        const { name, value, files, type, checked } = e.target;

        if (name === 'images' && files.length > 0) {
            const newImageFiles = Array.from(files);
            setFormData((prev) => ({
                ...prev,
                imageFiles: newImageFiles,
            }));

            const newPreviews = newImageFiles.map((file) =>
                URL.createObjectURL(file),
            );
            setImagePreviews(newPreviews);
        } else if (type === 'checkbox') {
            setFormData((prev) => ({ ...prev, [name]: checked }));
        } else {
            setFormData((prev) => ({ ...prev, [name]: value }));
        }
    };

    React.useEffect(() => {
        return () => {
            imagePreviews.forEach((preview) => URL.revokeObjectURL(preview));
        };
    }, [imagePreviews]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        const token = localStorage.getItem('authToken');
        const headers = {
            Authorization: `Bearer ${token}`,
        };

        try {
            const form = new FormData();
            form.append('title', formData.title);
            form.append('price', formData.price);
            form.append('roomSize', formData.roomSize);
            form.append('numBedrooms', formData.numBedrooms);
            form.append('numBathrooms', formData.numBathrooms);
            form.append('availableFrom', formData.availableFrom);
            form.append('city', formData.city);
            form.append('district', formData.district);
            form.append('ward', formData.ward);
            form.append('street', formData.street);
            form.append('description', formData.description);
            form.append('isRoomAvailable', formData.isRoomAvailable);

            formData.imageFiles.forEach((file) => {
                form.append('images', file);
            });

            const response = await fetch(`${BASE_API_URL}/api/rooms`, {
                method: 'POST',
                headers: headers,
                body: form,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to create room');
            }

            const data = await response.json();
            onRegister(data.data);
            onClose();
        } catch (error) {
            console.error('Error creating room:', error);
            alert('Tạo phòng thất bại: ' + error.message);
        }
    };

    const removeImage = (index) => {
        setFormData((prev) => ({
            ...prev,
            imageFiles: prev.imageFiles.filter((_, i) => i !== index),
        }));
        setImagePreviews((prev) => prev.filter((_, i) => i !== index));
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
                            { label: 'Số phòng ngủ', name: 'numBedrooms' },
                            { label: 'Số phòng tắm', name: 'numBathrooms' },
                            {
                                label: 'Có sẵn từ',
                                name: 'availableFrom',
                                type: 'date',
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
                                />
                            </div>
                        ))}

                        {/* Thành phố */}
                        <div className='form-field'>
                            <label>
                                Thành phố/Tỉnh ({provinces.length} tỉnh/thành)
                            </label>
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
                            <label>
                                Quận/Huyện ({districts.length} quận/huyện)
                            </label>
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
                            <label>Phường/Xã ({wards.length} phường/xã)</label>
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
                            <label>Hình ảnh (có thể chọn nhiều ảnh)</label>
                            <input
                                type='file'
                                name='images'
                                accept='image/*'
                                multiple
                                onChange={handleChange}
                            />
                            {imagePreviews.length > 0 && (
                                <div className='image-preview-grid'>
                                    {imagePreviews.map((preview, index) => (
                                        <div
                                            key={index}
                                            className='image-preview-container'
                                        >
                                            <img
                                                src={preview}
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
                            <label>Mô tả</label>
                            <textarea
                                name='description'
                                placeholder='Mô tả chi tiết'
                                value={formData.description || ''}
                                onChange={handleChange}
                            />
                        </div>

                        <div
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
                        </div>
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
