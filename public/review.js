// review.js
document.getElementById('review-form').addEventListener('submit', async function(event) {
    event.preventDefault(); 

    const statusEl = document.getElementById('status');
    statusEl.innerText = 'Đang gửi...';
    
    // 1. Lấy dữ liệu từ form
    const userId = document.getElementById('user-id').value;
    const propertyId = document.getElementById('property-id').value;
    const reviewText = document.getElementById('review-text').value;
    
    // --- [CẬP NHẬT LOGIC] ---
    // Helper function để lấy giá trị sao
    const getRating = (name) => {
        const el = document.querySelector(`input[name="${name}"]:checked`);
        return el ? parseInt(el.value, 10) : null;
    };

    // Lấy tất cả 4 giá trị
    const safetyRating = getRating('safety_rating');
    const cleanlinessRating = getRating('cleanliness_rating');
    const amenitiesRating = getRating('amenities_rating');
    const hostRating = getRating('host_rating');

    // Kiểm tra tất cả đều được chọn
    if (!safetyRating || !cleanlinessRating || !amenitiesRating || !hostRating) {
        statusEl.innerText = 'Lỗi: Vui lòng điền đủ tất cả 4 mục đánh giá sao.';
        statusEl.style.color = 'red';
        return;
    }
    
    const data = {
        property_id: parseInt(propertyId, 10),
        review_text: reviewText,
        safety_rating: safetyRating,
        cleanliness_rating: cleanlinessRating,
        amenities_rating: amenitiesRating,
        host_rating: hostRating
    };
    // --- [KẾT THÚC CẬP NHẬT] ---

    // 2. Gọi API POST
    try {
        const response = await fetch('http://localhost:3000/api/v1/reviews', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-user-id': userId 
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        // ... (phần code .then / .catch giữ nguyên) ...
        if (response.ok) {
            statusEl.innerText = 'Thành công! Cảm ơn bạn đã đánh giá.';
            statusEl.style.color = 'green';
            document.getElementById('review-form').reset();
        } else {
            statusEl.innerText = `Lỗi: ${result.error}`;
            statusEl.style.color = 'red';
        }
    } catch (error) {
        console.error('Fetch error:', error);
        statusEl.innerText = 'Lỗi: Không thể kết nối đến server.';
        statusEl.style.color = 'red';
    }
});