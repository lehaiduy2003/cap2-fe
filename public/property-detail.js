// property-detail.js

// --- Cấu hình ---
const PROPERTY_ID = 1; // (new URLSearchParams(window.location.search).get('id'))
const API_BASE_URL = 'http://localhost:3000'; 

// --- DOM References ---
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
const aiSummaryEl = document.getElementById('ai-summary'); 

// --- Hàm chính (Chạy khi trang được tải) ---
document.addEventListener('DOMContentLoaded', () => {
    loadSafetyScore(PROPERTY_ID);
});

/**
 * Hàm chính để tải và hiển thị dữ liệu điểm an toàn
 * @param {number} propertyId ID của phòng trọ
 */
async function loadSafetyScore(propertyId) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/v1/properties/${propertyId}/safety`);

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        updateDOM(data);

        loadingEl.style.display = 'none';
        scoreDataEl.style.display = 'block';

    } catch (error) {
        console.error('Không thể tải điểm an toàn:', error.message);
        loadingEl.style.display = 'none';
        errorEl.style.display = 'block';
        errorEl.innerText = `Lỗi: ${error.message}`;
    }
}

/**
 * Hàm tiện ích: Cập nhật DOM với dữ liệu từ API
 * @param {object} data Dữ liệu điểm từ API
 */
function updateDOM(data) {
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
        scoreCircleEl.className = 'score-circle good'; 
        overallTextEl.innerText = 'Rất tốt';
    } else if (score >= 5.0) {
        scoreCircleEl.className = 'score-circle medium';
        overallTextEl.innerText = 'Trung bình';
    } else {
        scoreCircleEl.className = 'score-circle bad';
        overallTextEl.innerText = 'Cần cẩn trọng';
    }

    // 4. [MỚI] Điền nhận xét của AI
    // (data.ai_summary có thể là 'null' nếu Worker chưa chạy)
    if (data.ai_summary) {
        aiSummaryEl.innerText = data.ai_summary;
    } else {
        aiSummaryEl.innerText = "Hệ thống đang phân tích... Vui lòng quay lại sau 1 phút.";
    }
}