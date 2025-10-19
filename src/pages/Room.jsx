import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import room1 from '../assets/room1.jpeg';
import room2 from '../assets/room2.jpeg';
import room3 from '../assets/room3.jpeg';
import SearchBar from '../components/SearchBar';
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
    const [expandedCardIds, setExpandedCardIds] = useState({});
    const [showAllRooms, setShowAllRooms] = useState(false);

    const handleSortChange = (order) => {
        setSortOrder(order);
    };
    const [showDistricts, setShowDistricts] = useState(false);
    const [districts, setDistricts] = useState([]);
    const handleShowDistricts = () => {
        const danang = getProvinces().find((p) => p.name.includes('Đà Nẵng'));
        if (danang) {
            const danangDistricts = getDistrictsByProvinceCode(danang.code);
            setDistricts(danangDistricts);
            setShowDistricts(!showDistricts);
        }
    };

    const fetchRooms = async () => {
        try {
            const response = await fetch(`${BASE_API_URL}/api/rooms`);
            if (!response.ok) throw new Error('Network error');
            const data = await response.json();

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

            setRooms(roomsWithOwnerInfo);
            setLoading(false);
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRooms();
    }, []);

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
    const tabs = ['Tất Cả', 'Đà Nẵng', 'Thành phố Hồ Chí Minh', 'Hà Nội'];
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

    if (loading) return <p>Đang tải phòng trọ...</p>;
    if (error) return <p>Lỗi: {error}</p>;

    return (
        <div className='body'>
            <SearchBar onSortChange={handleSortChange} />

            <div
                className='map-button-container'
                style={{
                    padding: '20px',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                }}
            >
                <div className='relative mr-2 mb-2'>
                    <input
                        type='text'
                        className='border border-gray-300 rounded-lg py-2 pl-4 pr-10 w-80 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                        placeholder='Tìm kiếm phòng...'
                    />
                    <button
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
                    onClick={() =>
                        navigate('/map', { state: { rooms: sortedRooms } })
                    }
                    className='bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-200'
                    style={{ marginBottom: '10px' }}
                >
                    <i className='fas fa-map-marked-alt'></i>
                </button>
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
            <div className='button-group_city'>
                {tabs.map((tab) => (
                    <div
                        key={tab}
                        className={`button-tab_city ${activeTab === tab ? 'active' : ''}`}
                        onClick={() => {
                            setActiveTab(tab);
                            if (tab === 'Tất Cả') {
                                setSelectedDistrict(''); //Xoá bộ lọc quận khi chọn Tất Cả
                            }
                        }}
                        style={{ cursor: 'pointer' }}
                    >
                        {tab}
                    </div>
                ))}
                <div className='district_find ' onClick={handleShowDistricts}>
                    <img src={dot} alt='' />
                </div>
                {showDistricts && (
                    <div
                        style={{
                            marginTop: '10px',
                            padding: '10px',
                            background: '#f9f9f9',
                            border: '1px solid #ccc',
                            borderRadius: '8px',
                            maxWidth: '300px',
                        }}
                    >
                        <label
                            style={{
                                fontWeight: 'bold',
                                marginBottom: '5px',
                                display: 'block',
                            }}
                        >
                            Chọn quận tại Đà Nẵng:
                        </label>
                        <select
                            value={selectedDistrict}
                            onChange={(e) =>
                                setSelectedDistrict(e.target.value)
                            }
                            style={{
                                width: '100%',
                                padding: '10px',
                                borderRadius: '6px',
                                border: '1px solid #ccc',
                                fontSize: '14px',
                            }}
                        >
                            <option value=''>-- Chọn quận --</option>
                            {districts.map((district) => (
                                <option
                                    key={district.code}
                                    value={district.name}
                                >
                                    {district.name}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
            </div>
            <div className='text_title'>
                <h3>Phòng đặc trưng </h3>{' '}
            </div>
            <div className='room-grid'>
                {sortedRooms.length === 0 ? (
                    <p>Không tìm thấy phòng trọ.</p>
                ) : (
                    <>
                        {(showAllRooms
                            ? sortedRooms
                            : sortedRooms.slice(0, 12)
                        ).map((room) => (
                            <Link
                                to={`/ResultRoom/${room.id}`}
                                className='card-link'
                                key={room.id}
                            >
                                <div className='card'>
                                    <img
                                        src={getValidImageUrl(room.imageUrls)}
                                        alt='Room'
                                        className='card-image_big'
                                        onError={(e) => {
                                            e.target.src = getValidImageUrl([]);
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
                                        <div className='card-address'>
                                            <i className='fas fa-map-marker-alt'></i>
                                            <span>{room.city}</span>{' '}
                                            <span>{room.district}</span>
                                            <span>
                                                {room.addressDetails ??
                                                    'Địa chỉ không có sẵn'}
                                            </span>
                                        </div>
                                        <div className='card-features'>
                                            {(() => {
                                                const features = [
                                                    {
                                                        icon: (
                                                            <i className='fas fa-expand-arrows-alt'></i>
                                                        ),
                                                        label: `${room.roomSize} m²`,
                                                    },
                                                    {
                                                        icon: (
                                                            <img
                                                                src={bedrooms}
                                                                alt=''
                                                            />
                                                        ),
                                                        label: `${room.numBedrooms ?? '?'} Giường`,
                                                    },
                                                    {
                                                        icon: (
                                                            <img
                                                                src={sink}
                                                                alt=''
                                                            />
                                                        ),
                                                        label: `${room.numBathrooms ?? '?'} Bồn tắm`,
                                                    },
                                                ];
                                                const isExpanded =
                                                    expandedCardIds[room.id];
                                                const showFeatures = isExpanded
                                                    ? features
                                                    : features.slice(0, 3);
                                                return (
                                                    <>
                                                        {showFeatures.map(
                                                            (feature, idx) => (
                                                                <div
                                                                    className='card-feature-item'
                                                                    key={idx}
                                                                >
                                                                    {
                                                                        feature.icon
                                                                    }
                                                                    <span>
                                                                        {
                                                                            feature.label
                                                                        }
                                                                    </span>
                                                                </div>
                                                            ),
                                                        )}
                                                        {features.length >
                                                            3 && (
                                                            <button
                                                                className='more-btn'
                                                                onClick={(
                                                                    e,
                                                                ) => {
                                                                    e.preventDefault();
                                                                    setExpandedCardIds(
                                                                        (
                                                                            prev,
                                                                        ) => ({
                                                                            ...prev,
                                                                            [room.id]:
                                                                                !prev[
                                                                                    room
                                                                                        .id
                                                                                ],
                                                                        }),
                                                                    );
                                                                }}
                                                                style={{
                                                                    background:
                                                                        'none',
                                                                    border: 'none',
                                                                    cursor: 'pointer',
                                                                    marginLeft: 8,
                                                                    color: '#1976d2',
                                                                    fontWeight: 600,
                                                                }}
                                                            >
                                                                {isExpanded ? (
                                                                    <span>
                                                                        &#9650;
                                                                        Thu gọn
                                                                    </span>
                                                                ) : (
                                                                    <span>
                                                                        &#9660;
                                                                        Xem thêm
                                                                    </span>
                                                                )}
                                                            </button>
                                                        )}
                                                    </>
                                                );
                                            })()}
                                        </div>
                                        <div className='card-footer'>
                                            <img
                                                src={
                                                    room.imageUrls?.length > 1
                                                        ? baseURL +
                                                          room.imageUrls[1]
                                                        : getValidImageUrl([])
                                                }
                                                alt='user'
                                                onError={(e) => {
                                                    e.target.src =
                                                        getValidImageUrl([]);
                                                }}
                                            />
                                            <div className='contact-info'>
                                                <div className='owner-name'>
                                                    {room.ownerName ||
                                                        'Chủ phòng'}
                                                </div>
                                                <div className='owner-phone'>
                                                    {room.ownerPhone ||
                                                        'Chưa có số điện thoại'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                        {sortedRooms.length > 12 && (
                            <div
                                style={{
                                    width: '100%',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    marginTop: 16,
                                }}
                            >
                                <button
                                    className='more-btn'
                                    onClick={() =>
                                        setShowAllRooms((prev) => !prev)
                                    }
                                    style={{
                                        background: 'none',
                                        border: '1px solid #1976d2',
                                        borderRadius: 8,
                                        color: '#1976d2',
                                        fontWeight: 600,
                                        fontSize: '1rem',
                                        padding: '8px 24px',
                                        cursor: 'pointer',
                                    }}
                                >
                                    {showAllRooms ? 'Thu gọn ▲' : 'Xem thêm ▼'}
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

export default Room;
