// src/components/Safety/FloodHistoryList.jsx

export default function FloodHistoryList({ reports, onReportClick }) {
    if (!reports || reports.length === 0) {
        return (
            <div className='text-center py-6 bg-gray-50 rounded-xl border-dashed border-2 border-gray-200'>
                <p className='text-gray-500 mb-2'>Chưa có ghi nhận ngập lụt.</p>
                <button
                    onClick={onReportClick}
                    className='text-blue-600 font-bold hover:underline'
                >
                    Báo cáo ngay
                </button>
            </div>
        );
    }
    return (
        <div>
            <div className='flex justify-between items-center mb-4'>
                <span className='text-sm text-gray-500'>
                    Hiển thị {reports.length} báo cáo gần đây
                </span>
                <button
                    onClick={onReportClick}
                    className='text-red-500 font-bold text-sm border border-red-200 px-3 py-1 rounded hover:bg-red-50'
                >
                    + Báo ngập mới
                </button>
            </div>
            <div className='space-y-3 max-h-80 overflow-y-auto'>
                {reports.map((item) => (
                    <div
                        key={item.id}
                        className='bg-white p-3 rounded-lg border border-gray-100 shadow-sm flex gap-3'
                    >
                        <div
                            className={`w-12 h-12 flex items-center justify-center rounded font-bold text-white shrink-0 ${item.water_level > 40 ? 'bg-red-500' : 'bg-blue-400'}`}
                        >
                            {item.water_level}cm
                        </div>
                        <div>
                            <div className='text-xs text-gray-400'>
                                {new Date(item.report_date).toLocaleDateString(
                                    'vi-VN',
                                )}
                            </div>
                            <p className='text-sm text-gray-700'>
                                {item.description}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
