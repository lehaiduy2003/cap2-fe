import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { VAT_API_URL } from '../../constants';

export default function FloodReportModal({ isOpen, onClose, defaultLocation }) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        latitude: '',
        longitude: '',
        waterLevel: '',
        description: '',
    });

    useEffect(() => {
        if (isOpen && defaultLocation?.lat && defaultLocation?.lng) {
            setFormData((prev) => ({
                ...prev,
                latitude: defaultLocation.lat,
                longitude: defaultLocation.lng,
            }));
        }
    }, [isOpen, defaultLocation]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            await axios.post(
                `${VAT_API_URL}/api/v1/flood-reports`,
                {
                    latitude: formData.latitude,
                    longitude: formData.longitude,
                    water_level: parseInt(formData.waterLevel),
                    description: formData.description,
                },
                {
                    headers: {
                        'x-user-id':
                            localStorage.getItem('userId') || 'anonymous',
                    },
                },
            );

            toast.success('Báo cáo thành công!');
            setFormData((prev) => ({
                ...prev,
                waterLevel: '',
                description: '',
            }));
            onClose();
        } catch (error) {
            console.error(error);
            toast.error('Gửi báo cáo thất bại.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        // Fix: z-[9999] -> z-9999 (Theo yêu cầu)
        <div className='fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-9999 p-4 animate-fade-in'>
            <div className='bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden transform scale-100 transition-all'>
                <div className='bg-blue-600 p-4 text-white flex justify-between items-center'>
                    <h2 className='text-lg font-bold flex items-center gap-2'>
                        <i className='fas fa-water'></i> Báo Cáo Điểm Ngập
                    </h2>
                    <button
                        onClick={onClose}
                        className='hover:text-gray-200 transition-colors'
                    >
                        <i className='fas fa-times text-xl'></i>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className='p-6 space-y-4'>
                    <div className='bg-blue-50 p-3 rounded-lg border border-blue-100 text-sm text-blue-800'>
                        <i className='fas fa-map-pin mr-2'></i>
                        Vị trí:{' '}
                        <strong>
                            {defaultLocation?.address || 'Tọa độ phòng trọ'}
                        </strong>
                    </div>

                    <div>
                        <label className='block text-sm font-bold text-gray-700 mb-1'>
                            Mức độ ngập (cm)
                        </label>
                        <input
                            type='number'
                            required
                            min='1'
                            max='200'
                            className='w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none'
                            placeholder='VD: 30'
                            value={formData.waterLevel}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    waterLevel: e.target.value,
                                })
                            }
                        />
                    </div>

                    <div>
                        <label className='block text-sm font-bold text-gray-700 mb-1'>
                            Mô tả chi tiết
                        </label>
                        <textarea
                            className='w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none resize-none'
                            rows='3'
                            placeholder='Nước ngập đến đâu? Bao lâu thì rút?...'
                            value={formData.description}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    description: e.target.value,
                                })
                            }
                        ></textarea>
                    </div>

                    <button
                        type='submit'
                        disabled={loading}
                        className='w-full py-3 rounded-xl text-white font-bold bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg transition-all'
                    >
                        {loading ? (
                            <i className='fas fa-spinner fa-spin'></i>
                        ) : (
                            'Gửi Báo Cáo'
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
