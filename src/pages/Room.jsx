import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import room1 from '../assets/room1.jpeg';
import room2 from '../assets/room2.jpeg';
import room3 from '../assets/room3.jpeg';
import '../styles/Room.css';
// Import Swiper styles
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation, Virtual } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import sink from '../assets/sink.png';
import bedrooms from '../assets/bedroom.png';
import split_1 from '../assets/split_0_0.png';
import split_2 from '../assets/split_0_1.png';
import split_3 from '../assets/split_0_2.png';
import dot from '../assets/360_F_320788475_nEiLVViOBewea7taZWqNUR0lJAMTAaSo.jpg';
import { getProvinces, getDistrictsByProvinceCode } from 'sub-vn';
import a1 from '../assets/13.jpg';
import a2 from '../assets/14.jpg';
import a3 from '../assets/15.jpg';
import a4 from '../assets/16.jpg';
import a5 from '../assets/17.jpg';
import a6 from '../assets/18.jpg';
import a7 from '../assets/19.jpg';
import a8 from '../assets/20.jpg';
import a9 from '../assets/21.jpg';
import a10 from '../assets/22.jpg';
import a11 from '../assets/23.jpg';
import a12 from '../assets/24.jpg';
import { BASE_API_URL } from '../constants';

<link
    rel='stylesheet'
    href='https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css'
/>;

const baseURL = `${BASE_API_URL}/images/`;

function Room() {
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [sortOrder, setSortOrder] = useState(null);
    const navigate = useNavigate();

    // Search and Filter states
    const [searchQuery, setSearchQuery] = useState('');
    const [appliedSearchQuery, setAppliedSearchQuery] = useState('');
    const [filters, setFilters] = useState({
        minPrice: '',
        maxPrice: '',
        minSize: '',
        maxSize: '',
        bedrooms: '',
        bathrooms: '',
        city: '',
        district: '',
        availableOnly: false,
    });
    const [appliedFilters, setAppliedFilters] = useState({
        minPrice: '',
        maxPrice: '',
        minSize: '',
        maxSize: '',
        city: '',
        district: '',
    });
    const [showFilterPanel, setShowFilterPanel] = useState(false);
    const slides = [
        { image: a1, alt: 'Phòng 1' },
        { image: a2, alt: 'Phòng 2' },
        { image: a3, alt: 'Phòng 3' },
        { image: a4, alt: 'Phòng 4' },
        { image: a5, alt: 'Phòng 5' },
        { image: a6, alt: 'Phòng 6' },
        { image: a7, alt: 'Phòng 7' },
        { image: a8, alt: 'Phòng 8' },
        { image: a9, alt: 'Phòng 9' },
        { image: a10, alt: 'Phòng 10' },
        { image: a11, alt: 'Phòng 11' },
        { image: a12, alt: 'Phòng 12' },
    ];
    const splitImages = [
        { image: split_1, alt: 'Split Image 1' },
        { image: split_2, alt: 'Split Image 2' },
        { image: split_3, alt: 'Split Image 3' },
    ];
    const [activeTab, setActiveTab] = useState('Tất Cả');
    const [selectedDistrict, setSelectedDistrict] = useState('');
    const [currentPage, setCurrentPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);

    const handleSearch = () => {
        setAppliedSearchQuery(searchQuery);
        setAppliedFilters(filters);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    const fetchRooms = async (page = 0) => {
        try {
            // Build query parameters
            const params = new URLSearchParams();

            params.append('page', page.toString());
            params.append('size', '10'); // Load 12 rooms per page

            if (appliedSearchQuery) {
                params.append('search', appliedSearchQuery);
            }

            // Build filter string for backend
            const filterConditions = [];
            if (appliedFilters.minPrice)
                filterConditions.push(`price:>${appliedFilters.minPrice}`);
            if (appliedFilters.maxPrice)
                filterConditions.push(`price:<${appliedFilters.maxPrice}`);
            if (appliedFilters.minSize)
                filterConditions.push(`size:>${appliedFilters.minSize}`);
            if (appliedFilters.maxSize)
                filterConditions.push(`size:<${appliedFilters.maxSize}`);
            if (appliedFilters.city)
                filterConditions.push(`city:${appliedFilters.city}`);
            if (appliedFilters.district)
                filterConditions.push(`district:${appliedFilters.district}`);
            if (filterConditions.length > 0) {
                params.append('filter', filterConditions.join(','));
            }

            const url = `${BASE_API_URL}/api/rooms${params.toString() ? '?' + params.toString() : ''}`;
            const response = await fetch(url);
            const data = await response.json();

            // Handle 404 or empty results
            if (!response.ok || !data.data) {
                if (page === 0) {
                    setRooms([]);
                    setLoading(false);
                }
                setHasMore(false);
                setError(null);
                return;
            }

            // Check if we have more rooms
            setHasMore(data.data.length === 10);

            // Fetch owner information for each room
            const roomsWithOwnerInfo = await Promise.all(
                data.data.map(async (room) => {
                    try {
                        const ownerResponse = await fetch(
                            `${BASE_API_URL}/owner/get-users/${room.ownerId}`,
                            {
                                headers: {
                                    Authorization: `Bearer ${localStorage.getItem('authToken')}`,
                                },
                            },
                        );

                        if (ownerResponse.ok) {
                            const ownerData = await ownerResponse.json();
                            const ownerInfo = ownerData.usersList?.[0];
                            if (ownerInfo) {
                                return {
                                    ...room,
                                    ownerName: ownerInfo.fullName,
                                    ownerPhone: ownerInfo.phone,
                                };
                            }
                        }
                    } catch (error) {
                        console.error('Error fetching owner info:', error);
                    }
                    return room;
                }),
            );

            if (page === 0) {
                setRooms(roomsWithOwnerInfo);
                setLoading(false);
            } else {
                setRooms((prev) => [...prev, ...roomsWithOwnerInfo]);
            }
            setError(null);
        } catch (err) {
            console.error('Error fetching rooms:', err);
            if (page === 0) {
                setRooms([]);
                setLoading(false);
            }
            setError(null);
        }
    };

    useEffect(() => {
        setCurrentPage(0);
        setHasMore(true);
        fetchRooms(0);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [appliedSearchQuery, appliedFilters]);

    useEffect(() => {
        if (currentPage > 0) {
            fetchRooms(currentPage);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPage]);

    const getValidImageUrl = (imageUrls) => {
        if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
            const defaultImages = [room1, room2, room3];
            const randomIndex = Math.floor(
                Math.random() * defaultImages.length,
            );
            return defaultImages[randomIndex];
        }
        return baseURL + imageUrls[0];
    };
    // loc theo thanh pho
    const filteredRooms = rooms.filter((room) => {
        const matchCity =
            activeTab === 'Tất Cả' ||
            room.city?.toLowerCase().includes(activeTab.toLowerCase());
        const matchDistrict =
            selectedDistrict === '' ||
            room.district
                ?.toLowerCase()
                .includes(selectedDistrict.toLowerCase());
        return matchCity && matchDistrict;
    });
    const sortedRooms = [...filteredRooms];
    if (sortOrder === 'asc') {
        sortedRooms.sort((a, b) => a.price - b.price);
    } else if (sortOrder === 'desc') {
        sortedRooms.sort((a, b) => b.price - a.price);
    }

    if (loading) {
        return (
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    minHeight: '400px',
                }}
            >
                <p style={{ fontSize: '18px', color: '#666' }}>
                    Đang tải phòng trọ...
                </p>
            </div>
        );
    }

    return (
        <div className='body'>
            <div
                className='map-button-container'
                style={{
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '15px',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        gap: '10px',
                        alignItems: 'center',
                    }}
                >
                    <div className='relative'>
                        <input
                            type='text'
                            className='border border-gray-300 rounded-lg py-2 pl-4 pr-10 w-80 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                            placeholder='Tìm kiếm phòng...'
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={handleKeyDown}
                        />
                        <button
                            onClick={handleSearch}
                            className='absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-blue-500 transition-colors duration-200'
                            style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                            }}
                        >
                            <i className='fas fa-search'></i>
                        </button>
                    </div>
                    <button
                        onClick={() => setShowFilterPanel(!showFilterPanel)}
                        className='bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-200'
                    >
                        <i className='fas fa-filter'></i>
                        Bộ lọc
                    </button>
                    <button
                        onClick={() =>
                            navigate('/map', { state: { rooms: sortedRooms } })
                        }
                        className='bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-200'
                    >
                        <i className='fas fa-map-marked-alt'></i>
                        Bản đồ
                    </button>
                </div>

                {/* Filter Panel */}
                {showFilterPanel && (
                    <div
                        style={{
                            background: 'white',
                            padding: '20px',
                            borderRadius: '10px',
                            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                            width: '90%',
                            maxWidth: '900px',
                        }}
                    >
                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns:
                                    'repeat(auto-fit, minmax(200px, 1fr))',
                                gap: '15px',
                            }}
                        >
                            <div>
                                <label
                                    style={{
                                        display: 'block',
                                        marginBottom: '5px',
                                        fontWeight: 'bold',
                                        fontSize: '14px',
                                    }}
                                >
                                    Giá tối thiểu (VND)
                                </label>
                                <input
                                    type='number'
                                    className='border border-gray-300 rounded-lg py-2 px-3 w-full focus:outline-none focus:ring-2 focus:ring-blue-500'
                                    placeholder='0'
                                    value={filters.minPrice}
                                    onChange={(e) =>
                                        setFilters({
                                            ...filters,
                                            minPrice: e.target.value,
                                        })
                                    }
                                />
                            </div>
                            <div>
                                <label
                                    style={{
                                        display: 'block',
                                        marginBottom: '5px',
                                        fontWeight: 'bold',
                                        fontSize: '14px',
                                    }}
                                >
                                    Giá tối đa (VND)
                                </label>
                                <input
                                    type='number'
                                    className='border border-gray-300 rounded-lg py-2 px-3 w-full focus:outline-none focus:ring-2 focus:ring-blue-500'
                                    placeholder='10000000'
                                    value={filters.maxPrice}
                                    onChange={(e) =>
                                        setFilters({
                                            ...filters,
                                            maxPrice: e.target.value,
                                        })
                                    }
                                />
                            </div>
                            <div>
                                <label
                                    style={{
                                        display: 'block',
                                        marginBottom: '5px',
                                        fontWeight: 'bold',
                                        fontSize: '14px',
                                    }}
                                >
                                    Diện tích tối thiểu (m²)
                                </label>
                                <input
                                    type='number'
                                    className='border border-gray-300 rounded-lg py-2 px-3 w-full focus:outline-none focus:ring-2 focus:ring-blue-500'
                                    placeholder='0'
                                    value={filters.minSize}
                                    onChange={(e) =>
                                        setFilters({
                                            ...filters,
                                            minSize: e.target.value,
                                        })
                                    }
                                />
                            </div>
                            <div>
                                <label
                                    style={{
                                        display: 'block',
                                        marginBottom: '5px',
                                        fontWeight: 'bold',
                                        fontSize: '14px',
                                    }}
                                >
                                    Diện tích tối đa (m²)
                                </label>
                                <input
                                    type='number'
                                    className='border border-gray-300 rounded-lg py-2 px-3 w-full focus:outline-none focus:ring-2 focus:ring-blue-500'
                                    placeholder='100'
                                    value={filters.maxSize}
                                    onChange={(e) =>
                                        setFilters({
                                            ...filters,
                                            maxSize: e.target.value,
                                        })
                                    }
                                />
                            </div>
                        </div>
                        <div
                            style={{
                                marginTop: '15px',
                                display: 'flex',
                                gap: '10px',
                                justifyContent: 'flex-end',
                            }}
                        >
                            <button
                                onClick={() => {
                                    const emptyFilters = {
                                        minPrice: '',
                                        maxPrice: '',
                                        minSize: '',
                                        maxSize: '',
                                        bedrooms: '',
                                        bathrooms: '',
                                        city: '',
                                        district: '',
                                        availableOnly: false,
                                    };
                                    setFilters(emptyFilters);
                                    setAppliedFilters(emptyFilters);
                                    setSearchQuery('');
                                    setAppliedSearchQuery('');
                                }}
                                className='bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-lg'
                            >
                                Xóa bộ lọc
                            </button>
                            <button
                                onClick={handleSearch}
                                className='bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg'
                            >
                                Áp dụng
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <div className='swiper-container1'>
                <Swiper
                    spaceBetween={30}
                    centeredSlides={true}
                    autoplay={{
                        delay: 2500,
                        disableOnInteraction: false,
                    }}
                    pagination={{
                        clickable: true,
                    }}
                    navigation={false}
                    modules={[Autoplay, Pagination, Navigation]}
                >
                    {slides.map((slide, index) => (
                        <SwiperSlide key={index} virtualIndex={index}>
                            <img
                                src={slide.image}
                                alt={slide.alt}
                                style={{ width: '100%', borderRadius: '10px' }}
                            />
                        </SwiperSlide>
                    ))}
                </Swiper>
            </div>

            <div className='swiper-container'>
                {/* <h3 ><img src={blueStar} alt="" className="img-living" />Chọn phòng theo phong cách của bạn  </h3>    */}
                <Swiper
                    modules={[Virtual]}
                    virtual
                    spaceBetween={30}
                    slidesPerView={3}
                    autoplay={{
                        delay: 2500,
                        disableOnInteraction: false,
                    }}
                >
                    {splitImages.map((slide, index) => (
                        <SwiperSlide key={index} virtualIndex={index}>
                            <img
                                className='splitImages'
                                src={slide.image}
                                alt={slide.alt}
                                style={{ width: '100%', borderRadius: '10px' }}
                            />
                        </SwiperSlide>
                    ))}
                </Swiper>
            </div>

            <div className='text_title'>
                <h3>Phòng đặc trưng </h3>{' '}
            </div>
            <div className='room-grid'>
                {sortedRooms.length === 0 ? (
                    <div
                        style={{
                            gridColumn: '1 / -1',
                            textAlign: 'center',
                            padding: '60px 20px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '20px',
                        }}
                    >
                        <i
                            className='fas fa-home'
                            style={{ fontSize: '64px', color: '#ccc' }}
                        ></i>
                        <h3
                            style={{
                                color: '#666',
                                fontSize: '24px',
                                margin: 0,
                            }}
                        >
                            Không tìm thấy phòng trọ
                        </h3>
                        <p
                            style={{
                                color: '#999',
                                fontSize: '16px',
                                margin: 0,
                            }}
                        >
                            Vui lòng thử lại với từ khóa hoặc bộ lọc khác
                        </p>
                        {(appliedSearchQuery ||
                            Object.values(appliedFilters).some((v) => v)) && (
                            <button
                                onClick={() => {
                                    const emptyFilters = {
                                        minPrice: '',
                                        maxPrice: '',
                                        minSize: '',
                                        maxSize: '',
                                        bedrooms: '',
                                        bathrooms: '',
                                        city: '',
                                        district: '',
                                        availableOnly: false,
                                    };
                                    setFilters(emptyFilters);
                                    setAppliedFilters(emptyFilters);
                                    setSearchQuery('');
                                    setAppliedSearchQuery('');
                                }}
                                className='bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded-lg'
                                style={{ marginTop: '10px' }}
                            >
                                Xóa bộ lọc và tìm kiếm
                            </button>
                        )}
                    </div>
                ) : (
                    <div className='flex flex-col items-center gap-4'>
                        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6'>
                            {sortedRooms.map((room) => (
                                <Link
                                    to={`/ResultRoom/${room.id}`}
                                    className='card-link'
                                    key={room.id}
                                >
                                    <div className='card'>
                                        <img
                                            src={getValidImageUrl(
                                                room.imageUrls,
                                            )}
                                            alt='Room'
                                            className='card-image_big'
                                            onError={(e) => {
                                                e.target.src = getValidImageUrl(
                                                    [],
                                                );
                                            }}
                                        />
                                        <div className='card-body'>
                                            <div className='card-top'>
                                                <h2>
                                                    {room.price?.toLocaleString() ??
                                                        'N/A'}{' '}
                                                    VND
                                                </h2>
                                                <div className='status-badge'>
                                                    Cho thuê
                                                </div>
                                            </div>
                                            <div className='text-sm text-slate-500 line-clamp-2'>
                                                <i className='fas fa-map-marker-alt pr-2'></i>
                                                <span>
                                                    {room.addressDetails ??
                                                        'Địa chỉ không có sẵn'}
                                                </span>
                                            </div>

                                            <div className='text-sm text-slate-500 line-clamp-2'>
                                                <span>Diện tích </span>
                                                <i className='fas fa-expand-arrows-alt'></i>
                                                <span>:</span>{' '}
                                                <span>
                                                    {room.roomSize
                                                        ? room.roomSize
                                                        : 'N/A'}
                                                </span>
                                                <span>m²</span>
                                            </div>
                                            <div className='card-footer'>
                                                <img
                                                    src={
                                                        room.imageUrls?.length >
                                                        1
                                                            ? baseURL +
                                                              room.imageUrls[1]
                                                            : getValidImageUrl(
                                                                  [],
                                                              )
                                                    }
                                                    alt='user'
                                                    onError={(e) => {
                                                        e.target.src =
                                                            getValidImageUrl(
                                                                [],
                                                            );
                                                    }}
                                                />
                                                <div className='contact-info'>
                                                    <div className='owner-name'>
                                                        {room.ownerName ||
                                                            'Chủ phòng'}
                                                    </div>
                                                    {/* <div className='owner-phone'>
                                                    {room.ownerPhone ||
                                                        'Chưa có số điện thoại'}
                                                </div> */}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                        {hasMore && (
                            <button
                                className='text-blue-500 border-2 rounded-2xl p-2'
                                onClick={() =>
                                    setCurrentPage((prev) => prev + 1)
                                }
                            >
                                Xem thêm ▼
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default Room;
