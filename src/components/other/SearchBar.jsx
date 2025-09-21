import { useState } from 'react';
import axios from 'axios';
import { BASE_API_URL } from '../../constants';

const SearchBar = ({ onUserSelect }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [error, setError] = useState(null);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchTerm.trim()) {
            setError('Vui lòng nhập tên người dùng');
            return;
        }

        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                setError('Không tìm thấy mã xác thực');
                return;
            }

            const response = await axios.get(
                `${BASE_API_URL}/messages/search?username=${encodeURIComponent(searchTerm)}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: 'application/json',
                        'Content-Type': 'application/json',
                    },
                },
            );

            // BE trả về danh sách người dùng
            setSearchResults(response.data || []);
            setError(null);
        } catch (error) {
            console.error('Lỗi khi tìm kiếm người dùng:', error);
            if (error.response?.status === 404) {
                setSearchResults([]);
                setError('Không tìm thấy người dùng');
            } else {
                setError('Đã xảy ra lỗi khi tìm kiếm');
                setSearchResults([]);
            }
        }
    };

    return (
        <div className='w-[300px]'>
            <form onSubmit={handleSearch} className='mb-4'>
                <div className='relative'>
                    <input
                        type='text'
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder='Tìm kiếm người dùng...'
                        className='w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                    />
                    <button
                        type='submit'
                        className='absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700'
                    >
                        <svg
                            xmlns='http://www.w3.org/2000/svg'
                            className='h-5 w-5'
                            fill='none'
                            viewBox='0 0 24 24'
                            stroke='currentColor'
                        >
                            <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth={2}
                                d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
                            />
                        </svg>
                    </button>
                </div>
            </form>

            {error && <div className='text-red-500 text-sm mb-2'>{error}</div>}

            {searchResults.length === 0 && !error && searchTerm && (
                <div className='text-gray-500 text-sm mb-2'>
                    Không tìm thấy người dùng
                </div>
            )}

            {searchResults.length > 0 && (
                <div className='bg-white rounded-lg shadow-lg p-2'>
                    {searchResults.map((user) => (
                        <div
                            key={user.id}
                            onClick={() => onUserSelect(user)}
                            className='flex items-center p-2 hover:bg-gray-100 rounded-lg cursor-pointer'
                        >
                            <div className='w-10 h-10 rounded-full overflow-hidden mr-3'>
                                <img
                                    src={
                                        user.avatarUrl ||
                                        'https://randomuser.me/api/portraits/lego/1.jpg'
                                    }
                                    alt={user.fullName}
                                    className='w-full h-full object-cover'
                                />
                            </div>
                            <div>
                                <div className='font-medium'>
                                    {user.fullName}
                                </div>
                                <div className='text-sm text-gray-600'>
                                    {user.email}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SearchBar;
