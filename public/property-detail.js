// property-detail.js

// --- Cấu hình ---

// Trong đồ án, bạn có thể lấy ID từ URL (ví dụ: ?id=1)
// Tạm thời chúng ta sẽ hardcode ID=1 để demo
const PROPERTY_ID = 1; 
const API_BASE_URL = 'http://localhost:3000'; // URL API Server của bạn

// --- DOM References ---
// Lấy các phần tử HTML 1 lần duy nhất để tối ưu hiệu năng
const loadingEl = document.getElementById('loading-state');
const errorEl = document.getElementById('error-state');
const scoreDataEl = document.getElementById('score-data');
const scoreCircleEl = document.getElementById('score-circle');
const overallScoreEl = document.getElementById('overall-score');
const overallTextEl = document.getElementById('overall-text');
const crimeScoreEl = document.getElementById('crime-score');
const userScoreEl = document.getElementById('user-score');
const envScoreEl = document.getElementById('env-score');
const lastUpdatedEl = document.getElementById('last-updated');

// --- Hàm chính (Chạy khi trang được tải) ---
document.addEventListener('DOMContentLoaded', () => {
    loadSafetyScore(PROPERTY_ID);
});

/**
 * Hàm chính để tải và hiển thị dữ liệu điểm an toàn
 * @param {number} propertyId ID của phòng trọ
 */
async function loadSafetyScore(propertyId) {
    // Luôn bọc API call trong try...catch
    try {
        // 1. Gọi API
        const response = await fetch(`${API_BASE_URL}/api/v1/properties/${propertyId}/safety`);

        // 2. Kiểm tra lỗi (VD: 404, 500)
        // Đây là cách xử lý lỗi "clean" nhất
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
        }

        // 3. Lấy dữ liệu JSON
        const data = await response.json();

        // 4. Điền dữ liệu vào HTML
        updateDOM(data);

        // 5. Hiển thị nội dung
        loadingEl.style.display = 'none';
        scoreDataEl.style.display = 'block';

    } catch (error) {
        // Nếu có bất kỳ lỗi nào (mạng, API, ...)
        console.error('Không thể tải điểm an toàn:', error.message);
        
        // Hiển thị thông báo lỗi
        loadingEl.style.display = 'none';
        errorEl.style.display = 'block';
        errorEl.innerText = `Lỗi: ${error.message}`;
    }
}

/**
 * Hàm tiện ích: Cập nhật DOM với dữ liệu từ API
 * (Tách riêng logic DOM và logic API là Clean Code)
 * @param {object} data Dữ liệu điểm từ API
 */
function updateDOM(data) {
    // data = { overall_score: "8.2", crime_score: "10.0", ... }

    // 1. Điền các điểm số
    const score = parseFloat(data.overall_score);
    overallScoreEl.innerText = data.overall_score;
    crimeScoreEl.innerText = data.crime_score;
    userScoreEl.innerText = data.user_score;
    envScoreEl.innerText = data.environment_score;

    // 2. Format ngày giờ
    const updatedDate = new Date(data.last_updated_at);
    lastUpdatedEl.innerText = updatedDate.toLocaleString('vi-VN', {
        dateStyle: 'short',
        timeStyle: 'short'
    });

    // 3. Cập nhật màu sắc và văn bản
    if (score >= 8.0) {
        scoreCircleEl.className = 'score-circle good'; // Dùng .className để thay thế hoàn toàn
        overallTextEl.innerText = 'Rất tốt';
    } else if (score >= 5.0) {
        scoreCircleEl.className = 'score-circle medium';
        overallTextEl.innerText = 'Trung bình';
    } else {
        scoreCircleEl.className = 'score-circle bad';
        overallTextEl.innerText = 'Cần cẩn trọng';
    }
}