import { useState, useEffect } from 'react';
import ReportTable from './ReportTable';
import './css/ReportPage.css';
import { axiosInstance } from '../../lib/axios';
import { showErrorToast, showSuccessToast } from '../toast';
import { BASE_API_URL } from '../../constants';

function ModalContent({ report, onClose, onViPham, onKhongViPham }) {
    if (!report) return null;

    const styles = {
        backdrop: {
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
        },
        modal: {
            backgroundColor: '#fff',
            padding: '32px',
            borderRadius: '8px',
            minWidth: '360px',
            maxWidth: '600px',
            width: '90%',
            boxShadow: '0 4px 24px rgba(0, 0, 0, 0.3)',
            border: '1px solid #ddd',
            zIndex: 10000,
            position: 'relative',
        },
        contentBox: {
            backgroundColor: '#f9f9f9',
            padding: '10px',
            borderRadius: '6px',
            border: '1px solid #ccc',
            whiteSpace: 'pre-line',
            marginTop: '8px',
        },
        button: {
            padding: '8px 16px',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            backgroundColor: '#1976d2',
            color: '#fff',
            marginLeft: '10px',
        },
        dangerButton: {
            padding: '8px 16px',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            backgroundColor: '#e53935',
            color: '#fff',
            marginRight: '10px',
        },
        buttonGroup: {
            marginTop: '20px',
        },
        sectionTitle: {
            marginTop: '12px',
        },
        header: {
            marginBottom: '16px',
        },
    };

    return (
        <div style={styles.backdrop} onClick={onClose}>
            <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div style={styles.header}>
                    <h3>Chi tiết báo cáo</h3>
                </div>
                <p>
                    <b>Tiêu đề bài viết:</b> {report.roomTitle}
                </p>
                <p>
                    <b>Người đăng bài:</b>{' '}
                    {report.roomOwnerName || 'Không xác định'}
                </p>
                <p>
                    <b>Địa chỉ phòng:</b> {report.roomAddress}
                </p>
                <p>
                    <b>Người báo cáo:</b> {report.reporterName}
                </p>
                <p>
                    <b>Lý do:</b> {report.reason}
                </p>
                <p>
                    <b>Thời gian:</b>{' '}
                    {new Date(report.createdAt).toLocaleString()}
                </p>
                <p>
                    {report.isHandled ? (
                        <>
                            <b>Trạng thái:</b> Đã xử lý
                        </>
                    ) : (
                        <>
                            <b>Trạng thái:</b> Chưa xử lý
                        </>
                    )}
                </p>

                <p style={styles.sectionTitle}>
                    <b>Nội dung bài viết:</b>
                </p>
                <div style={styles.contentBox}>
                    {report.roomContent || 'Không có nội dung.'}
                </div>

                <div style={styles.buttonGroup}>
                    <button
                        style={styles.dangerButton}
                        onClick={() => onViPham(report.id)}
                    >
                        Vi phạm
                    </button>
                    <button
                        style={styles.button}
                        onClick={() => onKhongViPham(report.id)}
                    >
                        Không vi phạm
                    </button>
                    <button style={styles.button} onClick={onClose}>
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    );
}

const ReportPage = () => {
    const [reports, setReports] = useState([]);
    const [selectedReport, setSelectedReport] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10; // Số lượng báo cáo trên mỗi trang

    useEffect(() => {
        const fetchReports = async () => {
            try {
                const token = localStorage.getItem('authToken');
                if (!token) {
                    alert('Bạn chưa đăng nhập. Vui lòng đăng nhập lại.');
                    window.location.href = '/login';
                    return;
                }

                const response = await axiosInstance.get(
                    `${BASE_API_URL}/api/reports/admin`,
                    {
                        headers: { Authorization: `Bearer ${token}` },
                    },
                );

                const reportList = response.data.data?.data || [];
                if (!Array.isArray(reportList))
                    throw new Error('Dữ liệu trả về không hợp lệ.');
                setReports(reportList);
                setLoading(false);
            } catch (error) {
                if (error.response?.status === 403) {
                    alert(
                        'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
                    );
                    localStorage.removeItem('authToken');
                    window.location.href = '/login';
                } else {
                    setError(
                        error.response?.data?.message || 'Lỗi tải báo cáo.',
                    );
                }
                setLoading(false);
            }
        };

        fetchReports();
    }, []);

    // Show or hide the modal when a report is selected
    useEffect(() => {
        if (selectedReport) {
            setShowModal(true);
        } else {
            setShowModal(false);
        }
    }, [selectedReport]);

    const handleView = async (report) => {
        try {
            // Fetch room details if roomId exists
            if (report.roomId) {
                const roomResponse = await axiosInstance.get(
                    `${BASE_API_URL}/api/rooms/${report.roomId}`,
                    {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
                        },
                    },
                );

                if (roomResponse.data) {
                    const roomData = roomResponse.data.data;
                    report.roomContent = roomData.description;

                    // Fetch owner information
                    if (roomData.ownerId) {
                        const ownerResponse = await axiosInstance.get(
                            `${BASE_API_URL}/owner/get-users/${roomData.ownerId}`,
                            {
                                headers: {
                                    Authorization: `Bearer ${localStorage.getItem('authToken')}`,
                                },
                            },
                        );

                        if (ownerResponse.data) {
                            const ownerInfo = ownerResponse.data.usersList?.[0];
                            if (ownerInfo) {
                                report.roomOwnerName = ownerInfo.fullName;
                            }
                        }
                    }
                }
            }

            setSelectedReport(report);
        } catch (error) {
            console.error('Error fetching report details:', error);
            showErrorToast('Không thể tải thông tin báo cáo');
        }
    };

    const handleClose = () => {
        setShowModal(false);
        setSelectedReport(null);
    };

    const handleViPham = async (id) => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await axiosInstance.post(
                `${BASE_API_URL}/api/reports/${id}/handle`,
                {
                    isViolation: true,
                    adminNote: 'Đăng tin giả, đã xóa bài.',
                    type: 'BREACH',
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                },
            );

            if (response.status === 200) {
                // Cập nhật trạng thái báo cáo trong danh sách
                setReports((prev) =>
                    prev.map((r) =>
                        r.id === id ? { ...r, isHandled: true } : r,
                    ),
                );
                showSuccessToast('Đã xử lý báo cáo thành công');
                handleClose();
            }
        } catch (error) {
            console.error('Lỗi xử lý vi phạm:', error);
            showErrorToast(
                error.response?.data?.message || 'Xử lý báo cáo thất bại',
            );
        }
    };

    const handleKhongViPham = async (id) => {
        try {
            const token = localStorage.getItem('authToken');
            const response = await axiosInstance.post(
                `${BASE_API_URL}/api/reports/${id}/handle`,
                {
                    isViolation: false,
                    adminNote: 'Không vi phạm.',
                    type: 'NON_BREACH',
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                },
            );

            if (response.status === 200) {
                // Cập nhật trạng thái báo cáo trong danh sách
                setReports((prev) =>
                    prev.map((r) =>
                        r.id === id ? { ...r, isHandled: true } : r,
                    ),
                );
                showSuccessToast('Đã xử lý báo cáo thành công');
                handleClose();
            }
        } catch (error) {
            console.error('Lỗi xử lý không vi phạm:', error);
            showErrorToast(
                error.response?.data?.message || 'Xử lý báo cáo thất bại',
            );
        }
    };

    const totalPages = Math.ceil(reports.length / itemsPerPage);
    const currentReports = reports.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage,
    );

    return (
        <div className='report-page-container'>
            <div className='content1'>
                <div className='content-header1'>
                    <h2 style={{ color: '#1976d2' }}>
                        Danh sách báo cáo bài viết
                    </h2>
                    <input className='search1' placeholder='Tìm kiếm báo cáo' />
                </div>

                {loading ? (
                    <p>Đang tải báo cáo...</p>
                ) : error ? (
                    <p>{error}</p>
                ) : (
                    <>
                        <ReportTable
                            reports={currentReports}
                            onView={handleView}
                        />
                        <div className='pagination'>
                            <button
                                onClick={() => setCurrentPage(1)}
                                disabled={currentPage === 1}
                            >
                                Trang đầu
                            </button>
                            <button
                                onClick={() =>
                                    setCurrentPage((p) => Math.max(1, p - 1))
                                }
                                disabled={currentPage === 1}
                            >
                                Trước
                            </button>
                            {[...Array(totalPages).keys()].map((i) => (
                                <button
                                    key={i + 1}
                                    className={
                                        currentPage === i + 1 ? 'active' : ''
                                    }
                                    onClick={() => setCurrentPage(i + 1)}
                                >
                                    {i + 1}
                                </button>
                            ))}
                            <button
                                onClick={() =>
                                    setCurrentPage((p) =>
                                        Math.min(totalPages, p + 1),
                                    )
                                }
                                disabled={currentPage === totalPages}
                            >
                                Tiếp
                            </button>
                            <button
                                onClick={() => setCurrentPage(totalPages)}
                                disabled={currentPage === totalPages}
                            >
                                Trang cuối
                            </button>
                        </div>
                    </>
                )}
            </div>

            {showModal && selectedReport && (
                <ModalContent
                    key={`modal-${selectedReport.id}`}
                    report={selectedReport}
                    onClose={handleClose}
                    onViPham={handleViPham}
                    onKhongViPham={handleKhongViPham}
                />
            )}
        </div>
    );
};
export default ReportPage;
