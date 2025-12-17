import { Route, Routes, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import './App.css';

// Components
import Navbar from './components/Navbar';
import Navbarchatbox from './components/Navbarchatbox';
import Footer from './components/Footer';

// Pages
import Home from './pages/Home';
import About from './pages/About';
import Room from './pages/Room';
import ResultRoom from './pages/Result_Room';
import Login from './pages/Login';
import Register from './pages/Register';
import Chatbox from './pages/Chatbox';
import SettingsPage from './pages/SettingsPage';
import Map from './pages/Map';
import Dashboard from './pages/Dashboard';
import ReportPage from './components/Dashboard/ReportPage';
import LocationSearch from './pages/LocationSearch';
import ProfileLayout from './pages/ProfileLayout';
import ChatPage from './pages/ChatPageNew';

// Invoice & Roommate Components
import Storage from './components/Invoices/Storage';
import InvoiceForm from './components/Invoices/InvoiceForm';
import RoommateForm from './components/RoommateForm/RoommateForm';
import MatchDetails from './components/RoommateForm/MatchDetails ';

// Store
import { useThemeStore } from './store/useThemeStore';

const App = () => {
    const { theme } = useThemeStore();
    const location = useLocation();

    // Các route hiển thị Navbar dành cho Chatbox
    const showNavbarchatbox = ['/chatbox', '/settings'].includes(
        location.pathname,
    );

    // Các route KHÔNG hiển thị Footer
    const hideFooter = [
        '/map',
        '/chatbox',
        '/test1',
        '/dashboard',
        '/dashboard/invoices',
        '/dashboard/report',
        '/dashboard/bookings',
        '/dashboard/requests',
    ].includes(location.pathname);

    // Các route KHÔNG hiển thị bất kỳ Navbar nào (Dashboard, Invoice...)
    const hideNavbarAndNavbarchatbox = [
        '/dashboard', // Thêm dashboard root
        '/dashboard/invoices',
        '/dashboard/report',
        '/dashboard/bookings',
        '/dashboard/requests',
    ].some((path) => location.pathname.startsWith(path)); // Dùng startsWith để bắt các con của dashboard tốt hơn

    return (
        <div data-theme={theme}>
            {/* --- NAVIGATIONS --- */}
            {!hideNavbarAndNavbarchatbox &&
                (showNavbarchatbox ? <Navbarchatbox /> : <Navbar />)}

            {/* --- MAIN ROUTES --- */}
            <Routes>
                <Route path='/' element={<Home />} />
                <Route path='/about' element={<About />} />
                <Route path='/room' element={<Room />} />
                <Route path='/ResultRoom/:id' element={<ResultRoom />} />
                <Route path='/login' element={<Login />} />
                <Route path='/register' element={<Register />} />
                <Route path='/chatbox' element={<Chatbox />} />
                <Route path='/settings' element={<SettingsPage />} />
                <Route path='/map' element={<Map />} />

                {/* Invoice & Roommate Routes */}
                <Route path='/invoices' element={<Storage />} />
                <Route path='/test1' element={<InvoiceForm />} />
                <Route path='/roommates' element={<RoommateForm />} />
                <Route path='/match' element={<MatchDetails />} />

                {/* Dashboard & Profile */}
                <Route path='/dashboard/*' element={<Dashboard />} />
                <Route path='/q' element={<ReportPage />} />
                <Route path='/profile' element={<ProfileLayout />} />
                <Route path='/rent-history' element={<ProfileLayout />} />
                <Route path='/id-verification' element={<ProfileLayout />} />

                {/* New Features */}
                <Route path='/chat' element={<ChatPage />} />
                <Route path='/location' element={<LocationSearch />} />
            </Routes>

            {/* --- FOOTER --- */}
            {!hideFooter && <Footer />}

            {/* --- GLOBAL NOTIFICATIONS --- */}
            {/* React-Toastify: Dùng cho các tính năng mới (Báo cáo ngập, Safety) */}
            <ToastContainer
                position='top-right'
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop={true}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme={theme === 'dark' ? 'dark' : 'light'}
            />

            {/* React-Hot-Toast: Giữ lại nếu code cũ đang dùng */}
            <Toaster />
        </div>
    );
};

export default App;
