import { useState } from "react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    // Gửi email đặt lại mật khẩu (API request)
    setMessage("Nếu email tồn tại, chúng tôi đã gửi hướng dẫn đặt lại mật khẩu.");
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg w-96">
        <h2 className="text-2xl font-bold mb-4 text-center">Quên mật khẩu</h2>
        {message && <p className="text-green-600 text-sm text-center">{message}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Nhập email của bạn"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="w-full py-2 bg-blue-500 text-white font-bold rounded-md hover:bg-blue-600">
            Gửi yêu cầu
          </button>
        </form>
      </div>
    </div>
  );
}
