// React import not required in newer JSX transforms
import './css/ReportTable.css';

const ReportTable = ({ reports, onView }) => {
    if (!Array.isArray(reports) || reports.length === 0) {
        return <p>Không có báo cáo nào để hiển thị.</p>;
    }

    return (
        <table className='report-table'>
            <thead>
                <tr>
                    <th>Tiêu đề</th>
                    <th>Người báo cáo</th>
                    <th>Lý do</th>
                    <th>Thời gian</th>
                    <th>Trạng thái</th>
                    <th>Hành động</th>
                </tr>
            </thead>
            <tbody>
                {reports.map((report) => (
                    <tr key={report.id}>
                        <td>{report.roomTitle}</td>
                        <td>{report.reporterName}</td>
                        <td>{report.reason}</td>
                        <td>{new Date(report.createdAt).toLocaleString()}</td>
                        <td
                            className={
                                report.isHandled ? 'resolved' : 'pending'
                            }
                        >
                            {report.isHandled ? 'Đã xử lý' : 'Chưa xử lý'}
                        </td>
                        <td>
                            <button
                                className='view-btn'
                                onClick={() => onView(report)}
                            >
                                Xem
                            </button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
};

export default ReportTable;
