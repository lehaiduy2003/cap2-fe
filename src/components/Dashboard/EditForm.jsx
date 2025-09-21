import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
    getProvinces,
    getDistrictsByProvinceCode,
    getWardsByDistrictCode,
} from 'sub-vn';
import './css/EditForm.css';
import { BASE_API_URL } from '../../constants';

const EditForm = ({ hotel, onClose, onUpdate }) => {
    const [formData, setFormData] = useState({ ...hotel });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const token = localStorage.getItem('authToken');

    // sub-vn
    const [provinces] = useState(getProvinces());
    const [districts, setDistricts] = useState([]);
    const [wards, setWards] = useState([]);

    // Load districts/wards theo dữ liệu sẵn có của phòng
    useEffect(() => {
        const selectedProvince = provinces.find((p) => p.name === hotel.city);
        if (selectedProvince) {
            const dists = getDistrictsByProvinceCode(selectedProvince.code);
            setDistricts(dists);

            const selectedDistrict = dists.find(
                (d) => d.name === hotel.district,
            );
            if (selectedDistrict) {
                const wrds = getWardsByDistrictCode(selectedDistrict.code);
                setWards(wrds);
            }
        }
    }, [hotel, provinces]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleProvinceChange = (e) => {
        const provinceCode = e.target.value;
        const selectedProvince = provinces.find((p) => p.code === provinceCode);
        setFormData((prev) => ({
            ...prev,
            city: selectedProvince?.name || '',
            district: '',
            ward: '',
        }));
        const newDistricts = getDistrictsByProvinceCode(provinceCode);
        setDistricts(newDistricts);
        setWards([]);
    };

    const handleDistrictChange = (e) => {
        const districtCode = e.target.value;
        const selectedDistrict = districts.find((d) => d.code === districtCode);
        setFormData((prev) => ({
            ...prev,
            district: selectedDistrict?.name || '',
            ward: '',
        }));
        const newWards = getWardsByDistrictCode(districtCode);
        setWards(newWards);
    };

    const handleWardChange = (e) => {
        const wardCode = e.target.value;
        const selectedWard = wards.find((w) => w.code === wardCode);
        setFormData((prev) => ({
            ...prev,
            ward: selectedWard?.name || '',
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(
                `${BASE_API_URL}/api/rooms/${formData.id}`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(formData),
                },
            );

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || 'Failed to update room');
            }

            const data = await response.json();
            onUpdate(data.body);
            onClose();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (typeof window === 'undefined' || !document.body) return null;

    return createPortal(
        <div className='edit-form-overlay'>
            <div className='edit-form'>
                <h2>Chỉnh sửa thông tin phòng trọ</h2>
                <form onSubmit={handleSubmit}>
                    <div className='form-section'>
                        {[
                            { label: 'Tiêu đề', name: 'title' },
                            { label: 'Vị trí', name: 'location' },
                            {
                                label: 'Địa chỉ chi tiết',
                                name: 'addressDetails',
                            },
                            { label: 'Giá', name: 'price' },
                            { label: 'Diện tích phòng', name: 'roomSize' },
                            { label: 'Số phòng ngủ', name: 'numBedrooms' },
                            { label: 'Số phòng tắm', name: 'numBathrooms' },
                            {
                                label: 'Có sẵn từ',
                                name: 'availableFrom',
                                type: 'date',
                            },
                            { label: 'Đường phố', name: 'street' },
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
                            <label>Thành phố</label>
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
                                onChange={handleProvinceChange}
                            >
                                <option value=''>-- Chọn tỉnh/thành --</option>
                                {provinces.map((p) => (
                                    <option
                                        key={p.code}
                                        value={p.code}
                                        selected={p.name === formData.city}
                                    >
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
                                onChange={handleDistrictChange}
                                disabled={!districts.length}
                            >
                                <option value=''>-- Chọn quận/huyện --</option>
                                {districts.map((d) => (
                                    <option
                                        key={d.code}
                                        value={d.code}
                                        selected={d.name === formData.district}
                                    >
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
                                onChange={handleWardChange}
                                disabled={!wards.length}
                            >
                                <option value=''>-- Chọn phường/xã --</option>
                                {wards.map((w) => (
                                    <option
                                        key={w.code}
                                        value={w.code}
                                        selected={w.name === formData.ward}
                                    >
                                        {w.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Mô tả */}
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

                        {/* Checkbox */}
                        <div
                            className='form-field'
                            style={{ gridColumn: '1 / -1' }}
                        >
                            <label>Phòng trọ còn trống</label>
                            <input
                                type='checkbox'
                                name='isRoomAvailable'
                                checked={formData.isRoomAvailable}
                                onChange={() =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        isRoomAvailable: !prev.isRoomAvailable,
                                    }))
                                }
                            />
                        </div>
                    </div>

                    {error && <p style={{ color: 'red' }}>{error}</p>}

                    <div
                        style={{
                            marginTop: '20px',
                            display: 'flex',
                            gap: '12px',
                        }}
                    >
                        <button
                            type='submit'
                            className='update-btn'
                            disabled={loading}
                        >
                            {loading ? 'Đang cập nhật...' : 'Cập Nhật'}
                        </button>
                        <button
                            type='button'
                            onClick={onClose}
                            disabled={loading}
                        >
                            Đóng
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body,
    );
};

export default EditForm;
