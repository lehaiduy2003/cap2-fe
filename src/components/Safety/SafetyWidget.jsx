import { useEffect, useState } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { VAT_API_URL } from '../../constants';

export default function SafetyWidget({ propertyId }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    // State riêng cho nút AI
    const [aiLoading, setAiLoading] = useState(false);
    const [showAiContent, setShowAiContent] = useState(false);

    // 1. Lấy dữ liệu điểm số (Mặc định include_ai=false)
    useEffect(() => {
        if (!propertyId) return;
        const fetchSafetyScores = async () => {
            try {
                setLoading(true);
                const res = await axios.get(
                    `${VAT_API_URL}/api/v1/properties/${propertyId}/safety`,
                    {
                        params: { include_ai: false },
                    },
                );
                setData(res.data);
            } catch (err) {
                console.error('Lỗi lấy dữ liệu an toàn:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchSafetyScores();
    }, [propertyId]);

    // 2. Xử lý khi bấm nút phân tích AI
    const handleRequestAiAnalysis = async () => {
        try {
            setAiLoading(true);
            const res = await axios.get(
                `${VAT_API_URL}/api/v1/properties/${propertyId}/safety`,
                {
                    params: { include_ai: true },
                },
            );

            setData((prev) => ({
                ...prev,
                ai_summary: res.data.ai_summary,
            }));
            setShowAiContent(true);
        } catch (err) {
            console.error('Lỗi gọi AI:', err);
        } finally {
            setAiLoading(false);
        }
    };

    // Tính điểm tổng quan
    const calculateOverall = () => {
        if (!data) return 0;
        const c = parseFloat(data.crime_score) || 0;
        const e = parseFloat(data.environment_score) || 0;
        const u = parseFloat(data.user_score) || 0;
        return ((c + e + u) / 3).toFixed(1);
    };

    // Màu sắc theo điểm số
    const getScoreColor = (score) => {
        const s = parseFloat(score);
        if (s >= 8.0) return '#10b981'; // Green
        if (s >= 5.0) return '#f59e0b'; // Yellow
        return '#ef4444'; // Red
    };

    if (loading)
        return (
            <div className='bg-white p-8 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-center h-48 animate-pulse'>
                <div className='flex flex-col items-center gap-3'>
                    <div className='w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin'></div>
                    <span className='text-gray-400 text-sm font-medium'>
                        Đang tải dữ liệu...
                    </span>
                </div>
            </div>
        );

    if (!data) return null;

    const overallScore = calculateOverall();
    const overallColor = getScoreColor(overallScore);

    return (
        <div className='bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden font-sans transition-all hover:shadow-xl relative group'>
            {/* Header Decoration Line */}
            <div className='absolute top-0 left-0 w-full h-1.5 bg-linear-to-r from-blue-500 via-indigo-500 to-purple-600'></div>

            <div className='p-6 md:p-8'>
                {/* --- PHẦN 1: HEADER & OVERALL SCORE --- */}
                <div className='flex flex-col sm:flex-row items-center gap-8 mb-8'>
                    {/* Vòng tròn điểm lớn */}
                    <div className='relative shrink-0 group-hover:scale-105 transition-transform duration-500'>
                        <div
                            className='w-28 h-28 rounded-full border-[6px] flex flex-col items-center justify-center shadow-sm bg-white z-10 relative'
                            style={{ borderColor: `${overallColor}20` }}
                        >
                            <span
                                className='text-4xl font-extrabold tracking-tighter'
                                style={{ color: overallColor }}
                            >
                                {overallScore}
                            </span>
                            <span className='text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1'>
                                Overall
                            </span>
                        </div>
                        {/* Hiệu ứng mờ phía sau */}
                        <div
                            className='absolute inset-0 rounded-full opacity-20 blur-xl scale-90 z-0'
                            style={{ backgroundColor: overallColor }}
                        ></div>
                    </div>

                    {/* Text giới thiệu */}
                    <div className='text-center sm:text-left flex-1'>
                        <h3 className='text-xl font-bold text-gray-800 flex items-center justify-center sm:justify-start gap-2 mb-2'>
                            <i className='fas fa-shield-alt text-blue-600'></i>
                            An Toàn & Tiện Ích
                        </h3>
                        <p className='text-sm text-gray-500 leading-relaxed'>
                            Hệ thống tổng hợp dữ liệu từ cơ quan chức năng, cảm
                            biến môi trường và đánh giá thực tế từ cộng đồng cư
                            dân.
                        </p>
                    </div>
                </div>

                {/* --- PHẦN 2: 3 THẺ ĐIỂM CHI TIẾT (UI ĐẸP HƠN) --- */}
                <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-8'>
                    <ScoreCard
                        label='An ninh'
                        score={data.crime_score}
                        icon='fa-user-shield'
                        color='text-blue-600'
                        bg='bg-blue-50'
                        bar='bg-blue-500'
                    />
                    <ScoreCard
                        label='Môi trường'
                        score={data.environment_score}
                        icon='fa-tree'
                        color='text-green-600'
                        bg='bg-green-50'
                        bar='bg-green-500'
                    />
                    <ScoreCard
                        label='Cộng đồng'
                        score={data.user_score}
                        icon='fa-users'
                        color='text-purple-600'
                        bg='bg-purple-50'
                        bar='bg-purple-500'
                    />
                </div>

                {/* --- PHẦN 3: NÚT BẤM AI HOẶC NỘI DUNG AI --- */}
                <div className='border-t border-gray-100 pt-6'>
                    {!showAiContent ? (
                        <div className='text-center animate-fade-in'>
                            <button
                                onClick={handleRequestAiAnalysis}
                                disabled={aiLoading}
                                className={`
                                    relative inline-flex items-center justify-center px-8 py-3 text-sm font-bold text-white transition-all duration-300 
                                    bg-linear-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full shadow-md
                                    hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 hover:shadow-lg hover:-translate-y-0.5
                                    disabled:opacity-70 disabled:cursor-not-allowed
                                `}
                            >
                                {aiLoading ? (
                                    <>
                                        <i className='fas fa-circle-notch fa-spin mr-2'></i>
                                        Đang xử lý dữ liệu...
                                    </>
                                ) : (
                                    <>
                                        <i className='fas fa-magic mr-2'></i>
                                        Yêu cầu AI phân tích chi tiết
                                    </>
                                )}
                            </button>
                            <p className='text-xs text-gray-400 mt-3 italic'>
                                * Bấm để xem nhận định chuyên sâu về khu vực này
                            </p>
                        </div>
                    ) : (
                        <div className='bg-gray-50 rounded-xl p-5 border border-gray-200 relative animate-fade-in-up'>
                            <div className='flex items-center gap-2 mb-3'>
                                <span className='bg-linear-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm uppercase tracking-wider'>
                                    AI Insight
                                </span>
                                <span className='text-xs font-bold text-gray-500 uppercase'>
                                    Phân tích chi tiết
                                </span>
                            </div>

                            <div
                                className='text-gray-700 text-sm leading-7 text-justify overflow-y-auto pr-2 custom-scrollbar'
                                style={{ maxHeight: '250px' }}
                            >
                                <ReactMarkdown
                                    components={{
                                        strong: ({ ...props }) => (
                                            <span
                                                className='font-bold text-indigo-700'
                                                {...props}
                                            />
                                        ),
                                        p: ({ ...props }) => (
                                            <p
                                                className='mb-2 last:mb-0'
                                                {...props}
                                            />
                                        ),
                                        ul: ({ ...props }) => (
                                            <ul
                                                className='list-disc pl-4 mb-2 space-y-1'
                                                {...props}
                                            />
                                        ),
                                        li: ({ ...props }) => (
                                            <li className='pl-1' {...props} />
                                        ),
                                    }}
                                >
                                    {data.ai_summary ||
                                        'Không có dữ liệu phân tích.'}
                                </ReactMarkdown>
                            </div>

                            {/* Cảnh báo */}
                            {parseFloat(data.environment_score) < 5.0 && (
                                <div className='mt-4 flex gap-3 items-start bg-orange-50 p-3 rounded-lg border border-orange-100 text-orange-800 text-xs'>
                                    <i className='fas fa-exclamation-triangle mt-0.5 text-orange-600 text-base'></i>
                                    <span className='font-medium leading-relaxed'>
                                        Lưu ý: Chỉ số môi trường thấp. Khu vực
                                        có thể chịu ảnh hưởng bởi ngập lụt cục
                                        bộ hoặc tiếng ồn giờ cao điểm.
                                    </span>
                                </div>
                            )}

                            {/* Style Scrollbar & Animation */}
                            <style>{`
                                .custom-scrollbar::-webkit-scrollbar { width: 5px; }
                                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                                .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
                                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
                                @keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                                .animate-fade-in-up { animation: fadeInUp 0.4s ease-out; }
                            `}</style>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// --- COMPONENT THẺ ĐIỂM ĐẸP (CARD STYLE) ---
function ScoreCard({ label, score, icon, color, bg, bar }) {
    const s = score ? parseFloat(score) : 0;

    return (
        <div
            className={`${bg} p-4 rounded-2xl border border-transparent hover:border-gray-200 transition-all duration-300 group cursor-default`}
        >
            {/* Hàng 1: Icon & Điểm số */}
            <div className='flex justify-between items-center mb-3'>
                <div
                    className={`w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm ${color} group-hover:scale-110 transition-transform duration-300`}
                >
                    <i className={`fas ${icon} text-lg`}></i>
                </div>
                <span className={`text-2xl font-extrabold ${color}`}>
                    {s.toFixed(1)}
                </span>
            </div>

            {/* Hàng 2: Label & Progress Bar */}
            <div className='flex flex-col gap-2'>
                <span className='text-gray-600 text-[11px] font-bold uppercase tracking-wider opacity-80'>
                    {label}
                </span>
                <div className='w-full h-1.5 bg-white/70 rounded-full overflow-hidden shadow-inner'>
                    <div
                        className={`h-full rounded-full ${bar} transition-all duration-1000 ease-out`}
                        style={{ width: `${s * 10}%` }}
                    ></div>
                </div>
            </div>
        </div>
    );
}
