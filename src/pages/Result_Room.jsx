import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import "../styles/Result_Room.css";
import { axiosInstance } from "../lib/axios";
// import { useNotifications } from "../components/NotificationComponent/NotificationContext";
import sink from "../assets/sink.png";
import bedroom from "../assets/bedroom.png";
import { showErrorToast, showSuccessToast, showInfoToast } from "../components/toast";
import { BASE_API_URL } from "../constants";
function Result_Room() {
  const { id } = useParams();
  const navigate = useNavigate();
  // const { sendNotification, isConnected } = useNotifications();

  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showReportForm, setShowReportForm] = useState(false);
  const [reportReason, setReportReason] = useState("");

  const [showViewRequestForm, setShowViewRequestForm] = useState(false);
  const [viewRequestMessage, setViewRequestMessage] = useState("");

  const [showRentalRequestForm, setShowRentalRequestForm] = useState(false);
  const [rentalRequestMessage, setRentalRequestMessage] = useState("");

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    const fetchRoomDetails = async () => {
      try {
        const response = await axiosInstance.get(`${BASE_API_URL}/api/rooms/${id}`);
        const roomData = response.data.data;
        if (roomData && roomData.price != null) {
          setRoom(roomData);
        } else {
          setError("Dữ liệu phòng không hợp lệ.");
        }
      } catch (err) {
        console.error("Error fetching room details:", err.message);
        setError("Failed to fetch room details.");
      } finally {
        setLoading(false);
      }
    };

    fetchRoomDetails();
  }, [id]);

  const handleReportSubmit = async () => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      showInfoToast("Bạn cần đăng nhập để gửi báo cáo.");
      navigate("/login");
      return;
    }

    try {
      const response = await fetch(`${BASE_API_URL}/api/reports`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          roomId: room.id,
          reason: reportReason,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      showInfoToast("Đã gửi báo cáo thành công.");
      setShowReportForm(false);
      setReportReason("");
    } catch (error) {
      showErrorToast("Gửi báo cáo thất bại.");
      console.error("Error submitting report:", error);
    }
  };

  const handleSendViewRequest = async () => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      showInfoToast("Vui lòng đăng nhập để gửi yêu cầu.");
      navigate("/login");
      return;
    }

    if (!viewRequestMessage.trim()) {
      showErrorToast("Vui lòng nhập lời nhắn.");
      return;
    }

    try {
      const response = await fetch(`${BASE_API_URL}/api/view-requests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          roomId: room.id,
          message: viewRequestMessage,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Gửi yêu cầu thất bại");
      }

      showSuccessToast("Đã gửi yêu cầu xem phòng thành công.");
      setShowViewRequestForm(false);
      setViewRequestMessage("");
    } catch (error) {
      console.error(error);
      showErrorToast(error.message || "Đã xảy ra lỗi khi gửi yêu cầu.");
    }
  };

  const handleSendRentalRequest = async () => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      showInfoToast("Vui lòng đăng nhập để gửi yêu cầu.");
      navigate("/login");
      return;
    }

    if (!rentalRequestMessage.trim()) {
      showErrorToast("Vui lòng nhập lời nhắn.");
      return;
    }

    try {
      const response = await fetch(`${BASE_API_URL}/api/rent-requests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          roomId: room.id,
          message: rentalRequestMessage,
        }),
      });

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error(
            "Bạn không có quyền gửi yêu cầu thuê phòng. Vui lòng đăng nhập với tài khoản người thuê."
          );
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Gửi yêu cầu thất bại");
      }

      showInfoToast("Đã gửi yêu cầu thuê phòng thành công.");
      setShowRentalRequestForm(false);
      setRentalRequestMessage("");
    } catch (error) {
      console.error("Error sending rental request:", error);
      showErrorToast(error.message || "Đã xảy ra lỗi khi gửi yêu cầu.");
    }
  };

  if (loading) return <p>Đang tải chi tiết phòng...</p>;
  if (error) return <p>{error}</p>;
  if (!room) return <p>Không tìm thấy phòng.</p>;

  const baseURL = `${BASE_API_URL}/images/`;
  const imageUrls =
    room.imageUrls?.length > 0 ? room.imageUrls.map((url) => baseURL + url) : ["/default-room.jpg"];

  const mainImageUrl = imageUrls[selectedImageIndex];

  return (
    <div className="result-room">
      <div className="breadcrumb">
        <Link to="/Room">Phòng trọ</Link> / <span>Chi tiết phòng</span>
      </div>

      <h1 className="hotel-title">{room.title}</h1>
      <p className="hotel-location">{room.addressDetails}</p>

      <div className="image-gallery">
        <div className="main-image">
          <button
            className="gallery-nav-btn prev"
            onClick={() =>
              setSelectedImageIndex((prev) => (prev === 0 ? imageUrls.length - 1 : prev - 1))
            }
            aria-label="Previous image"
          >
            &#8592;
          </button>
          <img
            src={mainImageUrl}
            alt="Main Room"
            onError={(e) => {
              e.target.src = "/default-room.jpg";
            }}
          />
          <button
            className="gallery-nav-btn next"
            onClick={() =>
              setSelectedImageIndex((prev) => (prev === imageUrls.length - 1 ? 0 : prev + 1))
            }
            aria-label="Next image"
          >
            &#8594;
          </button>
        </div>
        <div className="thumbnail-container">
          {imageUrls.map((url, index) => (
            <div
              key={index}
              className={`thumbnail ${selectedImageIndex === index ? "active" : ""}`}
              onClick={() => setSelectedImageIndex(index)}
            >
              <img
                src={url}
                alt={`Room ${index + 1}`}
                onError={(e) => {
                  e.target.src = "/default-room.jpg";
                }}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="detail-room">
        <div className="detail_about-place">
          <h2>Chi tiết phòng trọ</h2>
          <p>{room.description}</p>
          <div className="room-details">
            <span>
              <strong>Diện tích:</strong> {room.roomSize} m²
            </span>
            <span>
              <img src={bedroom} alt="" />
              <strong>Số người:</strong> {room.numBedrooms}
            </span>
            <span>
              <img src={sink} alt="" />
              <strong>Phòng tắm:</strong> {room.numBathrooms}
            </span>
          </div>
          <p>
            <strong> Có sẵn từ ngày:</strong> {new Date(room.availableFrom).toLocaleDateString()}
          </p>
          <p>
            <strong> Phòng trọ trống:</strong> {room.isRoomAvailable ? "CÓ" : "KHÔNG"}
          </p>
        </div>

        <div className="detail_price-booking">
          <h4>Gửi yêu cầu</h4>

          <span>{room.price.toLocaleString()}VND/Tháng </span>
          {/* <button onClick={() => setShowViewRequestForm(true)}>Gửi yêu cầu xem phòng</button>
          <button onClick={() => setShowRentalRequestForm(true)}>Gửi yêu cầu thuê phòng</button> */}
          <button
            onClick={() => {
              const token = localStorage.getItem("authToken");
              if (!token) {
                showInfoToast("Vui lòng đăng nhập để gửi yêu cầu.");
                navigate("/login");
                return;
              }
              setShowViewRequestForm(true);
            }}
          >
            Gửi yêu cầu xem phòng
          </button>
          <button
            onClick={() => {
              const token = localStorage.getItem("authToken");
              if (!token) {
                showInfoToast("Vui lòng đăng nhập để gửi yêu cầu.");
                navigate("/login");
                return;
              }
              setShowRentalRequestForm(true);
            }}
          >
            Gửi yêu cầu thuê phòng
          </button>
        </div>

        <button
          className="report-button"
          onClick={() => {
            const token = localStorage.getItem("authToken");
            if (!token) {
              showInfoToast("Bạn cần đăng nhập để gửi báo cáo.");
              navigate("/login");
              return;
            }
            setShowReportForm(true);
          }}
        >
          {" "}
          <i className="fa-solid fa-flag"> </i> Báo cáo bài viết{" "}
        </button>

        {showReportForm && (
          <div className="report-overlay">
            <div className="report-form">
              <h3 className="text-red-600">
                <i className="fa-solid fa-flag"> </i> <b>Báo cáo bài viết</b>
              </h3>
              <textarea
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                placeholder="Nhập lý do báo cáo..."
              />
              <div className="report_inside-buttons">
                <button onClick={handleReportSubmit}>Gửi báo cáo</button>
                <button onClick={() => setShowReportForm(false)}>Hủy</button>
              </div>
            </div>
          </div>
        )}

        {showViewRequestForm && (
          <div className="report-overlay">
            <div className="report-form">
              <h3>Yêu cầu xem phòng</h3>
              <textarea
                value={viewRequestMessage}
                onChange={(e) => setViewRequestMessage(e.target.value)}
                placeholder="Nhập lời nhắn cho chủ phòng..."
              />
              <div className="report-buttons">
                <button className="send-request" onClick={handleSendViewRequest}>
                  Gửi yêu cầu
                </button>
                <button onClick={() => setShowViewRequestForm(false)}>Hủy</button>
              </div>
            </div>
          </div>
        )}

        {showRentalRequestForm && (
          <div className="report-overlay">
            <div className="report-form">
              <h3>Yêu cầu thuê phòng</h3>
              <textarea
                value={rentalRequestMessage}
                onChange={(e) => setRentalRequestMessage(e.target.value)}
                placeholder="Nhập lời nhắn cho chủ phòng..."
              />
              <div className="report-buttons">
                <button className="send-request" onClick={handleSendRentalRequest}>
                  Gửi yêu cầu
                </button>
                <button onClick={() => setShowRentalRequestForm(false)}>Hủy</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Result_Room;
