import { useState, useEffect } from "react";
import BookingCard from "./BookingCard";
import FilterBar from "./FilterBar";
import RegisterForm from "./RegisterForm";
import EditForm from "./EditForm";
import "./css/BookingsPage.css";

const BookingsPage = () => {
  const [hotels, setHotels] = useState([]);
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [editingHotel, setEditingHotel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const token = localStorage.getItem("authToken");
  const userRole = localStorage.getItem("userRole");

  useEffect(() => {
    console.log("Current user role:", userRole); // Debug log

    if (!token) {
      setError("Vui lòng đăng nhập để xem danh sách phòng");
      setLoading(false);
      return;
    }

    // Kiểm tra role chính xác hơn
    if (userRole !== "ADMIN" && userRole !== "OWNER") {
      console.log("Invalid role:", userRole); // Debug log
      setError("Bạn không có quyền truy cập trang này");
      setLoading(false);
      return;
    }

    const fetchMyRooms = async () => {
      try {
        setLoading(true);
        // Nếu là ADMIN thì dùng endpoint khác
        const endpoint = userRole === "ADMIN" 
          ? "http://localhost:8080/api/rooms" 
          : "http://localhost:8080/api/rooms/owner";

        console.log("Fetching from endpoint:", endpoint); // Debug log
        const response = await fetch(endpoint, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          // Không throw error nếu không tìm thấy phòng
          if (response.status === 404) {
            setHotels([]);
            setLoading(false);
            return;
          }
          throw new Error(errorData.message || "Không thể lấy danh sách phòng");
        }
        
        const result = await response.json();
        console.log("Dữ liệu lấy được từ API:", result);
        
        // Kiểm tra và xử lý dữ liệu trước khi set state
        if (result && result.data) {
          const validHotels = Array.isArray(result.data) 
            ? result.data.filter(hotel => hotel && hotel.id) // Lọc ra các hotel hợp lệ
            : [];
          setHotels(validHotels);
        } else {
          setHotels([]);
        }
      } catch (err) {
        console.error("Lỗi khi fetch danh sách phòng:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMyRooms();
  }, [token, userRole]);

  const handleAddHotel = (newHotel) => {
    if (newHotel && newHotel.id) {
      setHotels((prev) => [...prev, newHotel]);
      setShowRegisterForm(false);
    }
  };

  const handleEditClick = (hotel) => {
    if (hotel && hotel.id) {
      setEditingHotel(hotel);
    }
  };

  const handleUpdateHotel = (updatedHotel) => {
    if (updatedHotel && updatedHotel.id) {
      setHotels((prev) =>
        prev.map((h) => (h.id === updatedHotel.id ? updatedHotel : h))
      );
      setEditingHotel(null);
    }
  };

  const handleDeleteHotel = async (hotelId) => {
    if (!hotelId) return;
    
    if (!window.confirm("Bạn có chắc muốn xóa phòng này?")) return;
  
    try {
      const response = await fetch(`http://localhost:8080/api/rooms/${hotelId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Xóa phòng thất bại");
      }
  
      setHotels((prev) => prev.filter((hotel) => hotel.id !== hotelId));
    } catch (err) {
      alert("Lỗi khi xóa phòng: " + err.message);
    }
  };

  if (loading) {
    return <div className="BookingsPage-content">Đang tải...</div>;
  }

  if (error && error !== "Không có phòng nào được tìm thấy cho owner này") {
    return <div className="BookingsPage-content error">{error}</div>;
  }

  return (
    <div className="BookingsPage-content">
      <FilterBar onAddClick={() => setShowRegisterForm(true)} />
      
      {showRegisterForm && (
        <RegisterForm
          onClose={() => setShowRegisterForm(false)}
          onRegister={handleAddHotel}
        />
      )}
      
      {editingHotel && (
        <EditForm
          hotel={editingHotel}
          onClose={() => setEditingHotel(null)}
          onUpdate={handleUpdateHotel}
        />
      )}
      
      <div className="booking-list">
        {hotels.length > 0 ? (
          hotels.map((hotel) => (
            <BookingCard
              key={hotel.id}
              initialHotel={hotel}
              onEditClick={handleEditClick}
              onDeleteClick={() => handleDeleteHotel(hotel.id)}
            />
          ))
        ) : (
          <div className="no-rooms-message">
            <p>Chưa có phòng nào được đăng.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingsPage;
