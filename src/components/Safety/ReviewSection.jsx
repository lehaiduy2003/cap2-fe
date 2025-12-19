import FloodHistoryList from './FloodHistoryList';

export default function ReviewSection({
    reviews,
    userReview,
    floodHistory,
    activeTab,
    setActiveTab,
    onWriteReview,
    onEditReview,
    // onDeleteReview, // Đã được sử dụng bên dưới
    onReportFlood,
    authUser,
}) {
    const getInitials = (name) => {
        if (!name) return '?';
        return name.trim().split(' ').length === 1
            ? name.charAt(0).toUpperCase()
            : (name.charAt(0) + name.split(' ').pop().charAt(0)).toUpperCase();
    };

    return (
        <section className='bg-white rounded-2xl shadow-sm border border-gray-200 p-6 animate-fade-in-up'>
            {/* Header Tabs */}
            <div className='flex border-b border-gray-200 mb-6'>
                <button
                    onClick={() => setActiveTab('reviews')}
                    className={`flex-1 py-3 text-center font-bold text-sm transition-all border-b-2 
                        ${activeTab === 'reviews' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                >
                    <i className='fas fa-star mr-2'></i> Đánh giá (
                    {reviews.length + (userReview ? 1 : 0)})
                </button>
                <button
                    onClick={() => setActiveTab('flood')}
                    className={`flex-1 py-3 text-center font-bold text-sm transition-all border-b-2 
                        ${activeTab === 'flood' ? 'border-red-500 text-red-500' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                >
                    <i className='fas fa-water mr-2'></i> Lịch sử ngập (
                    {floodHistory.length})
                </button>
            </div>

            {/* Content */}
            <div className='min-h-[200px]'>
                {activeTab === 'reviews' ? (
                    <div className='animate-fade-in'>
                        <div className='flex justify-between items-center mb-6'>
                            <h3 className='text-lg font-bold text-gray-800'>
                                Cảm nhận từ cư dân
                            </h3>

                            {!userReview && authUser?.id && (
                                <button
                                    onClick={onWriteReview}
                                    className='bg-blue-600 text-white px-5 py-2 rounded-xl font-bold text-sm hover:bg-blue-700 transition shadow-sm flex items-center gap-2'
                                >
                                    <i className='fas fa-pen'></i> Viết đánh giá
                                </button>
                            )}
                        </div>

                        {/* --- USER REVIEW (CỦA BẠN) --- */}
                        {userReview && (
                            <div className='bg-blue-50 p-5 rounded-xl border border-blue-100 mb-6 relative group'>
                                <div className='absolute top-4 right-4 flex gap-2'>
                                    <span className='bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded'>
                                        Của bạn
                                    </span>

                                    <button
                                        onClick={() => onEditReview(userReview)}
                                        className='bg-white hover:bg-blue-200 text-blue-600 p-1.5 rounded-md text-xs transition shadow-sm border border-blue-200'
                                        title='Chỉnh sửa'
                                    >
                                        <i className='fas fa-edit'></i>
                                    </button>
                                    {/* <button
                                        onClick={onDeleteReview}
                                        className='bg-white hover:bg-red-200 text-red-500 p-1.5 rounded-md text-xs transition shadow-sm border border-red-200'
                                        title='Xóa đánh giá'
                                    >
                                        <i className='fas fa-trash'></i>
                                    </button> */}
                                </div>

                                <div className='flex items-center gap-3 mb-4'>
                                    <div className='w-10 h-10 rounded-full bg-blue-200 flex items-center justify-center font-bold text-blue-700'>
                                        {getInitials(userReview.reviewer_name)}
                                    </div>
                                    <div>
                                        <div className='font-bold text-blue-900'>
                                            {userReview.reviewer_name}
                                        </div>
                                        <div className='text-xs text-blue-400'>
                                            {new Date(
                                                userReview.created_at,
                                            ).toLocaleDateString('vi-VN')}
                                        </div>
                                    </div>
                                </div>

                                <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 bg-white/60 p-3 rounded-lg'>
                                    {[
                                        {
                                            l: 'Hàng xóm',
                                            s: userReview.safety_rating,
                                        },
                                        {
                                            l: 'Sạch sẽ',
                                            s: userReview.cleanliness_rating,
                                        },
                                        {
                                            l: 'Tiện nghi',
                                            s: userReview.amenities_rating,
                                        },
                                        {
                                            l: 'Chủ nhà',
                                            s: userReview.host_rating,
                                        },
                                    ].map((item, idx) => (
                                        <div
                                            key={idx}
                                            className='flex flex-col'
                                        >
                                            <span className='text-xs text-gray-500'>
                                                {item.l}
                                            </span>
                                            <span className='text-yellow-500 font-bold'>
                                                {'★'.repeat(item.s)}
                                                <span className='text-gray-300'>
                                                    {'★'.repeat(5 - item.s)}
                                                </span>
                                            </span>
                                        </div>
                                    ))}
                                </div>
                                {/* Đã sửa lỗi quotes ở dòng dưới */}
                                <p className='text-gray-700 text-sm leading-relaxed italic'>
                                    &quot;{userReview.review_text}&quot;
                                </p>
                            </div>
                        )}

                        {/* --- DANH SÁCH REVIEW KHÁC --- */}
                        <div className='space-y-4'>
                            {reviews.length === 0 && !userReview ? (
                                <div className='text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-300'>
                                    <i className='far fa-comment-dots text-4xl text-gray-300 mb-3'></i>
                                    <p className='text-gray-500 italic'>
                                        Chưa có đánh giá nào. Hãy là người đầu
                                        tiên!
                                    </p>
                                </div>
                            ) : (
                                reviews.map((rev, idx) => (
                                    <div
                                        key={idx}
                                        className='border-b border-gray-100 pb-6 last:border-0 hover:bg-gray-50 p-3 rounded-xl transition-colors'
                                    >
                                        <div className='flex justify-between items-start mb-2'>
                                            <div className='flex items-center gap-3'>
                                                <div className='w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-500 text-sm'>
                                                    {getInitials(
                                                        rev.reviewer_name,
                                                    )}
                                                </div>
                                                <div>
                                                    <div className='font-bold text-gray-800'>
                                                        {rev.reviewer_name}
                                                    </div>
                                                    <div className='text-xs text-gray-400'>
                                                        {new Date(
                                                            rev.created_at,
                                                        ).toLocaleDateString(
                                                            'vi-VN',
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className='flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded text-yellow-600 font-bold text-sm'>
                                                <span>
                                                    {(
                                                        (rev.safety_rating +
                                                            rev.cleanliness_rating +
                                                            rev.amenities_rating +
                                                            rev.host_rating) /
                                                        4
                                                    ).toFixed(1)}
                                                </span>
                                                <i className='fas fa-star text-xs'></i>
                                            </div>
                                        </div>
                                        <p className='text-gray-600 text-sm mt-2 pl-12 leading-relaxed'>
                                            {rev.review_text}
                                        </p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                ) : (
                    <div className='animate-fade-in'>
                        <FloodHistoryList
                            reports={floodHistory}
                            onReportClick={onReportFlood}
                        />
                    </div>
                )}
            </div>
        </section>
    );
}
