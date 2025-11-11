// src/components/Dashboard/AddIncidentForm.jsx
import React, { useState } from 'react';
import axios from 'axios';
// Import CSS cho component này
import './css/AddIncidentForm.css';

// Component Form báo cáo sự cố cho Admin
function AddIncidentForm() {
    const [formData, setFormData] = useState({
        roomId: '',
        incidentType: 'theft', // Giá trị mặc định
        severity: 'low', // Giá trị mặc định
        dateOccurred: '',
        notes: '',
    });

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setSuccess(null);

        // ====================================================================
        // CẢNH BÁO KIẾN TRÚC & NỢ KỸ THUẬT (TECHNICAL DEBT)
        //
        // File `src/lib/axios.js` của bạn tạo `axiosInstance` trỏ đến `BASE_API_URL`
        // (backend `cap2-be` Java).
        //
        // Yêu cầu là gọi đến `cap2-vat`. Chúng ta phải tạo một instance Axios mới.
        //
        // GIẢI PHÁP CHUẨN: Bạn nên thêm VITE_VAT_API_URL vào file .env
        // và quản lý các instance axios một cách tập trung.
        // ====================================================================

        // Đọc token từ localStorage, giống như `axios.js`
        const token = localStorage.getItem('authToken');

        const vatApi = axios.create({
            baseURL: 'http://localhost:8888', // URL của backend cap2-vat
            headers: {
                // Bắt buộc phải gửi token của Admin để bảo vệ API
                Authorization: `Bearer ${token}`,
            },
        });

        try {
            // 1. Gửi dữ liệu (Backend đã có cơ chế lọc)
            const response = await vatApi.post('/incidents', formData);

            if (response.status === 201) {
                setSuccess(
                    `Thêm sự cố (ID: ${response.data.incidentId}) thành công!`,
                );
                // Reset form
                setFormData({
                    roomId: '',
                    incidentType: 'theft',
                    severity: 'low',
                    dateOccurred: '',
                    notes: '',
                });
            }
        } catch (err) {
            // 2. Xử lý Lỗi (Error Handling)
            console.error('Lỗi khi gửi sự cố:', err);
            if (err.response) {
                // Lỗi do server trả về (4xx, 5xx)
                setError(
                    err.response.data.error || 'Lỗi từ máy chủ `cap2-vat`.',
                );
            } else if (err.request) {
                // Lỗi không thể kết nối
                setError(
                    'Không thể kết nối đến máy chủ `cap2-vat`. Vui lòng kiểm tra xem service đã chạy chưa.',
                );
            } else {
                // Lỗi khác
                setError('Lỗi không xác định đã xảy ra.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        // Sử dụng class name tương tự các component dashboard khác
        <div className='add-incident-container'>
            <h2>Báo Cáo Sự Cố Mới</h2>
            {/* Thông báo động */}
            {error && <div className='incident-alert error'>{error}</div>}
            {success && <div className='incident-alert success'>{success}</div>}

            <form onSubmit={handleSubmit} className='incident-form'>
                <div className='form-group'>
                    <label htmlFor='roomId'>ID Phòng trọ</label>
                    <input
                        type='number'
                        id='roomId'
                        name='roomId'
                        value={formData.roomId}
                        onChange={handleChange}
                        required
                        placeholder='Nhập ID của phòng'
                    />
                </div>

                <div className='form-group'>
                    <label htmlFor='incidentType'>Loại Sự Cố</label>
                    <select
                        id='incidentType'
                        name='incidentType'
                        value={formData.incidentType}
                        onChange={handleChange}
                        required
                    >
                        <option value='theft'>Trộm cắp vặt</option>
                        <option value='robbery'>Cướp giật</option>
                        <option value='harassment'>Quấy rối</option>
                        <option value='noise'>Gây rối ồn ào</option>
                        <option value='accident'>Tai nạn</option>
                        <option value='other'>Khác</option>
                    </select>
                </div>

                <div className='form-group'>
                    <label htmlFor='severity'>Mức Độ Nghiêm Trọng</label>
                    <select
                        id='severity'
                        name='severity'
                        value={formData.severity}
                        onChange={handleChange}
                        required
                    >
                        <option value='low'>Thấp</option>
                        <option value='medium'>Trung bình</option>
                        <option value='high'>Cao</option>
                        <option value='critical'>Rất nghiêm trọng</option>
                    </select>
                </div>

                <div className='form-group'>
                    <label htmlFor='dateOccurred'>Ngày Xảy Ra</label>
                    <input
                        type='date'
                        id='dateOccurred'
                        name='dateOccurred'
                        value={formData.dateOccurred}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className='form-group'>
                    <label htmlFor='notes'>Ghi Chú (Tùy chọn)</label>
                    <textarea
                        id='notes'
                        name='notes'
                        value={formData.notes}
                        onChange={handleChange}
                        placeholder='Mô tả thêm về sự cố, vị trí cụ thể...'
                    />
                </div>

                <button
                    type='submit'
                    disabled={isLoading}
                    className='submit-btn'
                >
                    {isLoading ? 'Đang gửi...' : 'Gửi Báo Cáo'}
                </button>
            </form>
        </div>
    );
}

export default AddIncidentForm;
