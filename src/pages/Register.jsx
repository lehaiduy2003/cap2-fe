import { useState } from 'react';
import '../styles/Login.css';
import '../styles/Register.css';
import { useNavigate } from 'react-router-dom';
import bulding from '../assets/4k_building.mp4'; // Import icon nếu cần
import { showSuccessToast } from '../components/toast'; // Import toast thông báo
import { BASE_API_URL } from '../constants';

export default function Register() {
    const genderOptions = [
        { value: 'MALE', label: 'Nam' },
        { value: 'FEMALE', label: 'Nữ' },
    ];

    const roleOptions = [
        { value: 'OWNER', label: 'Người Cho Thuê' },
        { value: 'RENTER', label: 'Người Thuê' },
    ];

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [gender, setGender] = useState('');
    const [dob, setDob] = useState('');
    const [bio, setBio] = useState('');
    const [role, setRole] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        const phoneRegex = /^[0-9]{10,}$/;
        if (!phoneRegex.test(phone)) {
            setError(
                'Số điện thoại không hợp lệ. Vui lòng nhập ít nhất 10 chữ số.',
            );
            return;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setError('Email không hợp lệ. Vui lòng nhập đúng định dạng.');
            return;
        }

        if (password.length < 6 || email.trim() === '') {
            setError(
                'Vui lòng nhập đầy đủ thông tin và mật khẩu phải có ít nhất 6 ký tự.',
            );
            return;
        }

        const strongPasswordRegex =
            /^(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>]).+$/;
        if (!strongPasswordRegex.test(password)) {
            setError(
                'Mật khẩu phải chứa ít nhất một chữ hoa và một ký tự đặc biệt.',
            );
            return;
        }
        const today = new Date();
        const birthDate = new Date(dob);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (
            monthDiff < 0 ||
            (monthDiff === 0 && today.getDate() < birthDate.getDate())
        ) {
            age--;
        }
        if (age < 18) {
            setError('Bạn phải đủ 18 tuổi để đăng ký.');
            return;
        }

        try {
            const data = {
                email,
                role,
                gender,
                fullName,
                password,
                phone,
                bio,
                dob,
            };

            const response = await fetch(`${BASE_API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Đăng ký thất bại');
            }

            const result = await response.json();
            console.log('Đăng ký thành công:', result);
            setSuccess('Đăng ký thành công! Vui lòng đăng nhập.');
            setError('');
            setEmail('');
            setPassword('');
            setFullName('');
            setPhone('');
            setGender('');
            setDob('');
            setBio('');
            setRole('');

            showSuccessToast('Đăng ký thành công!');

            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } catch (err) {
            console.error('Lỗi khi đăng ký:', err);
            setError(
                err.message ||
                    'Không thể kết nối đến máy chủ. Vui lòng thử lại.',
            );
            setSuccess('');
        }
    };

    return (
        <div className='login-wrapper'>
            <video autoPlay muted loop id='bg-video'>
                <source src={bulding} type='video/mp4' />
                Trình duyệt của bạn không hỗ trợ video.
            </video>

            <div className='video-overlay'></div>

            <div className='register-container'>
                <div className='register-box'>
                    <div className='login-image'>
                        <img
                            src='https://storage.googleapis.com/a1aa/image/pIX598hLKNAAlo-PMfaRY2XfJQXo-I6fQbAqm6H-2T4.jpg'
                            alt='Modern Apartment'
                        />
                        <div className='overlay'>
                            <h1>RoomieGo</h1>
                        </div>
                    </div>
                    <div className='login-form'>
                        <h2>Đăng ký tài khoản</h2>
                        {error && <p className='error-message'>{error}</p>}
                        {success && (
                            <p className='success-message'>{success}</p>
                        )}
                        <form onSubmit={handleRegister}>
                            <div className='form-row'>
                                <div className='form-group'>
                                    <label>Họ và tên</label>
                                    <input
                                        type='text'
                                        placeholder='Full Name'
                                        value={fullName}
                                        onChange={(e) =>
                                            setFullName(e.target.value)
                                        }
                                        required
                                    />
                                </div>
                            </div>

                            <div className='form-row'>
                                <div className='form-group'>
                                    <label>Email</label>
                                    <input
                                        type='email'
                                        placeholder='Email'
                                        value={email}
                                        onChange={(e) =>
                                            setEmail(e.target.value)
                                        }
                                        required
                                    />
                                </div>
                                <div className='form-group'>
                                    <label>Mật khẩu</label>
                                    <input
                                        type='password'
                                        placeholder='Password'
                                        value={password}
                                        onChange={(e) =>
                                            setPassword(e.target.value)
                                        }
                                        required
                                    />
                                    <small
                                        style={{
                                            color: 'white',
                                            fontSize: '12px',
                                        }}
                                    >
                                        Mật khẩu cần ít nhất 6 ký tự, bao gồm 1
                                        chữ hoa và 1 ký tự đặc biệt.
                                    </small>
                                </div>
                            </div>

                            <div className='form-row'>
                                <div className='form-group'>
                                    <label>Ngày sinh</label>
                                    <input
                                        type='date'
                                        value={dob}
                                        onChange={(e) => setDob(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className='form-group'>
                                    <label>Giới tính</label>
                                    <select
                                        value={gender}
                                        onChange={(e) =>
                                            setGender(e.target.value)
                                        }
                                        required
                                        style={{
                                            color: '#000',
                                            backgroundColor: '#fff',
                                            border: '1px solid #ccc',
                                            padding: '8px',
                                            borderRadius: '4px',
                                            fontSize: '14px',
                                        }}
                                    >
                                        <option value=''>
                                            -- Chon gioi tinh --
                                        </option>
                                        {genderOptions.map((optionGender) => (
                                            <option
                                                key={optionGender.value}
                                                value={optionGender.value}
                                            >
                                                {optionGender.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className='form-row'>
                                <div className='form-group'>
                                    <label>Vai trò</label>
                                    <select
                                        value={role}
                                        onChange={(e) =>
                                            setRole(e.target.value)
                                        }
                                        required
                                        style={{
                                            color: '#000',
                                            backgroundColor: '#fff',
                                            border: '1px solid #ccc',
                                            padding: '8px',
                                            borderRadius: '4px',
                                            fontSize: '14px',
                                        }}
                                    >
                                        <option value=''>
                                            -- Chọn vai trò --
                                        </option>
                                        {roleOptions.map((option) => (
                                            <option
                                                key={option.value}
                                                value={option.value}
                                            >
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className='form-group'>
                                    <label>Số điện thoại</label>
                                    <input
                                        type='text'
                                        maxLength='10'
                                        placeholder='Phone Number'
                                        value={phone}
                                        onChange={(e) =>
                                            setPhone(e.target.value)
                                        }
                                        pattern='[0-9]*'
                                        title='Số điện thoại chỉ được chứa các chữ số.'
                                        required
                                    />
                                </div>
                            </div>

                            <div className='form-row'>
                                <div className='form-group' style={{ flex: 1 }}>
                                    <label>Tiểu sử</label>
                                    <textarea
                                        placeholder='Bio'
                                        value={bio}
                                        onChange={(e) => setBio(e.target.value)}
                                        required
                                        style={{
                                            color: '#000',
                                            backgroundColor: '#fff',
                                            border: '1px solid #ccc',
                                            padding: '8px',
                                            borderRadius: '4px',
                                            fontSize: '14px',
                                            width: '100%',
                                        }}
                                    />
                                </div>
                            </div>

                            <button type='submit' className='regis-btn'>
                                Đăng ký
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
