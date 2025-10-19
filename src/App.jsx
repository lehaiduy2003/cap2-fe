import Navbarchatbox from './components/Navbarchatbox';
import SettingsPage from './pages/SettingsPage';
import Chatbox from './pages/Chatbox';
import Login from './pages/Login';
import Home from './pages/Home';
import ChatPage2 from './pages/ChatPage2';

// import SearchBar from "./components/SearchBar";
import Footer from './components/Footer';
import Room from './pages/Room';
import About from './pages/About';
import ResultRoom from './pages/Result_Room';
import './App.css';
import { Route, Routes, useLocation } from 'react-router-dom'; // ❌ Không import Router
import { useAuthStore } from './store/useAuthStore';
import { useThemeStore } from './store/useThemeStore';
import { useEffect } from 'react';
import { Loader } from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import Map from './pages/Map';
import Storage from './components/Invoices/Storage';
import InvoiceForm from './components/Invoices/InvoiceForm';
import RoommateForm from './components/RoommateForm/RoommateForm';
import MatchDetails from './components/RoommateForm/MatchDetails ';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ReportPage from './components/Dashboard/ReportPage';
import Profile from './pages/Profile';
import { ToastContainer } from 'react-toastify';
import '@fortawesome/fontawesome-free/css/all.min.css';
import LocationSearch from './pages/LocationSearch';

const App = () => {
    const { authUser, checkAuth, isCheckingAuth, onlineUsers } = useAuthStore();
    const { theme } = useThemeStore();
    const location = useLocation(); // Get the current route

    console.log({ onlineUsers });

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    console.log({ authUser });

    if (isCheckingAuth && !authUser)
        return (
            <div className='flex items-center justify-center h-screen'>
                <Loader className='size-10 animate-spin' />
            </div>
        );

    // Define routes where Navbarchatbox should be visible
    const showNavbarchatbox = ['/chatbox', '/settings'].includes(
        location.pathname,
    );

    // Define routes where Footer should not be visible
    const hideFooter = [
        '/map',
        '/test1',
        '/dashboard',
        '/dashboard/invoices',
        '/dashboard/report',
        '/dashboard/bookings',
        '/dashboard/requests',
    ].includes(location.pathname);

    // Define routes where SearchBar should not be visible

    const hideNavbarAndNavbarchatbox = [
        '/dashboard/invoices',
        '/dashboard/report',
        '/dashboard/bookings',
        '/dashboard/requests',
    ].includes(location.pathname);

    return (
        <div data-theme={theme}>
            {/* Nếu không phải /q mới render Navbarchatbox hoặc Navbar + SearchBar */}
            {!hideNavbarAndNavbarchatbox &&
                (showNavbarchatbox ? (
                    <Navbarchatbox />
                ) : (
                    <>
                        <Navbar />

                        {/* {!hideSearchBar && } */}

                        {/* {!hideSearchBar && <SearchBar />} */}
                    </>
                ))}
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
                <Route path='/invoices' element={<Storage />} />
                <Route path='/test1' element={<InvoiceForm />} />
                <Route path='/roommates' element={<RoommateForm />} />
                <Route path='/match' element={<MatchDetails />} />
                <Route path='/dashboard' element={<Dashboard />} />
                <Route path='/q' element={<ReportPage />} />
                <Route path='/dashboard/*' element={<Dashboard />} />
                <Route path='/q' element={<ReportPage />} />
                <Route path='/dashboard/*' element={<Dashboard />} />
                <Route path='/profile' element={<Profile />} />
                <Route path='/chat' element={<ChatPage2 />} />
                <Route path='/location' element={<LocationSearch />} />

                {/* Add other routes here */}
            </Routes>
            <ToastContainer position='top-right' autoClose={3000} />
            {/* Conditionally render Footer */}
            {!hideFooter && <Footer />} {/* Conditionally render Footer */}
            <Toaster />
        </div>
    );
};

export default App;
