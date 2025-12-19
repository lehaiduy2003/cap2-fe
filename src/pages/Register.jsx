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
    CheckCircle2,
} from 'lucide-react';
import { showSuccessToast } from '../components/toast';
import { BASE_API_URL } from '../constants';

export default function Register() {
    // 1. Unified State Management
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        fullName: '',
        phone: '',
        gender: '',
        dob: '',
        bio: '',
        role: '',
        // acceptTerms: false
    });

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const navigate = useNavigate();

    // 2. Generic Handle Change
    const handleChange = (e) => {
        const { id, name, value, type, checked } = e.target;
        const fieldName = name || id;
        const fieldValue = type === 'checkbox' ? checked : value;

        setFormData((prev) => ({
            ...prev,
            [fieldName]: fieldValue,
        }));

        if (error) setError('');
    };

    // 3. Updated Handle Register
    const handleRegister = async (e) => {
        e.preventDefault();

        const {
            email,
            password,
            confirmPassword,
            fullName,
            phone,
            gender,
            dob,
            bio,
            role,
        } = formData;

        // --- VALIDATION SECTION ---
        // if (!acceptTerms) {
        //     setError('Vui lòng chấp nhận điều khoản và điều kiện.');
        //     return;
        // }

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

        setLoading(true);

        try {
            // Chuẩn hóa payload cho Backend
            const payload = {
                // Backend dùng username, email, phone, role...
                // Map đúng theo UserDto
                username: email, // Fallback: dùng email làm username
                email: email,
                password: password,
                fullName: fullName,
                phone: phone,
                gender: gender, // MALE, FEMALE...
                role: role, // OWNER, RENTER...
                dob: dob,
                more: bio, // Backend dùng field 'more' cho bio/description
                avatarUrl: 'https://randomuser.me/api/portraits/lego/1.jpg',
            };

            // FIX QUAN TRỌNG: Endpoint đúng là /auth/register
            const response = await fetch(`${BASE_API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            // Parse JSON an toàn hơn để tránh lỗi "Unexpected end of JSON input"
            let result;
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.indexOf('application/json') !== -1) {
                result = await response.json();
            } else {
                // Nếu không phải JSON (thường là lỗi html từ server), lấy text để debug
                const text = await response.text();
                throw new Error(text || `Lỗi server (${response.status})`);
            }

            if (!response.ok) {
                throw new Error(
                    result.message || result.error || 'Đăng ký thất bại',
                );
            }

            console.log('Đăng ký thành công:', result);
            setSuccess('Đăng ký thành công! Vui lòng đăng nhập.');
            setError('');
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
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className='register-container min-h-screen bg-base-200 flex items-center justify-center p-4'>
            <div className='register-card bg-base-100 shadow-2xl rounded-3xl w-full max-w-2xl overflow-hidden border border-base-300'>
                <div className='p-8 sm:p-12'>
                    {/* Header */}
                    <div className='text-center mb-10'>
                        <h2 className='text-3xl font-black text-primary mb-2 uppercase tracking-tight'>
                            Tham Gia Ngay
                        </h2>
                        <p className='text-base-content/60 font-medium'>
                            Bắt đầu trải nghiệm dịch vụ của chúng tôi
                        </p>
                    </div>

                    {/* Error / Success Messages */}
                    {error && (
                        <div className='alert alert-error mb-6 shadow-lg animate-pulse'>
                            <svg
                                xmlns='http://www.w3.org/2000/svg'
                                className='stroke-current shrink-0 h-6 w-6'
                                fill='none'
                                viewBox='0 0 24 24'
                            >
                                <path
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                    strokeWidth='2'
                                    d='M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z'
                                />
                            </svg>
                            <span>{error}</span>
                        </div>
                    )}
                    {success && (
                        <div className='alert alert-success mb-6 shadow-lg'>
                            <svg
                                xmlns='http://www.w3.org/2000/svg'
                                className='stroke-current shrink-0 h-6 w-6'
                                fill='none'
                                viewBox='0 0 24 24'
                            >
                                <path
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                    strokeWidth='2'
                                    d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
                                />
                            </svg>
                            <span>{success}</span>
                        </div>
                    )}

                    <form
                        onSubmit={handleRegister}
                        className='grid grid-cols-1 md:grid-cols-2 gap-6'
                    >
                        {/* Full Name */}
                        <div className='form-control group'>
                            <label className='label font-bold text-xs uppercase opacity-70'>
                                Họ và tên
                            </label>
                            <div className='relative'>
                                <User className='absolute left-3 top-1/2 -translate-y-1/2 size-5 opacity-40 group-focus-within:text-primary group-focus-within:opacity-100 transition-all' />
                                <input
                                    type='text'
                                    name='fullName'
                                    placeholder='Nguyễn Văn A'
                                    className='input input-bordered w-full pl-10 focus:ring-2 focus:ring-primary/20'
                                    value={formData.fullName}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div className='form-control group'>
                            <label className='label font-bold text-xs uppercase opacity-70'>
                                Email
                            </label>
                            <div className='relative'>
                                <Mail className='absolute left-3 top-1/2 -translate-y-1/2 size-5 opacity-40 group-focus-within:text-primary group-focus-within:opacity-100 transition-all' />
                                <input
                                    type='email'
                                    name='email'
                                    placeholder='name@example.com'
                                    className='input input-bordered w-full pl-10 focus:ring-2 focus:ring-primary/20'
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        {/* Phone */}
                        <div className='form-control group'>
                            <label className='label font-bold text-xs uppercase opacity-70'>
                                Số điện thoại
                            </label>
                            <div className='relative'>
                                <Phone className='absolute left-3 top-1/2 -translate-y-1/2 size-5 opacity-40 group-focus-within:text-primary group-focus-within:opacity-100 transition-all' />
                                <input
                                    type='tel'
                                    name='phone'
                                    placeholder='09xxx'
                                    className='input input-bordered w-full pl-10 focus:ring-2 focus:ring-primary/20'
                                    value={formData.phone}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        {/* DOB */}
                        <div className='form-control group'>
                            <label className='label font-bold text-xs uppercase opacity-70'>
                                Ngày sinh
                            </label>
                            <div className='relative'>
                                <Calendar className='absolute left-3 top-1/2 -translate-y-1/2 size-5 opacity-40 group-focus-within:text-primary group-focus-within:opacity-100 transition-all' />
                                <input
                                    type='date'
                                    name='dob'
                                    className='input input-bordered w-full pl-10 focus:ring-2 focus:ring-primary/20'
                                    value={formData.dob}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        {/* Gender Select */}
                        <div className='form-control group'>
                            <label className='label font-bold text-xs uppercase opacity-70'>
                                Giới tính
                            </label>
                            <div className='relative'>
                                <Users className='absolute left-3 top-1/2 -translate-y-1/2 size-5 opacity-40 group-focus-within:text-primary transition-all' />
                                <select
                                    name='gender'
                                    className='select select-bordered w-full pl-10 focus:ring-2 focus:ring-primary/20'
                                    value={formData.gender}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value=''>Chọn giới tính</option>
                                    <option value='MALE'>Nam</option>
                                    <option value='FEMALE'>Nữ</option>
                                    <option value='OTHER'>Khác</option>
                                </select>
                            </div>
                        </div>

                        {/* Role Select */}
                        <div className='form-control group'>
                            <label className='label font-bold text-xs uppercase opacity-70'>
                                Vai trò
                            </label>
                            <div className='relative'>
                                <CheckCircle2 className='absolute left-3 top-1/2 -translate-y-1/2 size-5 opacity-40 group-focus-within:text-primary transition-all' />
                                <select
                                    name='role'
                                    className='select select-bordered w-full pl-10 focus:ring-2 focus:ring-primary/20'
                                    value={formData.role}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value=''>Bạn là ai?</option>
                                    <option value='OWNER'>
                                        Người Cho Thuê
                                    </option>
                                    <option value='RENTER'>Người Thuê</option>
                                </select>
                            </div>
                        </div>

                        {/* Password */}
                        <div className='form-control group col-span-full md:col-span-1'>
                            <label className='label font-bold text-xs uppercase opacity-70'>
                                Mật khẩu
                            </label>
                            <div className='relative'>
                                <Lock className='absolute left-3 top-1/2 -translate-y-1/2 size-5 opacity-40 group-focus-within:text-primary transition-all' />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name='password'
                                    className='input input-bordered w-full pl-10 pr-10'
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                />
                                <button
                                    type='button'
                                    className='absolute right-3 top-1/2 -translate-y-1/2 text-base-content/50 hover:text-primary'
                                    onClick={() =>
                                        setShowPassword(!showPassword)
                                    }
                                >
                                    {showPassword ? (
                                        <EyeOff size={18} />
                                    ) : (
                                        <Eye size={18} />
                                    )}
                                </button>
                            </div>
                            {/* Password Strength indicator bar */}
                            <div className='mt-2 flex gap-1 px-1 h-1'>
                                <div
                                    className={`flex-1 rounded-full transition-all duration-300 ${formData.password.length > 0 ? (formData.password.length < 6 ? 'bg-error' : 'bg-primary') : 'bg-base-300'}`}
                                ></div>
                                <div
                                    className={`flex-1 rounded-full transition-all duration-300 ${formData.password.length >= 8 ? 'bg-primary' : 'bg-base-300'}`}
                                ></div>
                                <div
                                    className={`flex-1 rounded-full transition-all duration-300 ${formData.password.length >= 12 ? 'bg-primary' : 'bg-base-300'}`}
                                ></div>
                            </div>
                        </div>

                        {/* Confirm Password */}
                        <div className='form-control group col-span-full md:col-span-1'>
                            <label className='label font-bold text-xs uppercase opacity-70'>
                                Xác nhận mật khẩu
                            </label>
                            <div className='relative'>
                                <Lock className='absolute left-3 top-1/2 -translate-y-1/2 size-5 opacity-40 group-focus-within:text-primary transition-all' />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name='confirmPassword'
                                    className='input input-bordered w-full pl-10'
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        {/* Bio */}
                        <div className='form-control col-span-full group'>
                            <label className='label font-bold text-xs uppercase opacity-70'>
                                Giới thiệu
                            </label>
                            <textarea
                                name='bio'
                                placeholder='Kể một chút về bản thân bạn...'
                                className='textarea textarea-bordered w-full focus:ring-2 focus:ring-primary/20 h-24'
                                value={formData.bio}
                                onChange={handleChange}
                            />
                        </div>

                        {/* Terms */}
                        {/* <div className='col-span-full'>
                            <label className='label cursor-pointer justify-start gap-3 select-none'>
                                <input
                                    type='checkbox' name='acceptTerms'
                                    checked={formData.acceptTerms} onChange={handleChange}
                                    className='checkbox checkbox-primary checkbox-sm' required
                                />
                                <span className='label-text font-medium'>Tôi đồng ý với các điều khoản dịch vụ</span>
                            </label>
                        </div> */}

                        {/* Submit Button */}
                        <div className='col-span-full pt-4'>
                            <button
                                type='submit'
                                className={`btn btn-primary w-full shadow-xl shadow-primary/20 text-lg 
                                    ${loading ? 'loading' : ''} active:scale-95 transition-all`}
                                disabled={loading}
                            >
                                {loading
                                    ? 'Đang xử lý...'
                                    : 'Tạo Tài Khoản Ngay'}
                            </button>
                        </div>
                    </form>

                    <div className='text-center mt-8'>
                        <span className='text-base-content/60 font-medium'>
                            Đã có tài khoản?{' '}
                        </span>
                        <Link
                            to='/login'
                            className='link link-primary font-bold no-underline hover:underline'
                        >
                            Đăng nhập
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
