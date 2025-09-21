import { useState } from "react";
import "../App.css";

export default function CreateAccount() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    country: "",
    username: "",
    password: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Dữ liệu người dùng:", formData);
  };

  return (
    <div className="create-account-container">
      <div className="create-account-box">
        {/* Hình ảnh bên trái */}
        <div
          className="create-account-image"
          style={{ backgroundImage: "url('https://www.obieworld.com/wp-content/uploads/2022/12/nha-tro.jpg')" }}
        >
          <div className="create-account-overlay">RoomieGo</div>
        </div>

        {/* Form bên phải */}
        <div className="create-account-form">
          <h2>Đăng ký</h2>
          <form onSubmit={handleSubmit}>
            <InputField label="Tên" id="name" value={formData.name} onChange={handleChange} />
            <InputField label="E-mail" id="email" type="email" value={formData.email} onChange={handleChange} />
            <InputField label="Số điện thoại" id="phone" value={formData.phone} onChange={handleChange} />
            <InputField label="Quốc gia" id="country" value={formData.country} onChange={handleChange} />
            <InputField label="Tên đăng nhập" id="username" value={formData.username} onChange={handleChange} />
            <InputField label="Mật khẩu" id="password" type="password" value={formData.password} onChange={handleChange} />

            <div className="terms">
              Khi đăng ký, bạn đồng ý với <a href="#">điều khoản và điều kiện</a> của Zoho.
            </div>

            <button type="submit" className="register-btn">
              Đăng ký
            </button>
          </form>

          <div className="login-link">
            <a href="#">Đăng nhập</a>
          </div>
        </div>
      </div>
    </div>
  );
}

// Component Input Field tái sử dụng
function InputField({ label, id, type = "text", value, onChange }) {
  return (
    <div className="input-group">
      <label htmlFor={id}>{label}</label>
      <input
        type={type}
        id={id}
        value={value}
        onChange={onChange}
        placeholder={`Nhập ${label.toLowerCase()}`}
      />
    </div>
  );
}
