import { useEffect, useState } from 'react';
import { BASE_API_URL } from '../constants';

const Profile = () => {
    const [profile, setProfile] = useState(null);
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        gender: '',
        bio: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchProfile = async () => {
            const token = localStorage.getItem('authToken');
            if (!token) {
                console.error('Không có token');
                return;
            }

            try {
                const response = await fetch(
                    `${BASE_API_URL}/renterowner/get-profile`,
                    {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${token}`,
                        },
                    },
                );

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const result = await response.json();
                console.log('Profile fetched:', result);
                setProfile(result);
                setFormData({
                    fullName: result.fullName || '',
                    email: result.email || '',
                    phone: result.phone || '',
                    gender: result.gender || '',
                    bio: result.bio || '',
                });
            } catch (error) {
                console.error('Không lấy được profile:', error);
                setError('Không thể tải hồ sơ');
            }
        };

        fetchProfile();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const token = localStorage.getItem('authToken');
        if (!token) {
            setError('Không có token');
            setLoading(false);
            return;
        }

        try {
            const response = await fetch(
                `${BASE_API_URL}/renterowner/update-profile`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(formData),
                },
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            setProfile(result);
            alert('Cập nhật hồ sơ thành công!');
        } catch (error) {
            console.error('Không cập nhật được profile:', error);
            setError('Không thể cập nhật hồ sơ');
        } finally {
            setLoading(false);
        }
    };

    const getInitials = (name) => {
        if (!name) return 'U';
        return name
            .split(' ')
            .map((word) => word.charAt(0))
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <div className='p-6'>
            <div className='flex items-center space-x-4 mb-6'>
                <div className='w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl'>
                    {profile ? getInitials(profile.fullName) : 'U'}
                </div>
                <h2 className='text-xl font-semibold text-gray-800'>
                    Thông tin cá nhân
                </h2>
            </div>

            {error && (
                <div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6'>
                    {error}
                </div>
            )}

            {profile ? (
                <form onSubmit={handleSubmit} className='space-y-6'>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                        <div>
                            <label className='block text-sm font-medium text-gray-700 mb-2'>
                                Tên đầy đủ
                            </label>
                            <input
                                type='text'
                                name='fullName'
                                value={formData.fullName}
                                onChange={handleInputChange}
                                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                                required
                            />
                        </div>

                        <div>
                            <label className='block text-sm font-medium text-gray-700 mb-2'>
                                Email
                            </label>
                            <input
                                type='email'
                                name='email'
                                value={formData.email}
                                onChange={handleInputChange}
                                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                                required
                            />
                        </div>

                        <div>
                            <label className='block text-sm font-medium text-gray-700 mb-2'>
                                Số điện thoại
                            </label>
                            <input
                                type='tel'
                                name='phone'
                                value={formData.phone}
                                onChange={handleInputChange}
                                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                            />
                        </div>

                        <div>
                            <label className='block text-sm font-medium text-gray-700 mb-2'>
                                Giới tính
                            </label>
                            <select
                                name='gender'
                                value={formData.gender}
                                onChange={handleInputChange}
                                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                            >
                                <option value=''>Chọn giới tính</option>
                                <option value='MALE'>Nam</option>
                                <option value='FEMALE'>Nữ</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>
                            Bio
                        </label>
                        <textarea
                            name='bio'
                            value={formData.bio}
                            onChange={handleInputChange}
                            rows={4}
                            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical'
                            placeholder='Hãy viết gì đó về bạn...'
                        />
                    </div>

                    <div className='flex space-x-4 pt-4'>
                        <button
                            type='submit'
                            disabled={loading}
                            className='bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-md transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed'
                        >
                            {loading ? 'Đang cập nhật...' : 'Cập Nhật'}
                        </button>
                        <button
                            type='button'
                            onClick={() =>
                                setFormData({
                                    fullName: profile.fullName || '',
                                    email: profile.email || '',
                                    phone: profile.phone || '',
                                    gender: profile.gender || '',
                                    bio: profile.bio || '',
                                })
                            }
                            className='bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-2 px-6 rounded-md transition duration-200'
                        >
                            Hủy
                        </button>
                    </div>
                </form>
            ) : (
                <div className='text-center py-8'>
                    <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto'></div>
                    <p className='text-gray-600 mt-4'>Đang tải hồ sơ...</p>
                </div>
            )}
        </div>
    );
};

export default Profile;
