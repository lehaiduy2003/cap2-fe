import { useState } from 'react';
import '../styles/Register.css';
import { useNavigate, Link } from 'react-router-dom';
import {
    User,
    Mail,
    Lock,
    Eye,
    EyeOff,
    Phone,
    Calendar,
    Users,
    FileText,
} from 'lucide-react';
import { showSuccessToast } from '../components/toast';
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
    const [confirmPassword, setConfirmPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [gender, setGender] = useState('');
    const [dob, setDob] = useState('');
    const [bio, setBio] = useState('');
    const [role, setRole] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [acceptTerms, setAcceptTerms] = useState(false);

    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();

        if (!acceptTerms) {
            setError('Vui lòng chấp nhận điều khoản và điều kiện.');
            return;
        }

        if (password !== confirmPassword) {
            setError('Mật khẩu xác nhận không khớp.');
            return;
        }

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
            setConfirmPassword('');
            setFullName('');
            setPhone('');
            setGender('');
            setDob('');
            setBio('');
            setRole('');
            setAcceptTerms(false);

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
        <div className='register-page'>
            <div className='register-container'>
                <div className='register-card'>
                    <div className='register-header'>
                        <h1 className='register-title'>
                            Đăng Ký Tài Khoản
                            <span className='title-underline'></span>
                        </h1>
                    </div>

                    {error && <div className='error-message'>{error}</div>}
                    {success && (
                        <div className='success-message'>{success}</div>
                    )}

                    <form onSubmit={handleRegister} className='register-form'>
                        <div className='input-group'>
                            <User className='input-icon' />
                            <input
                                type='text'
                                placeholder='Nhập họ và tên'
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                required
                            />
                        </div>

                        <div className='input-group'>
                            <Mail className='input-icon' />
                            <input
                                type='email'
                                placeholder='Nhập địa chỉ email'
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div className='input-group'>
                            <Lock className='input-icon' />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                placeholder='Tạo mật khẩu'
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <button
                                type='button'
                                className='password-toggle'
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? (
                                    <EyeOff size={16} />
                                ) : (
                                    <Eye size={16} />
                                )}
                            </button>
                        </div>

                        <div className='input-group'>
                            <Lock className='input-icon' />
                            <input
                                type={showConfirmPassword ? 'text' : 'password'}
                                placeholder='Xác nhận mật khẩu'
                                value={confirmPassword}
                                onChange={(e) =>
                                    setConfirmPassword(e.target.value)
                                }
                                required
                            />
                            <button
                                type='button'
                                className='password-toggle'
                                onClick={() =>
                                    setShowConfirmPassword(!showConfirmPassword)
                                }
                            >
                                {showConfirmPassword ? (
                                    <EyeOff size={16} />
                                ) : (
                                    <Eye size={16} />
                                )}
                            </button>
                        </div>

                        <div className='input-row'>
                            <div className='input-group'>
                                <Phone className='input-icon' />
                                <input
                                    type='text'
                                    placeholder='Số điện thoại'
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    required
                                />
                            </div>

                            <div className='input-group'>
                                <Calendar className='input-icon' />
                                <input
                                    type='date'
                                    value={dob}
                                    onChange={(e) => setDob(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className='input-row'>
                            <div className='input-group'>
                                <Users className='input-icon' />
                                <select
                                    value={gender}
                                    onChange={(e) => setGender(e.target.value)}
                                    required
                                >
                                    <option value=''>Chọn giới tính</option>
                                    {genderOptions.map((option) => (
                                        <option
                                            key={option.value}
                                            value={option.value}
                                        >
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className='input-group'>
                                <FileText className='input-icon' />
                                <select
                                    value={role}
                                    onChange={(e) => setRole(e.target.value)}
                                    required
                                >
                                    <option value=''>Chọn vai trò</option>
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
                        </div>

                        <div className='input-group'>
                            <textarea
                                placeholder='Giới thiệu bản thân (tùy chọn)'
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                rows={3}
                            />
                        </div>

                        <div className='checkbox-group'>
                            <input
                                type='checkbox'
                                id='terms'
                                checked={acceptTerms}
                                onChange={(e) =>
                                    setAcceptTerms(e.target.checked)
                                }
                                required
                            />
                            <label htmlFor='terms'>
                                Tôi đồng ý với tất cả điều khoản và điều kiện
                            </label>
                        </div>

                        <button type='submit' className='register-btn'>
                            Đăng ký ngay
                        </button>
                    </form>

                    <div className='login-link'>
                        <span>Đã có tài khoản? </span>
                        <Link to='/login'>Đăng nhập ngay</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
