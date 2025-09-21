// Dashboard.jsx
import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from '../components/Dashboard/Sidebar';
import BookingsPage from '../components/Dashboard/BookingsPage';
import Request from '../components/Dashboard/Request';
import ReportPage from '../components/Dashboard/ReportPage';
import Storage from '../components/Invoices/Storage';
// import SettingPage from "../components/Dashboard/Setting"; // nếu có
import '../styles/Dashboard.css';

function Dashboard() {
    return (
        <div className='Dashboard-container'>
            <Sidebar />
            <div style={{ flex: 1 }}>
                <Routes>
                    <Route path='bookings' element={<BookingsPage />} />
                    <Route path='requests' element={<Request />} />
                    <Route path='report' element={<ReportPage />} />
                    <Route path='invoices' element={<Storage />} />
                    {/* <Route path="setting" element={<SettingPage />} /> */}
                    <Route
                        path='/'
                        element={<Navigate to='bookings' replace />}
                    />
                </Routes>
            </div>
        </div>
    );
}

export default Dashboard;
