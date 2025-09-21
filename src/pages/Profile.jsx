import { useEffect, useState } from "react";
import "../styles/Profile.css";
import user2 from "../assets/user2.png";
import { BASE_API_URL } from "../constants";

const Profile = () => {
  const [profile, setProfile] = useState(null);
  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("authToken");
      if (!token) {
        console.error("Không có token");
        return;
      }

      try {
        const response = await fetch(`${BASE_API_URL}/renterowner/get-profile`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log("Profile fetched:", result.user);
        setProfile(result.user); // CHỈ LẤY PHẦN user
      } catch (error) {
        console.error("Không lấy được profile:", error);
      }
    };

    fetchProfile(); // goi ham fetchProfile
  }, []);

  return (
    <div className="account-settings-page">
      <div className="account-settings-wrapper">
        {/* Sidebar */}
        <div className="account-sidebar">
          <img src="https://via.placeholder.com/100" alt="Avatar" />
          <h3>{profile ? profile.fullName : "Đang tải..."}</h3>
          <ul>
            <li className="active">Tài Khoản</li>
          </ul>
        </div>

        {/* Content */}
        <div className="account-content">
          <img src={user2} alt="" />
          <h2>Hồ Sơ</h2>
          {profile ? (
            <form className="form_profile">
              <div className="form-group half">
                <label>Tên đầy đủ </label>
                <input type="text" value={profile.fullName} />
              </div>

              <div className="form-group half">
                <label>Email</label>
                <input type="email" value={profile.email} />
              </div>

              <div className="form-group half">
                <label>Số điện thoại</label>
                <input type="text" value={profile.phone} />
              </div>

              <div className="form-group half">
                <label>Giới tính</label>
                <input type="text" value={profile.gender == "FEMALE" ? "Nữ" : "Nam"} />
              </div>

              <div className="form-group half">
                <label>Bio</label>
                <textarea value={profile.bio} />
              </div>

              <div className="buttons">
                <button type="submit">Cập Nhật</button>
                <button className="button-cancel" type="button">
                  Hủy
                </button>
              </div>
            </form>
          ) : (
            <p>Đang tải hồ sơ ...</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
