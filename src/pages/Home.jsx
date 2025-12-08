// Import Swiper React components
import { Link } from 'react-router-dom';

import '../styles/Home.css';
import Room from '../assets/minimal.jpg';
import Room2 from '../assets/minimal2.jpg';
import Room3 from '../assets/openly.jpg';
import Room4 from '../assets/room4.jpeg';
import home_icon from '../assets/house.png';
// Import Swiper styles
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
// fontawesome icon import not used
import videoSrc from '../assets/4k_building.mp4'; // Import video file
export default function App() {
    return (
        <div className='home-containercontainer'>
            <div className='video-banner'>
                <video autoPlay muted loop className='video-background_home'>
                    <source src={videoSrc} type='video/mp4' />
                    Trình duyệt của bạn không hỗ trợ video.
                </video>
                <div className='video-content'>
                    <h1>Chào mừng bạn đến với SafeNestly</h1>
                    <p>Nơi tìm kiếm phòng trọ lý tưởng dành cho bạn</p>
                </div>
            </div>
            <div className='home'>
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
                    <SwiperSlide>
                        <img src={Room} alt='' />
                    </SwiperSlide>
                    <SwiperSlide>
                        <img src={Room2} alt='' />
                    </SwiperSlide>
                    <SwiperSlide>
                        <img src={Room3} alt='' />
                    </SwiperSlide>
                    <SwiperSlide>
                        <img src={Room4} alt='' />
                    </SwiperSlide>
                </Swiper>
                <div className='home-content flex flex-col'>
                    <h1>
                        Chia sẻ{' '}
                        <span className='highlight'>
                            <img src={home_icon} alt='' />
                        </span>{' '}
                        và cả sự <span className='highlight'>ngạc nhiên </span>,
                        mỗi lần gặp được người bạn mới
                    </h1>
                    <Link to='/Room' className='mx-auto pt-3'>
                        <button className='home-arrow'>Khám phá ngay</button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
