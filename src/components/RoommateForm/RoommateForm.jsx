//import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Select from 'react-select';
import { getProvinces, getDistricts } from 'sub-vn';
import { BASE_API_URL } from '../../constants';

// Assets
import minimal from '../../assets/minimal.jpg';
import openly from '../../assets/openly.jpg';
import warm from '../../assets/clean&warm.jpg';
import friend_video from '../../assets/4k_building.mp4';
import { useMemo, useState } from 'react';

// --- UI COMPONENTS (Clean Code: Tách nhỏ để dễ quản lý UI) ---

// Custom style cho React-Select để đồng bộ với Tailwind
const customSelectStyles = {
    control: (base, state) => ({
        ...base,
        background: 'rgba(255, 255, 255, 0.5)',
        borderColor: state.isFocused ? '#3b82f6' : '#d1d5db',
        borderRadius: '0.5rem',
        padding: '2px',
        boxShadow: state.isFocused
            ? '0 0 0 2px rgba(59, 130, 246, 0.2)'
            : 'none',
        '&:hover': { borderColor: '#3b82f6' },
    }),
    menu: (base) => ({
        ...base,
        borderRadius: '0.5rem',
        marginTop: '4px',
        backdropFilter: 'blur(10px)',
        background: 'rgba(255, 255, 255, 0.95)',
    }),
    option: (base, state) => ({
        ...base,
        backgroundColor: state.isSelected
            ? '#3b82f6'
            : state.isFocused
              ? '#eff6ff'
              : 'transparent',
        color: state.isSelected ? 'white' : '#1f2937',
        cursor: 'pointer',
    }),
};

const FormLabel = ({ children, required }) => (
    <label className='block text-sm font-medium text-gray-800 mb-1.5 ml-1'>
        {children} {required && <span className='text-red-500'>*</span>}
    </label>
);

const FormError = ({ message }) =>
    message ? (
        <p className='mt-1 text-xs text-red-600 font-semibold animate-pulse ml-1'>
            {message}
        </p>
    ) : null;

const StepIndicator = ({ currentStep }) => {
    const steps = [
        { id: 1, label: 'Thông tin' },
        { id: 2, label: 'Khu vực' },
        { id: 3, label: 'Sở thích' },
    ];

    return (
        <div className='flex justify-between items-center w-full max-w-lg mb-8 relative z-10 px-4'>
            {steps.map((s) => (
                <div
                    key={s.id}
                    className='flex flex-col items-center relative z-10'
                >
                    <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 border-2 
                        ${
                            currentStep >= s.id
                                ? 'bg-blue-600 text-white border-blue-600 shadow-lg scale-110'
                                : 'bg-white text-gray-400 border-gray-200'
                        }`}
                    ></div>
                    <span
                        className={`text-xs font-semibold mt-2 transition-colors duration-300 ${currentStep >= s.id ? 'text-blue-700' : 'text-gray-400'}`}
                    >
                        {s.label}
                    </span>
                </div>
            ))}
            {/* Connecting Line */}
            <div className='absolute top-5 left-0 w-full h-0.5 bg-gray-200 -z-10 px-10'>
                <div
                    className='h-full bg-blue-500 transition-all duration-500 ease-in-out'
                    style={{
                        width: `${((currentStep - 1) / (steps.length - 1)) * 100}%`,
                    }}
                ></div>
            </div>
        </div>
    );
};

// --- LOGIC COMPONENTS (Tách logic từng bước) ---

const StepOne = ({ formData, errors, handleChange, provincesOptions }) => (
    <div className='space-y-4 animate-fadeIn'>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
                <FormLabel required>Giới tính</FormLabel>
                <select
                    name='sex'
                    value={formData.sex}
                    onChange={handleChange}
                    className='w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white/50 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all'
                >
                    <option value='Nam'>Nam</option>
                    <option value='Nữ'>Nữ</option>
                </select>
            </div>
            <div>
                <FormLabel required>Năm sinh</FormLabel>
                <input
                    type='number'
                    name='dob'
                    min='1900'
                    placeholder='VD: 2000'
                    value={formData.dob}
                    onChange={handleChange}
                    className={`w-full px-4 py-2.5 rounded-lg border bg-white/50 focus:ring-2 outline-none transition-all ${errors.dob ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-500'}`}
                />
                <FormError message={errors.dob} />
            </div>
        </div>

        <div>
            <FormLabel required>Quê quán</FormLabel>
            <Select
                options={provincesOptions}
                value={provincesOptions.find(
                    (opt) => opt.value === formData.hometown,
                )}
                onChange={(selected) =>
                    handleChange({
                        target: {
                            name: 'hometown',
                            value: selected ? selected.value : '',
                        },
                    })
                }
                styles={customSelectStyles}
                placeholder='Chọn quê quán...'
            />
            <FormError message={errors.hometown} />
        </div>

        <div>
            <FormLabel required>Nghề nghiệp</FormLabel>
            <input
                type='text'
                name='job'
                value={formData.job}
                onChange={handleChange}
                placeholder='VD: Sinh viên, IT, Bác sĩ...'
                className={`w-full px-4 py-2.5 rounded-lg border bg-white/50 focus:ring-2 outline-none transition-all ${errors.job ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-500'}`}
            />
            <FormError message={errors.job} />
        </div>

        <div>
            <FormLabel required>Số điện thoại</FormLabel>
            <input
                type='tel'
                name='phone'
                value={formData.phone}
                onChange={handleChange}
                placeholder='0912345678'
                className={`w-full px-4 py-2.5 rounded-lg border bg-white/50 focus:ring-2 outline-none transition-all ${errors.phone ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-500'}`}
            />
            <FormError message={errors.phone} />
        </div>
    </div>
);

const StepTwo = ({
    formData,
    errors,
    setFormData,
    setErrors,
    provincesOptions,
}) => {
    // Optimization: Memoize districts calculation
    const districtsOptions = useMemo(() => {
        if (!formData.province) return [];
        // Find the province code from the province name
        const selectedProvince = getProvinces().find(
            (p) => p.name === formData.province,
        );
        if (!selectedProvince) return [];

        return getDistricts()
            .filter((d) => d.province_code === selectedProvince.code)
            .map((d) => ({ value: d.name, label: d.name }));
    }, [formData.province]);

    const handleProvinceChange = (selected) => {
        setFormData((prev) => ({
            ...prev,
            province: selected ? selected.value : '',
            provinceName: selected ? selected.label : '',
            district: '', // Reset district
        }));
        setErrors((prev) => ({ ...prev, province: '', district: '' }));
    };

    const handleDistrictChange = (selected) => {
        setFormData((prev) => ({
            ...prev,
            district: selected ? selected.value : '',
        }));
        setErrors((prev) => ({ ...prev, district: '' }));
    };

    return (
        <div className='space-y-6 animate-fadeIn'>
            <div>
                <FormLabel required>Tỉnh/Thành phố muốn tìm</FormLabel>
                <Select
                    options={provincesOptions}
                    value={provincesOptions.find(
                        (opt) => opt.value === formData.province,
                    )}
                    onChange={handleProvinceChange}
                    placeholder='Chọn tỉnh/thành phố...'
                    styles={customSelectStyles}
                    isClearable
                />
                <FormError message={errors.province} />
            </div>

            <div>
                <FormLabel required>Quận/Huyện muốn tìm</FormLabel>
                <Select
                    key={formData.province || 'no-province'} // Force render khi đổi province
                    options={districtsOptions}
                    value={districtsOptions.find(
                        (opt) => opt.value === formData.district,
                    )}
                    onChange={handleDistrictChange}
                    placeholder={
                        formData.province
                            ? 'Chọn quận/huyện...'
                            : 'Vui lòng chọn tỉnh/thành trước'
                    }
                    isDisabled={!formData.province}
                    styles={customSelectStyles}
                    isClearable
                />
                <FormError message={errors.district} />
            </div>
        </div>
    );
};

const StepThree = ({ formData, errors, handleChange }) => {
    const hobbiesList = [
        'Nuôi thú cưng',
        'Hút thuốc',
        'Ăn Chay',
        'Thức khuya',
        'Sạch sẽ',
    ];
    const roomTypes = [
        { value: '1', label: 'Tối giản', image: minimal },
        { value: '2', label: 'Ấm cúng', image: warm },
        { value: '3', label: 'Rộng rãi', image: openly },
    ];

    return (
        <div className='space-y-6 animate-fadeIn'>
            <div>
                <FormLabel required>Thói quen / Yêu cầu</FormLabel>
                <div className='grid grid-cols-2 md:grid-cols-3 gap-3'>
                    {hobbiesList.map((hobby) => (
                        <label
                            key={hobby}
                            className={`cursor-pointer border rounded-lg p-2 flex items-center justify-center transition-all ${formData.hobbies.includes(hobby) ? 'bg-blue-100 border-blue-500 text-blue-700' : 'bg-white/40 border-gray-300 hover:bg-white/60'}`}
                        >
                            <input
                                type='checkbox'
                                name='hobbies'
                                value={hobby}
                                checked={formData.hobbies.includes(hobby)}
                                onChange={handleChange}
                                className='hidden'
                            />
                            <span className='text-sm font-medium'>{hobby}</span>
                        </label>
                    ))}
                </div>
                <FormError message={errors.hobbies} />
            </div>

            <div>
                <FormLabel required>Phong cách phòng mong muốn</FormLabel>
                <div className='grid grid-cols-3 gap-4'>
                    {roomTypes.map((room) => (
                        <label
                            key={room.value}
                            className='cursor-pointer group relative'
                        >
                            <input
                                type='radio'
                                name='rateImage'
                                value={room.value}
                                checked={formData.rateImage === room.value}
                                onChange={handleChange}
                                className='hidden'
                            />
                            <div
                                className={`rounded-xl overflow-hidden border-2 transition-all duration-300 aspect-4/3 ${formData.rateImage === room.value ? 'border-blue-600 shadow-lg scale-105' : 'border-transparent opacity-70 group-hover:opacity-100'}`}
                            >
                                <img
                                    src={room.image}
                                    alt={room.label}
                                    className='w-full h-full object-cover'
                                />
                            </div>
                            <span
                                className={`block text-center text-xs mt-2 font-semibold ${formData.rateImage === room.value ? 'text-blue-600' : 'text-gray-600'}`}
                            >
                                {room.label}
                            </span>
                        </label>
                    ))}
                </div>
                <FormError message={errors.rateImage} />
            </div>

            <div>
                <FormLabel>Mô tả thêm về bản thân</FormLabel>
                <textarea
                    name='more'
                    rows='3'
                    maxLength='500'
                    value={formData.more}
                    onChange={handleChange}
                    placeholder='Ví dụ: Tôi thích không gian yên tĩnh, thường ngủ sớm...'
                    className='w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white/50 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none'
                />
            </div>
        </div>
    );
};

// --- MAIN COMPONENT ---

const RoommateForm = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false); // Feedback trạng thái loading

    // Memoize province options để tránh recalculate
    const provincesOptions = useMemo(
        () => getProvinces().map((p) => ({ value: p.name, label: p.name })),
        [],
    );

    const [formData, setFormData] = useState({
        sex: 'Nam',
        hometown: '',
        province: '',
        provinceName: '',
        city: '',
        district: '',
        phone: '',
        dob: '',
        job: '',
        hobbies: [],
        rateImage: '',
        more: '',
        userId: '',
    });

    const [errors, setErrors] = useState({});

    // Handler tổng quát sạch sẽ
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (type === 'checkbox') {
            setFormData((prev) => ({
                ...prev,
                hobbies: checked
                    ? [...prev.hobbies, value]
                    : prev.hobbies.filter((h) => h !== value),
            }));
        } else if (type === 'radio') {
            setFormData((prev) => ({ ...prev, rateImage: value }));
        } else {
            setFormData((prev) => ({ ...prev, [name]: value }));
        }
        // Clear error khi user thao tác lại
        if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
    };

    const validateStep = () => {
        const newErrors = {};
        if (step === 1) {
            if (!formData.hometown)
                newErrors.hometown = 'Vui lòng chọn quê quán';
            if (!formData.job.trim())
                newErrors.job = 'Vui lòng nhập nghề nghiệp';

            const dob = Number(formData.dob);
            const currentYear = new Date().getFullYear();
            if (!dob || dob < 1900 || dob > currentYear - 16) {
                // Thêm logic tuổi hợp lý (ít nhất 16)
                newErrors.dob = 'Năm sinh không hợp lệ';
            }

            if (!formData.phone.trim() || !/^\d{10}$/.test(formData.phone)) {
                newErrors.phone = 'SĐT phải gồm 10 chữ số';
            }
        } else if (step === 2) {
            if (!formData.province)
                newErrors.province = 'Vui lòng chọn tỉnh/thành phố';
            if (!formData.district)
                newErrors.district = 'Vui lòng chọn quận/huyện';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => {
        if (validateStep()) setStep((prev) => prev + 1);
    };

    const handleBack = () => setStep((prev) => prev - 1);

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Final validation
        const newErrors = {};
        if (formData.hobbies.length === 0)
            newErrors.hobbies = 'Chọn ít nhất một sở thích/thói quen';
        if (!formData.rateImage)
            newErrors.rateImage = 'Vui lòng chọn hình ảnh phòng';

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setIsSubmitting(true);

        try {
            const token = localStorage.getItem('authToken');
            if (!token) throw new Error('Vui lòng đăng nhập lại');

            // 1. Get User Profile
            const userRes = await fetch(
                `${BASE_API_URL}/renterowner/get-profile`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                },
            );

            if (!userRes.ok)
                throw new Error('Không thể lấy thông tin người dùng');
            const userData = await userRes.json();

            if (!userData || typeof userData.id !== 'number') {
                throw new Error('Dữ liệu người dùng không hợp lệ');
            }

            const payload = {
                hometown: formData.hometown,
                city: formData.provinceName,
                district: formData.district,
                yob: formData.dob,
                job: formData.job,
                phone: formData.phone,
                hobbies: formData.hobbies.join(', '),
                rateImage: formData.rateImage,
                more: formData.more, // SECURITY NOTE: Backend cần Sanitize field này để chống XSS
                userId: userData.id,
                gender: formData.sex === 'Nam' ? 'MALE' : 'FEMALE',
            };

            // 2. Submit Data
            const createRes = await fetch(`${BASE_API_URL}/api/roommates`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            if (!createRes.ok) {
                const errorData = await createRes.json();
                throw new Error(
                    errorData.message || 'Lỗi khi tạo hồ sơ tìm kiếm',
                );
            }

            // 3. Get Recommendations
            const recRes = await fetch(
                `${BASE_API_URL}/api/roommates/recommend/${userData.id}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                },
            );

            if (!recRes.ok) throw new Error('Không thể lấy danh sách gợi ý');

            const recData = await recRes.json();

            // Process Data
            const genderMapResponse = { MALE: 'Nam', FEMALE: 'Nữ' };
            const processedRecommendations = recData.data.map((rec) => ({
                ...rec,
                gender: genderMapResponse[rec.gender] || rec.gender,
                phone: rec.phone || formData.phone, // Fallback logic như code cũ
            }));

            navigate('/match', { state: { match: processedRecommendations } });
        } catch (err) {
            console.error('Submission Error:', err);
            // Có thể dùng thư viện toast ở đây thay vì alert
            alert(`Đã xảy ra lỗi: ${err.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className='relative min-h-screen flex items-center justify-center font-sans overflow-hidden'>
            {/* Background Video với Overlay */}
            <div className='fixed inset-0 z-0'>
                <div className='absolute inset-0 bg-blue-900/20 z-10'></div>{' '}
                {/* Overlay tối nhẹ */}
                <video
                    autoPlay
                    loop
                    muted
                    className='w-full h-full object-cover'
                >
                    <source src={friend_video} type='video/mp4' />
                </video>
            </div>

            {/* Main Content */}
            <div className='relative z-10 w-full max-w-2xl px-4 py-8 flex flex-col items-center'>
                <StepIndicator currentStep={step} />

                <div className='w-full bg-white/80 backdrop-blur-xl shadow-2xl rounded-3xl p-8 border border-white/50 animate-slideUp'>
                    <h2 className='text-2xl font-bold text-gray-800 text-center mb-6'>
                        {step === 1 && 'Thông tin cá nhân'}
                        {step === 2 && 'Khu vực mong muốn'}
                        {step === 3 && 'Sở thích & Lối sống'}
                    </h2>

                    <form onSubmit={handleSubmit}>
                        {step === 1 && (
                            <StepOne
                                formData={formData}
                                errors={errors}
                                handleChange={handleChange}
                                provincesOptions={provincesOptions}
                            />
                        )}
                        {step === 2 && (
                            <StepTwo
                                formData={formData}
                                errors={errors}
                                setFormData={setFormData}
                                setErrors={setErrors}
                                provincesOptions={provincesOptions}
                            />
                        )}
                        {step === 3 && (
                            <StepThree
                                formData={formData}
                                errors={errors}
                                handleChange={handleChange}
                            />
                        )}

                        {/* Navigation Buttons */}
                        <div className='flex justify-between mt-8 pt-4 border-t border-gray-200/50'>
                            {step > 1 ? (
                                <button
                                    type='button'
                                    onClick={handleBack}
                                    className='px-6 py-2.5 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition-all hover:-translate-x-1'
                                >
                                    Quay lại
                                </button>
                            ) : (
                                <div></div>
                            )}

                            {step < 3 ? (
                                <button
                                    type='button'
                                    onClick={handleNext}
                                    className='px-8 py-2.5 rounded-xl bg-linear-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-105 transition-all'
                                >
                                    Tiếp theo
                                </button>
                            ) : (
                                <button
                                    type='submit'
                                    disabled={isSubmitting}
                                    className='px-8 py-2.5 rounded-xl bg-linear-to-r from-green-500 to-emerald-600 text-white font-bold shadow-lg shadow-green-500/30 hover:shadow-green-500/50 hover:scale-105 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center'
                                >
                                    {isSubmitting ? (
                                        <>
                                            <svg
                                                className='animate-spin -ml-1 mr-3 h-5 w-5 text-white'
                                                xmlns='http://www.w3.org/2000/svg'
                                                fill='none'
                                                viewBox='0 0 24 24'
                                            >
                                                <circle
                                                    className='opacity-25'
                                                    cx='12'
                                                    cy='12'
                                                    r='10'
                                                    stroke='currentColor'
                                                    strokeWidth='4'
                                                ></circle>
                                                <path
                                                    className='opacity-75'
                                                    fill='currentColor'
                                                    d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                                                ></path>
                                            </svg>
                                            Đang xử lý...
                                        </>
                                    ) : (
                                        'Tìm người phù hợp'
                                    )}
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            </div>

            {/* Global style animation cho đơn giản nếu chưa config tailwind keyframes */}
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.4s ease-out;
                }
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-slideUp {
                    animation: slideUp 0.5s ease-out;
                }
            `}</style>
        </div>
    );
};

export default RoommateForm;
