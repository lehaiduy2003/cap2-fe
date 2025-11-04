// admin.js
document.getElementById('incident-form').addEventListener('submit', async function(event) {
    event.preventDefault(); // Ngăn form gửi

    const statusEl = document.getElementById('status');
    statusEl.innerText = 'Đang gửi...';
    // 1. Lấy dữ liệu từ form
    const apiKey = document.getElementById('admin-key').value;
    const data = {
        property_id: parseInt(document.getElementById('property-id').value, 10),
        incident_type: document.getElementById('incident-type').value,
        severity: document.getElementById('severity').value,
        incident_date: document.getElementById('incident-date').value,
        notes: document.getElementById('notes').value
    };
    // 2. Validate sơ 
    if (!apiKey || !data.property_id || !data.incident_date) {
        statusEl.innerText = 'Lỗi: Vui lòng điền đủ API Key, Property ID và Ngày.';
        statusEl.style.color = 'red';
        return;
    }
    // 3. Gọi API POST /api/v1/admin/incidents
    try {
        const response = await fetch('http://localhost:3000/api/v1/admin/incidents', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey // Header xác thực Admin
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (response.status === 201) { // 201 Created
            statusEl.innerText = 'Thành công! Đã thêm sự cố.';
            statusEl.style.color = 'green';
            // Không reset form để admin có thể nhập tiếp
        } else {
            // Hiển thị lỗi từ server (vd: 401 Unauthorized, 400 Bad Request)
            statusEl.innerText = `Lỗi (${response.status}): ${result.error}`;
            statusEl.style.color = 'red';
        }
    } catch (error) {
        console.error('Fetch error:', error);
        statusEl.innerText = 'Lỗi: Không thể kết nối đến server.';
        statusEl.style.color = 'red';
    }
});