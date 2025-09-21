import { useState } from "react";
import "../styles/Login.css";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png"; // Import logo nếu cần
import building from "../assets/4k_building.mp4"; // Import icon nếu cần
import { showErrorToast, showSuccessToast } from "../components/toast"; // Import toast thông báo
import { BASE_API_URL } from "../constants";

export default function Login() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [forgotPassword, setForgotPassword] = useState(false);
  const [email, setEmail] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (email.trim() === "" || password.length < 6) {
      setError("Username không được để trống và mật khẩu phải có ít nhất 6 ký tự.");
      return;
    }

    try {
      let data = {
        email: email,
        password: password,
      };
      console.log("Dữ liệu gửi đến API:", data);
      const response = await fetch(`${BASE_API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Đăng nhập thất bại.");
      }

      const responseData = await response.json();
      console.log("Response data:", responseData);

      if (!responseData.token) {
        throw new Error("Token không tồn tại trong response");
      }

      // Lưu token
      localStorage.setItem("authToken", responseData.token);
      localStorage.setItem("Email", email);
      localStorage.setItem("chat-username", email);

      // Lấy thông tin user từ API profile
      const profileResponse = await fetch(`${BASE_API_URL}/renterowner/get-profile`, {
        headers: {
          Authorization: `Bearer ${responseData.token}`,
        },
      });

      if (!profileResponse.ok) {
        throw new Error("Không thể lấy thông tin user");
      }

      const profileData = await profileResponse.json();
      console.log("Profile data:", profileData);

      if (profileData && profileData.statusCode === 200) {
        // Tạo user data từ response
        const userData = {
          fullName: profileData.fullName,
          email: profileData.email,
          phone: profileData.phone,
          role: profileData.role,
          gender: profileData.gender,
          dob: profileData.dob,
          bio: profileData.bio,
          createdAt: profileData.createdAt,
        };
        console.log("User data:", userData);

        // Lưu role và thông tin user
        localStorage.setItem("userRole", userData.role);
        localStorage.setItem("userData", JSON.stringify(userData));

        showSuccessToast("Đăng nhập thành công!");

        // Chuyển hướng dựa vào role
        if (userData.role === "ADMIN") {
          window.location.href = "/room";
        } else {
          window.location.href = "/room";
        }
      } else {
        throw new Error(profileData.message || "Không tìm thấy thông tin user");
      }
    } catch (err) {
      console.error("Login failed:", err);
      setError(err.message || "Sai tài khoản hoặc mật khẩu");
      showErrorToast(err.message || "Đăng nhập thất bại!");
    }
  };

  return (
    <div className="login-wrapper">
      {/* Video nền động */}
      <video autoPlay muted loop id="bg-video">
        <source src={building} type="video/mp4" />
        Trình duyệt của bạn không hỗ trợ video.
      </video>

      {/* Overlay tối nhẹ trên video */}
      <div className="video-overlay"></div>

      {/* Nội dung chính */}
      <div className="login-container">
        <div className="login-box">
          <div className="login-image">
            <img src={logo} className="logo" alt="Modern Apartment" />
            <div className="overlay">
              <h1>RoomieGo</h1>
            </div>
          </div>
          <div className="login-form">
            {forgotPassword ? (
              <>
                <h2>Quên mật khẩu</h2>
                <form onSubmit={forgotPassword}>
                  <div className="form-group">
                    <label>Nhập email của bạn</label>
                    <input
                      type="email"
                      placeholder="Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <button type="submit" className="login-btn">
                    Gửi yêu cầu
                  </button>
                </form>
                <button className="back-btn" onClick={() => setForgotPassword(false)}>
                  Quay lại đăng nhập
                </button>
              </>
            ) : (
              <>
                <h2>Đăng nhập tài khoản</h2>
                {error && <p className="error-message">{error}</p>}
                <form onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label>Tên đăng nhập</label>
                    <input
                      type="email"
                      placeholder="Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group password-wrapper">
                    <label>Mật khẩu</label>
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Pass"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <i
                      className="toggle-password fas fa-eye"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{ cursor: "pointer" }}
                    ></i>
                  </div>
                  <div className="forgot-password">
                    <a href="#quenmatkhau" onClick={() => setForgotPassword(true)}>
                      Quên mật khẩu?
                    </a>
                  </div>
                  <button type="submit" className="login-btn">
                    Đăng nhập
                  </button>
                </form>
                <div className="create-account">
                  <button onClick={() => navigate("/Register")}>Đăng ký tài khoản</button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
