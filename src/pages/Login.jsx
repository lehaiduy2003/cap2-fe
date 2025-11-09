import { useState } from 'react';
import '../styles/Login.css';
import { Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { showErrorToast, showSuccessToast } from '../components/toast';
import { BASE_API_URL } from '../constants';

export default function Login() {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [rememberMe, setRememberMe] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (email.trim() === '' || password.length < 6) {
            setError(
                'Username không được để trống và mật khẩu phải có ít nhất 6 ký tự.',
            );
            return;
        }

        try {
            let data = {
                email: email,
                password: password,
            };
            console.log('Dữ liệu gửi đến API:', data);
            const response = await fetch(`${BASE_API_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Đăng nhập thất bại.');
            }

            const responseData = await response.json();
            console.log('Response data:', responseData);

            if (!responseData.token) {
                throw new Error('Token không tồn tại trong response');
            }

            // Lưu token
            localStorage.setItem('authToken', responseData.token);
            localStorage.setItem('Email', email);
            localStorage.setItem('chat-username', email);
            localStorage.setItem('authUser', JSON.stringify(responseData));

            // Lấy thông tin user từ API profile
            const profileResponse = await fetch(
                `${BASE_API_URL}/renterowner/get-profile`,
                {
                    headers: {
                        Authorization: `Bearer ${responseData.token}`,
                    },
                },
            );

            if (!profileResponse.ok) {
                throw new Error('Không thể lấy thông tin user');
            }

            const profileData = await profileResponse.json();
            console.log('Profile data:', profileData);

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
                console.log('User data:', userData);

                // Lưu role và thông tin user
                localStorage.setItem('userRole', userData.role);
                localStorage.setItem('userData', JSON.stringify(userData));

                showSuccessToast('Đăng nhập thành công!');

                // Chuyển hướng dựa vào role
                if (userData.role === 'ADMIN') {
                    window.location.href = '/room';
                } else {
                    window.location.href = '/room';
                }
            } else {
                throw new Error(
                    profileData.message || 'Không tìm thấy thông tin user',
                );
            }
        } catch (err) {
            console.error('Login failed:', err);
            setError(err.message || 'Sai tài khoản hoặc mật khẩu');
            showErrorToast(err.message || 'Đăng nhập thất bại!');
        }
    };

    return (
        <div className='login-page'>
            <div className='login-container'>
                <div className='login-card'>
                    <div className='login-header'>
                        <h1 className='login-title'>
                            Login
                            <span className='title-underline'></span>
                        </h1>
                    </div>

                    {error && <div className='error-message'>{error}</div>}

                    <form onSubmit={handleSubmit} className='login-form'>
                        <div className='input-group'>
                            <Mail className='input-icon' />
                            <input
                                type='email'
                                placeholder='Enter your email'
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div className='input-group'>
                            <Lock className='input-icon' />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                placeholder='Confirm a password'
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

                        <div className='options-row'>
                            <div className='remember-me'>
                                <input
                                    type='checkbox'
                                    id='remember'
                                    checked={rememberMe}
                                    onChange={(e) =>
                                        setRememberMe(e.target.checked)
                                    }
                                />
                                <label htmlFor='remember'>Remember me</label>
                            </div>
                            <div className='forgot-password'>
                                <Link to='/forgot-password'>
                                    Forgot password?
                                </Link>
                            </div>
                        </div>

                        <button type='submit' className='login-btn'>
                            Login Now
                        </button>
                    </form>

                    <div className='signup-link'>
                        <span>Don&apos;t have an account? </span>
                        <Link to='/register'>Signup now</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
