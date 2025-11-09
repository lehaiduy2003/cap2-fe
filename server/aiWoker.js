
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { Pool } = require('pg');
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require("@google/generative-ai");

// --- Cấu hình ---
const dbConfig = {
    user: process.env.PGUSER,
    host: process.env.PGHOST,
    database: process.env.PGDATABASE,
    password: process.env.PGPASSWORD,
    port: parseInt(process.env.PGPORT, 10),
};

const pool = new Pool(dbConfig);
pool.on('error', (err) => {
    console.error('[DB POOL - WORKER] Lỗi kết nối CSDL:', err.message);
});

// --- [MỚI] KHỞI TẠO AI ---
if (!process.env.GEMINI_API_KEY) {
    console.error('[LỖI NGHIÊM TRỌNG] GEMINI_API_KEY chưa được thiết lập. Worker không thể khởi động.');
    process.exit(1);
}
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const aiModel = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash-latest" // Dùng Flash cho tốc độ nhanh
});

// Cấu hình an toàn (bỏ qua các chặn mặc định)
const safetySettings = [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
];

/**
 * 💡 [PHIÊN BẢN CHÍNH THỨC] Hàm gọi AI để tạo nhận xét
 */
async function generateAISummary(crimeScore, userScore, envScore) {
    const prompt = `
        Bạn là một trợ lý đánh giá khu vực.
        Dựa trên 3 điểm số sau (thang 10, trong đó 10 là tốt nhất):
        - Điểm An ninh (Tội phạm): ${crimeScore.toFixed(1)}
        - Điểm Cộng đồng (Review): ${userScore.toFixed(1)}
        - Điểm Môi trường (Tiện ích): ${envScore.toFixed(1)}
        
        Hãy viết 2 câu nhận xét tổng quan ngắn gọn về khu vực này cho một người đang tìm phòng trọ.
        Giọng văn trung lập, tập trung vào sự thật.
        Ví dụ: "Điểm an ninh ở mức khá, được cộng đồng đánh giá tốt. Môi trường xung quanh có một số điểm trừ nhỏ."
    `;

    try {
        const result = await aiModel.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: 0.7, 
                maxOutputTokens: 100,
            },
            safetySettings,
        });

        const response = result.response;
        // Xử lý nếu AI từ chối (dù đã set threshold)
        if (!response.candidates || response.candidates.length === 0) {
             throw new Error("AI response was blocked or empty.");
        }
        const text = response.text();
        return text.trim(); 

    } catch (err) {
        console.error(`[LỖI AI] Không thể tạo nhận xét: ${err.message}`);
        return null; // Trả về null nếu AI lỗi
    }
}

/**
 * Hàm chính của Worker: Tìm và Xử lý Job
 */
async function processQueue() {
    let client;
    try {
        client = await pool.connect();
        await client.query('BEGIN'); // Bắt đầu Transaction

        // 1. Tìm và KHÓA (LOCK) một job 'pending'
        const findJobQuery = {
            text: `
                SELECT id, property_id, payload
                FROM ai_generation_queue
                WHERE status = 'pending'
                ORDER BY created_at ASC
                LIMIT 1
                FOR UPDATE SKIP LOCKED; 
            `,
        };
        const jobRes = await client.query(findJobQuery);

        if (jobRes.rowCount === 0) {
            await client.query('COMMIT');
            return false; // Không có việc
        }

        const job = jobRes.rows[0];
        console.log(`[AI WORKER] Đang xử lý job ${job.id} (P_ID: ${job.property_id})...`);

        // 2. Đánh dấu 'processing'
        await client.query('UPDATE ai_generation_queue SET status = $1 WHERE id = $2', ['processing', job.id]);

        // 3. Gọi AI (Việc chậm)
        const { crimeScore, userScore, envScore } = job.payload;
        const aiSummary = await generateAISummary(crimeScore, userScore, envScore);

        if (!aiSummary) {
            // Nếu AI lỗi, đánh dấu 'failed' và rollback
            await client.query('UPDATE ai_generation_queue SET status = $1, processed_at = NOW() WHERE id = $2', ['failed', job.id]);
            await client.query('COMMIT');
            console.error(`[AI WORKER] Job ${job.id} thất bại do AI trả về null.`);
            return true; // Vẫn là "đã làm việc"
        }

        // 4. Cập nhật kết quả vào bảng chính (property_safety_scores)
        await client.query(
            'UPDATE property_safety_scores SET ai_summary = $1 WHERE property_id = $2',
            [aiSummary, job.property_id]
        );
        
        // 5. Đánh dấu 'done'
        await client.query('UPDATE ai_generation_queue SET status = $1, processed_at = NOW() WHERE id = $2', ['done', job.id]);
        
        await client.query('COMMIT'); // Hoàn tất Transaction
        console.log(`[AI WORKER] Đã hoàn thành job ${job.id}.`);
        return true; // Báo là đã xử lý 1 việc

    } catch (err) {
        if (client) await client.query('ROLLBACK'); // Hoàn tác nếu lỗi
        console.error('[AI WORKER LỖI]', err.message);
        // (Nếu lỗi nghiêm trọng, job sẽ vẫn là 'pending' và được thử lại sau)
        return false;
    } finally {
        if (client) client.release(); // Trả kết nối về Pool
    }
}

/**
 * Vòng lặp chính của Worker (Polling)
 */
async function startWorker() {
    console.log('[AI WORKER] Bắt đầu chạy...');
    while (true) {
        try {
            const didWork = await processQueue();
            if (!didWork) {
                // Nếu không có việc gì, nghỉ 5 giây
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        } catch (e) {
            // Lỗi ở vòng lặp, đợi 10 giây
            console.error("[AI WORKER LỖI VÒNG LẶP]", e);
            await new Promise(resolve => setTimeout(resolve, 10000));
        }
    }
}

startWorker();