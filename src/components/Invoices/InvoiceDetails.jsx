import { useState, useEffect } from "react";
import moment from "moment"; // Import moment.js
import "./Storage.css"; // Import CSS styles for the component

/**
 * Component hiển thị chi tiết hợp đồng.
 * 
 * @param {string} invoiceId - ID của hợp đồng cần hiển thị.
 * @param {function} onClose - Hàm đóng modal.
 */
const InvoiceDetails = ({ invoiceId, onClose }) => {
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tenantInfo, setTenantInfo] = useState(null);
  const [roomInfo, setRoomInfo] = useState(null);

  useEffect(() => {
    const fetchInvoiceDetails = async (id) => {
      setLoading(true);
      try {
        // Fetch contract details
        const response = await fetch(`http://localhost:8080/api/contracts/${id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch contract details');
        }

        const data = await response.json();
        console.log("Contract details:", data);
        // Try to get the contract object from data.data, data.contract, or data
        const contract = data.data || data.contract || data;
        setInvoice(contract);

        // Fetch tenant information
        if (contract.tenantId) {
          const tenantResponse = await fetch(`http://localhost:8080/owner/get-users/${contract.tenantId}`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("authToken")}`,
            },
          });
          if (tenantResponse.ok) {
            const tenantData = await tenantResponse.json();
            if (tenantData.usersList && tenantData.usersList.length > 0) {
              setTenantInfo(tenantData.usersList[0]);
            }
          }
        }

        // Fetch room information
        if (contract.roomId) {
          const roomResponse = await fetch(`http://localhost:8080/api/rooms/${contract.roomId}`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("authToken")}`,
            },
          });
          if (roomResponse.ok) {
            const roomData = await roomResponse.json();
            if (roomData.data) {
              setRoomInfo(roomData.data);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching invoice details:', error);
      } finally {
        setLoading(false);
      }
    };

    if (invoiceId) {
      fetchInvoiceDetails(invoiceId);
    }
  }, [invoiceId]);

  if (loading) {
    return (
      <div className="modal1">
        <div className="modal-content1">
          <p>Đang tải thông tin chi tiết hợp đồng...</p>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="modal1">
        <div className="modal-content1">
          <p>Không thể tải thông tin chi tiết hợp đồng.</p>
          <button type="button" onClick={onClose}>Đóng</button>
        </div>
      </div>
    );
  }

  return (
    <div className="modal1">
      <div className="modal-content1">
        <span className="close" onClick={onClose}>&times;</span>
        <h2>Chi Tiết Hợp Đồng</h2>

        <div className="invoice-container">
          <div className="invoice-header">
            <p>CHI TIẾT HỢP ĐỒNG</p>
            {roomInfo && <p>Phòng: {roomInfo.title}</p>}
          </div>

          <div className="invoice-section">
            <h3>Thông tin phòng</h3>
            {roomInfo ? (
              <div className="room-info">
                {/* <p><strong>ID Phòng:</strong> {roomInfo.id}</p> */}
                <p><strong>Địa chỉ:</strong> {roomInfo.addressDetails}</p>
                <p><strong>Giá phòng:</strong> {roomInfo.price?.toLocaleString()} VNĐ/Tháng</p>
              </div>
            ) : (
              <p>Đang tải thông tin phòng...</p>
            )}
          </div>

          <div className="invoice-section">
            <h3>Thông tin người thuê</h3>
            {tenantInfo ? (
              <div className="tenant-info">
                {/* <p><strong>ID Người thuê:</strong> {tenantInfo.id}</p> */}
                <p><strong>Tên người thuê:</strong> {tenantInfo.fullName}</p>
                <p><strong>Email:</strong> {tenantInfo.email}</p>
                <p><strong>Số điện thoại:</strong> {tenantInfo.phone}</p>
              </div>
            ) : (
              <p>Đang tải thông tin người thuê...</p>
            )}
          </div>

          <div className="invoice-section">
            <h3>Thông tin hợp đồng</h3>
            <div className="contract-info">
              <p><strong>Ngày bắt đầu:</strong> {invoice.startDate ? moment(invoice.startDate).format("DD/MM/YYYY") : ""}</p>
              <p><strong>Ngày kết thúc:</strong> {invoice.endDate ? moment(invoice.endDate).format("DD/MM/YYYY") : ""}</p>
              <p><strong>Giá thuê mỗi tháng:</strong> {invoice.pricePerMonth ? invoice.pricePerMonth.toLocaleString() : ""} VNĐ</p>
              <p><strong>Trạng thái:</strong> {
                invoice.status === "ACTIVE" ? "Đang hoạt động" :
                invoice.status === "EXPIRED" ? "Đã hết hạn" :
                invoice.status === "CANCELLED" ? "Đã hủy" :
                invoice.status === "REJECTED" ? "Đã từ chối" :
                invoice.status === "PENDING" ? "Đang chờ" :
                invoice.status
              }</p>
            </div>
          </div>

          <div className="button-group">
            <button type="button" className="close-button" onClick={onClose}>
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceDetails;
