import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './RoommateForm.css';
import minimal from '../../assets/minimal.jpg';
// import minimal2 from "../../assets/minimal2.jpg";
import openly from '../../assets/openly.jpg';
import warm from '../../assets/clean&warm.jpg';
import friend_video from '../../assets/4k_building.mp4';
import Select from 'react-select'; // Import Select component from react-select
import { getProvinces } from 'sub-vn'; // Import getProvinces function
import { BASE_API_URL } from '../../constants';
const provincesOptions = getProvinces().map((province) => ({
    value: province.name,
    label: province.name,
}));

const StepIndicator = ({ step }) => {
    return (
        <div className='step-indicator'>
            <div className={`step ${step >= 1 ? 'completed' : ''}`}>
                <span className='step-number'>01</span>
                <span className='step-label'>Thông tin</span>
            </div>
            <div className={`step ${step >= 2 ? 'completed' : ''}`}>
                <span className='step-number'>02</span>
                <span className='step-label'>Thành phố </span>
            </div>
            <div className={`step ${step >= 3 ? 'completed' : ''}`}>
                <span className='step-number'>03</span>
                <span className='step-label'>Sở thích </span>
            </div>
        </div>
    );
};

const StepOne = ({ formData, errors, handleChange }) => (
    <>
        <label>Giới tính:</label>
        <select name='sex' value={formData.sex} onChange={handleChange}>
            <option value='Nam'>Nam</option>
            <option value='Nữ'>Nữ</option>
        </select>

        <label>Quê quán:</label>
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
        />
        {errors.hometown && <div className='error'>{errors.hometown}</div>}

        <label>Năm sinh:</label>
        <input
            type='number'
            name='dob'
            min='0'
            value={formData.dob}
            onChange={handleChange}
        />
        {errors.dob && <div className='error'>{errors.dob}</div>}

        <label>Nghề nghiệp:</label>
        <input
            type='text'
            name='job'
            value={formData.job}
            onChange={handleChange}
        />
        {errors.job && <div className='error'>{errors.job}</div>}

        <label>Số điện thoại:</label>
        <input
            type='tel'
            name='phone'
            value={formData.phone}
            onChange={handleChange}
            placeholder='Nhập số điện thoại của bạn'
        />
        {errors.phone && <div className='error'>{errors.phone}</div>}
    </>
);

const StepTwo = ({ formData, errors, handleChange }) => (
    <>
        <label>Thành phố:</label>
        <input
            type='text'
            name='city'
            value={formData.city}
            onChange={handleChange}
        />
        {errors.city && <div className='error'>{errors.city}</div>}

        <label>Quận:</label>
        <input
            type='text'
            name='district'
            value={formData.district}
            onChange={handleChange}
        />
        {errors.district && <div className='error'>{errors.district}</div>}
    </>
);

const StepThree = ({ formData, errors, handleChange }) => {
    const hobbiesList = ['Nuôi thú cưng', 'Hút thuốc', 'Ăn Chay'];

    // Mảng chứa thông tin các phòng với tiêu chí cụ thể
    const roomTypes = [
        { value: '1', label: '', image: minimal },
        { value: '2', label: '', image: warm },
        { value: '3', label: '', image: openly },
    ];

    return (
        <>
            <label>Thói quen sinh hoạt:</label>
            <div className='checkbox-group'>
                {hobbiesList.map((hobby) => (
                    <label key={hobby}>
                        <input
                            type='checkbox'
                            name='hobbies'
                            value={hobby}
                            checked={formData.hobbies.includes(hobby)}
                            onChange={handleChange}
                        />
                        {hobby}
                    </label>
                ))}
            </div>
            {errors.hobbies && <div className='error'>{errors.hobbies}</div>}

            <label>Vui lòng chọn một trong ba bức ảnh dưới đây :</label>
            <div className='radio-group'>
                {roomTypes.map((room) => (
                    <label
                        key={room.value}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            margin: '10px',
                        }}
                    >
                        <input
                            type='radio'
                            name='rateImage'
                            value={room.value}
                            checked={formData.rateImage === room.value}
                            onChange={handleChange}
                        />
                        <img
                            src={room.image}
                            alt=''
                            style={{ width: '100px', height: 'auto' }}
                        />
                        <span>{room.label}</span>
                    </label>
                ))}
            </div>
            {errors.rateImage && (
                <div className='error'>{errors.rateImage}</div>
            )}

            <label>Mô tả thêm:</label>
            <textarea
                name='more'
                rows='4'
                maxLength='500'
                value={formData.more}
                onChange={handleChange}
            />
        </>
    );
};

const RoommateForm = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);

    const initialFormData = {
        sex: 'Nam', // Default to Vietnamese
        hometown: '',
        city: '',
        district: '',
        phone: '',
        dob: '',
        job: '',
        hobbies: [],
        rateImage: '',
        more: '',
        userId: '',
    };

    const [formData, setFormData] = useState(initialFormData);
    const [errors, setErrors] = useState({});

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
        setErrors((prev) => ({ ...prev, [name]: '' }));
    };

    const validateStep = () => {
        let newErrors = {};
        if (step === 1) {
            if (!formData.hometown.trim()) {
                newErrors.hometown = 'Vui lòng nhập quê quán';
            }

            const dob = Number(formData.dob);
            const currentYear = new Date().getFullYear();
            if (!dob) {
                newErrors.dob = 'Vui lòng nhập năm sinh';
            } else if (dob < 1900 || dob > currentYear) {
                newErrors.dob = `Năm sinh phải từ 1900 đến ${currentYear}`;
            }

            if (!formData.job.trim()) {
                newErrors.job = 'Vui lòng nhập nghề nghiệp';
            }

            if (!formData.phone.trim()) {
                newErrors.phone = 'Vui lòng nhập số điện thoại';
            } else if (!/^\d{10}$/.test(formData.phone)) {
                newErrors.phone = 'Số điện thoại phải gồm 10 chữ số';
            }
        } else if (step === 2) {
            if (!formData.city.trim())
                newErrors.city = 'Vui lòng nhập thành phố';
            if (!formData.district.trim())
                newErrors.district = 'Vui lòng nhập quận';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => {
        if (!validateStep()) return;
        setStep((prev) => prev + 1);
    };

    const handleBack = () => setStep((prev) => prev - 1);

    const handleSubmit = async (e) => {
        e.preventDefault();
        let newErrors = {};
        if (formData.hobbies.length === 0)
            newErrors.hobbies = 'Chọn ít nhất một thói quen';
        if (!formData.rateImage)
            newErrors.rateImage = 'Chọn một hình ảnh phòng mong muốn';
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                throw new Error('No authentication token found');
            }

            const userResponse = await fetch(
                `${BASE_API_URL}/renterowner/get-profile`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                },
            );

            if (!userResponse.ok) {
                throw new Error('Failed to get user information');
            }

            const response = await userResponse.json();
            console.log('User profile response:', response);

            // Check if response has the correct structure
            if (!response || typeof response.id !== 'number') {
                console.error(
                    'User data structure:',
                    JSON.stringify(response, null, 2),
                );
                throw new Error('User ID not found in response');
            }

            const userId = response.id;
            console.log('Found user ID:', userId);

            // Convert Vietnamese gender to English for backend
            const genderMap = {
                Nam: 'MALE',
                Nữ: 'FEMALE',
            };

            // 1. Create roommate record
            const dataToSend = {
                hometown: formData.hometown,
                city: formData.city,
                district: formData.district,
                yob: formData.dob,
                job: formData.job,
                phone: formData.phone,
                hobbies: formData.hobbies.join(', '),
                rateImage: formData.rateImage,
                more: formData.more,
                userId: userId,
                gender: genderMap[formData.sex] || 'MALE', // Convert to English and provide default
            };

            console.log('Form data before sending:', formData);
            console.log('Data being sent to backend:', dataToSend);

            const createResponse = await fetch(
                `${BASE_API_URL}/api/roommates`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(dataToSend),
                },
            );

            const responseData = await createResponse.json();
            console.log('Roommate creation response:', responseData);

            if (!createResponse.ok) {
                throw new Error(
                    `Failed to create roommate: ${responseData.message || createResponse.statusText}`,
                );
            }

            // Convert gender from English to Vietnamese in the response
            const genderMapResponse = {
                MALE: 'Nam',
                FEMALE: 'Nữ',
            };

            // 2. Get AI model recommendations using the original user ID
            const recommendResponse = await fetch(
                `${BASE_API_URL}/recommend?user_id=${userId}`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*',
                    },
                    credentials: 'include',
                },
            );

            if (!recommendResponse.ok) {
                const errorData = await recommendResponse.json();
                throw new Error(
                    `Failed to get recommendations: ${errorData.message || recommendResponse.statusText}`,
                );
            }

            const recommendations = await recommendResponse.json();

            // Process recommendations to include phone and convert gender
            const processedRecommendations = recommendations.map((rec) => ({
                ...rec,
                gender: genderMapResponse[rec.gender] || rec.gender,
                phone: rec.phone || formData.phone,
                hometown: rec.hometown || responseData.hometown,
                city: rec.city || responseData.city,
                district: rec.district || responseData.district,
                yob: rec.yob || responseData.yob,
                hobbies: rec.hobbies || responseData.hobbies,
                job: rec.job || responseData.job,
                more: rec.more || responseData.more,
                rateImage: rec.rateImage || responseData.rateImage,
            }));

            // 3. Navigate to match page with results
            navigate('/match', { state: { match: processedRecommendations } });
        } catch (err) {
            console.error('Error during submission:', err);
            console.error('Error details:', {
                message: err.message,
                stack: err.stack,
                name: err.name,
            });
            setErrors((prev) => ({
                ...prev,
                submit: err.message || 'An error occurred during submission',
            }));
        }
    };

    return (
        <div className='roommate-container'>
            {/* Video nền động */}
            <div className='video-background'>
                <video autoPlay loop muted>
                    <source src={friend_video} type='video/mp4' />
                </video>
            </div>
            {/* Step Indictor nằm ngoài hộp form để hiển thị phía trên */}
            <StepIndicator step={step} />
            <div className='roommate-form glass-background'>
                <h2>Thông tin Roommate - Bước {step}/3</h2>
                <form onSubmit={handleSubmit}>
                    {step === 1 && (
                        <StepOne
                            formData={formData}
                            errors={errors}
                            handleChange={handleChange}
                        />
                    )}
                    {step === 2 && (
                        <StepTwo
                            formData={formData}
                            errors={errors}
                            handleChange={handleChange}
                        />
                    )}
                    {step === 3 && (
                        <StepThree
                            formData={formData}
                            errors={errors}
                            handleChange={handleChange}
                        />
                    )}
                    <div className='form-navigation'>
                        {step > 1 && (
                            <button type='button' onClick={handleBack}>
                                Quay lại
                            </button>
                        )}
                        {step < 3 && (
                            <button type='button' onClick={handleNext}>
                                Tiếp theo
                            </button>
                        )}
                        {step === 3 && (
                            <button type='submit'>Tìm người phù hợp</button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RoommateForm;
