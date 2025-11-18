// Dashboard.jsx
import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from '../components/Dashboard/Sidebar';
import BookingsPage from '../components/Dashboard/BookingsPage';
import Request from '../components/Dashboard/Request';
import ReportPage from '../components/Dashboard/ReportPage';
// import Storage from '../components/Invoices/Storage';
import AddIncidentForm from '../components/Dashboard/AddIncidentForm';
// import SettingPage from "../components/Dashboard/Setting"; // nếu có
import '../styles/Dashboard.css';

function Dashboard() {
    return (
        <div className='Dashboard-container'>
            <Sidebar />
            <div style={{ flex: 1 }}>
                <Routes>
                    <Route index element={<Navigate to='bookings' replace />} />
                    <Route path='bookings' element={<BookingsPage />} />
                    <Route path='requests' element={<Request />} />
                    <Route path='report' element={<ReportPage />} />
                    {/* <Route path='invoices' element={<Storage />} /> */}
                    <Route path='add-incident' element={<AddIncidentForm />} />
                    {/* <Route path="setting" element={<SettingPage />} /> */}
                </Routes>
            </div>
        </div>
    );
}

export default Dashboard;
