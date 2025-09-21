import React, { useState, useEffect } from "react";
import "./Storage.css";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import InvoiceDetails from "./InvoiceDetails";
import InvoiceForm from "./InvoiceForm";
import { useNavigate } from "react-router-dom";

/**
 * Component chính quản lý danh sách hóa đơn và các chức năng liên quan.
 */
const Storage = ({ roomId }) => {
  const navigate = useNavigate();
  const [searchRoomName, setSearchRoomName] = useState(""); // Tìm kiếm theo tên phòng
  const [startDate, setStartDate] = useState(""); // Ngày bắt đầu tìm kiếm
  const [endDate, setEndDate] = useState(""); // Ngày kết thúc tìm kiếm
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null); // ID hóa đơn đang xem
  const [isCreatingNew, setIsCreatingNew] = useState(false); // State để kiểm soát việc hiển thị form tạo mới
  const [contracts, setContracts] = useState([]); // Danh sách hợp đồng
  const [loading, setLoading] = useState(false); // Loading state
  const [error, setError] = useState(null); // Error state
  const [tenantNames, setTenantNames] = useState({}); // Store tenant names
  const [roomNames, setRoomNames] = useState({}); // Store room names

  const [currentPage, setCurrentPage] = useState(1); // Trang hiện tại
  const itemsPerPage = 10; // Số mục trên mỗi trang

  // Fetch contracts when component mounts
  useEffect(() => {
    fetchContracts();
  }, []);

  // Function to fetch tenant name
  const fetchTenantName = async (tenantId) => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        throw new Error("Không tìm thấy token xác thực");
      }

      console.log(`Fetching tenant info for ID: ${tenantId}`);
      const response = await fetch(`http://localhost:8080/owner/get-users/${tenantId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Server error response: ${errorText}`);
        throw new Error(`Lỗi server: ${response.status} - ${response.statusText}`);
      }

      // Get the response text and clean it up
      const responseText = await response.text();
      console.log("Raw response:", responseText.substring(0, 200) + "..."); // Log first 200 chars
      
      try {
        // Try to parse the full response first
        const fullData = JSON.parse(responseText);
        if (fullData.usersList?.[0]?.fullName) {
          setTenantNames(prev => ({
            ...prev,
            [tenantId]: fullData.usersList[0].fullName
          }));
          return;
        }
      } catch (fullParseError) {
        console.log("Full parse failed, trying partial parse");
      }

      // If full parse failed, try partial parse
      const userInfoMatch = responseText.match(/"usersList":\s*\[\s*{\s*"id":\s*\d+,\s*"fullName":\s*"([^"]+)"/);
      if (userInfoMatch) {
        const fullName = userInfoMatch[1];
        console.log(`Found tenant name: ${fullName}`);
        setTenantNames(prev => ({
          ...prev,
          [tenantId]: fullName
        }));
      } else {
        console.warn("Could not extract tenant name from response");
        setTenantNames(prev => ({
          ...prev,
          [tenantId]: "Không tìm thấy tên"
        }));
      }
    } catch (error) {
      console.error("Error fetching tenant name:", error);
      setTenantNames(prev => ({
        ...prev,
        [tenantId]: `Lỗi: ${error.message}`
      }));
    }
  };

  // Function to fetch room name
  const fetchRoomName = async (roomId) => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        throw new Error("Không tìm thấy token xác thực");
      }

      console.log(`Fetching room info for ID: ${roomId}`);
      const response = await fetch(`http://localhost:8080/api/rooms/${roomId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
      });

      if (!response.ok) {
        throw new Error(`Lỗi server: ${response.status}`);
      }

      const data = await response.json();
      if (data.data && data.data.title) {
        setRoomNames(prev => ({
          ...prev,
          [roomId]: data.data.title
        }));
      } else {
        setRoomNames(prev => ({
          ...prev,
          [roomId]: "Không tìm thấy tên phòng"
        }));
      }
    } catch (error) {
      console.error("Error fetching room name:", error);
      setRoomNames(prev => ({
        ...prev,
        [roomId]: "Lỗi tải thông tin"
      }));
    }
  };

  // Update fetchContracts to fetch room names
  const fetchContracts = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        throw new Error("Vui lòng đăng nhập để xem danh sách hợp đồng");
      }

      console.log("Fetching contracts with token:", token);
      const response = await fetch('http://localhost:8080/api/contracts', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
      });

      console.log("Response status:", response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error("Error response data:", errorData);
        
        if (response.status === 401) {
          throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại");
        } else if (response.status === 403) {
          throw new Error("Bạn không có quyền truy cập danh sách hợp đồng");
        } else if (response.status === 500) {
          const errorMessage = errorData?.message || "Lỗi máy chủ. Vui lòng thử lại sau";
          console.error("Server error details:", errorData);
          throw new Error(errorMessage);
        } else {
          throw new Error(errorData?.message || `Lỗi: ${response.status} - ${response.statusText}`);
        }
      }

      const responseData = await response.json();
      console.log("Response data:", responseData);
      
      if (responseData && responseData.data) {
        // Transform the data to match our expected format
        const transformedContracts = responseData.data.map(contract => ({
          id: contract.id,
          roomId: contract.roomId,
          tenantId: contract.tenantId,
          startDate: contract.startDate,
          endDate: contract.endDate,
          price_per_month: contract.pricePerMonth,
          status: contract.status || "ACTIVE"
        }));
        
        setContracts(transformedContracts);
        
        // Fetch tenant names and room names for all contracts
        transformedContracts.forEach(contract => {
          if (contract.tenantId && !tenantNames[contract.tenantId]) {
            fetchTenantName(contract.tenantId);
          }
          if (contract.roomId && !roomNames[contract.roomId]) {
            fetchRoomName(contract.roomId);
          }
        });
      } else {
        console.error("Invalid response format:", responseData);
        throw new Error("Định dạng dữ liệu không hợp lệ");
      }
    } catch (err) {
      console.error('Error fetching contracts:', err);
      setError(err.message || 'Có lỗi xảy ra khi tải danh sách hợp đồng');
    } finally {
      setLoading(false);
    } 
  };

  /**
   * Lọc danh sách hợp đồng dựa trên tìm kiếm.
   */
  const filteredContracts = contracts.filter((contract) => {
    const isSenderMatch = contract.tenantId.toString().includes(searchRoomName);
    const isDateMatch =
      (!startDate || new Date(contract.startDate) >= new Date(startDate)) &&
      (!endDate || new Date(contract.endDate) <= new Date(endDate));
    return isSenderMatch && isDateMatch;
  });

  const totalPages = Math.ceil(filteredContracts.length / itemsPerPage); // Tổng số trang
  const startIndex = (currentPage - 1) * itemsPerPage; // Chỉ mục bắt đầu của trang hiện tại
  const currentContracts = filteredContracts.slice(
    startIndex,
    startIndex + itemsPerPage
  ); // Danh sách hợp đồng trên trang hiện tại

  /**
   * Xóa hợp đồng khỏi danh sách.
   * 
   * @param {number} id - ID của hợp đồng cần xóa.
   */
  const handleDelete = async (id) => {
    try {
      const response = await fetch(`http://localhost:8080/api/contracts/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete contract');
      }

      setContracts(contracts.filter((contract) => contract.id !== id));
    } catch (err) {
      setError(err.message || 'Có lỗi xảy ra khi xóa hợp đồng');
      console.error('Error deleting contract:', err);
    }
  };

  /**
   * Chuyển trang.
   * 
   * @param {number} page - Số trang cần chuyển đến.
   */
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  /**
   * Lấy danh sách số trang.
   * 
   * @returns {array} Danh sách số trang.
   */
  const getPageNumbers = () => {
    const pages = [];
    const startPage = Math.max(1, currentPage - 1);
    const endPage = Math.min(totalPages, currentPage + 1);

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };

  /**
   * Xem chi tiết hợp đồng.
   * 
   * @param {number} id - ID của hợp đồng cần xem.
   */
  const handleViewContract = (id) => {
    setSelectedInvoiceId(id);
  };

  /**
   * Đóng chi tiết hợp đồng.
   */
  const handleCloseContractDetails = () => {
    setSelectedInvoiceId(null);
  };

  /**
   * Mở form tạo mới hợp đồng.
   */
  const handleCreateNewContract = () => {
    setIsCreatingNew(true);
  };

  /**
   * Lưu hợp đồng mới.
   * 
   * @param {object} newContract - Dữ liệu hợp đồng mới.
   */
  const handleSaveContract = (newContract) => {
    setContracts([...contracts, newContract]);
    setIsCreatingNew(false);
  };

  /**
   * Hủy tạo mới hợp đồng.
   */
  const handleCancelCreate = () => {
    setIsCreatingNew(false);
  };

  return (
    <div className="Storage-container">
      <div className="search-container">
        <input
          type="text"
          placeholder="Tìm theo tên phòng"
          value={searchRoomName}
          onChange={(e) => setSearchRoomName(e.target.value)}
        />
        <input
          type="date"
          placeholder="Từ ngày"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
        <input
          type="date"
          placeholder="Đến ngày"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />
        <button className="search-btn">Tìm kiếm</button>
        <button
          className="refresh-btn"
          onClick={() => {
            setSearchRoomName("");
            setStartDate("");
            setEndDate("");
            fetchContracts();
          }}
        >
          Làm mới
        </button>
      </div>

      <button className="create-new-btn" onClick={handleCreateNewContract}>
        Tạo mới
      </button>

      {loading ? (
        <div className="loading-container">
          <p>Đang tải...</p>
        </div>
      ) : error ? (
        <div className="error-container">
          <div className="error-content">
            <p className="error-message">{error}</p>
            <button 
              className="retry-button"
              onClick={fetchContracts}
            >
              Thử lại
            </button>
          </div>
        </div>
      ) : contracts.length === 0 ? (
        <div className="empty-state-container">
          <div className="empty-state-content">
            <h3>Chưa có hợp đồng nào</h3>
            <p>Bạn có thể tạo hợp đồng mới bằng cách nhấn nút "Tạo mới" ở trên</p>
          </div>
        </div>
      ) : (
        <>
          <table className="email-table">
            <thead>
              <tr>
                <th>STT</th>
                {/* <th>ID Người thuê</th> */}
                <th>Tên người thuê</th>
                {/* <th>ID Phòng</th> */}
                <th>Tên phòng</th>
                <th>Ngày bắt đầu</th>
                <th>Ngày kết thúc</th>
                <th>Giá thuê</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {currentContracts.map((contract, index) => (
                <tr key={contract.id}>
                  <td>{startIndex + index + 1}</td>
                  {/* <td>{contract.tenantId}</td> */}
                  <td>{tenantNames[contract.tenantId] || "Đang tải..."}</td>
                  {/* <td>{contract.roomId}</td> */}
                  <td>{roomNames[contract.roomId] || "Đang tải..."}</td>
                  <td>{new Date(contract.startDate).toLocaleDateString()}</td>
                  <td>{new Date(contract.endDate).toLocaleDateString()}</td>
                  <td>{contract.price_per_month?.toLocaleString()} VNĐ</td>
                  <td>
                    <span className={`status-${contract.status?.toLowerCase()}`}>
                      {contract.status === "ACTIVE" ? "Đang hoạt động" :
                       contract.status === "EXPIRED" ? "Đã hết hạn" :
                       contract.status === "TERMINATED" ? "Đã chấm dứt" :
                       contract.status}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="view-btn"
                        onClick={() => handleViewContract(contract.id)}
                      >
                        Xem
                      </button>
                      <button
                        className="delete-btn"
                        onClick={() => {
                          if (window.confirm("Bạn có chắc chắn muốn xóa hợp đồng này?")) {
                            handleDelete(contract.id);
                          }
                        }}
                      >
                        Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="pagination">
            <button
              className="pagination-btn"
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1}
            >
              <ChevronsLeft size={16} />
            </button>
            <button
              className="pagination-btn"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft size={16} />
            </button>
            {getPageNumbers().map((page) => (
              <button
                key={page}
                className={`pagination-btn ${
                  currentPage === page ? "active" : ""
                }`}
                onClick={() => handlePageChange(page)}
              >
                {page}
              </button>
            ))}
            <button
              className="pagination-btn"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <ChevronRight size={16} />
            </button>
            <button
              className="pagination-btn"
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage === totalPages}
            >
              <ChevronsRight size={16} />
            </button>
          </div>
        </>
      )}

      {isCreatingNew && (
        <div className="form-overlay">
          <InvoiceForm 
            onSave={handleSaveContract} 
            onCancel={handleCancelCreate}
            roomId={roomId}
          />
        </div>
      )}

      {selectedInvoiceId && (
        <InvoiceDetails
          invoiceId={selectedInvoiceId}
          onClose={handleCloseContractDetails}
          invoices={contracts}
        />
      )}
    </div>
  );
};

export default Storage;
