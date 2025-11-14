import { useState, useEffect, useCallback } from 'react';
import { axiosInstance } from '../lib/axios';
import { toast } from 'react-hot-toast';

const IdVerification = () => {
    const [frontFile, setFrontFile] = useState(null);
    const [backFile, setBackFile] = useState(null);
    const [frontPreviewUrl, setFrontPreviewUrl] = useState(null);
    const [backPreviewUrl, setBackPreviewUrl] = useState(null);
    const [loading, setLoading] = useState(false);
    const [verificationResult, setVerificationResult] = useState(null);
    const [error, setError] = useState(null);
    const [isAlreadyVerified, setIsAlreadyVerified] = useState(false);

    // Fetch user verification details function
    const fetchUserVerificationDetails = useCallback(async () => {
        try {
            // Use the profile endpoint instead of user ID endpoint
            const response = await axiosInstance.get(
                '/renterowner/get-profile',
            );
            console.log('Profile response:', response.data);

            if (response.data && response.data.isVerified) {
                setVerificationResult({
                    userId: response.data.id,
                    citizenIdNumber: response.data.citizenIdNumber,
                    isVerified: response.data.isVerified,
                    verificationDate: response.data.verificationDate,
                    name: response.data.fullName || null,
                    statusCode: 200,
                });
                setIsAlreadyVerified(true);
            } else {
                setIsAlreadyVerified(false);
            }
        } catch (error) {
            console.error('Error fetching user verification details:', error);
        }
    }, []);

    // Check if user is already verified on component mount
    useEffect(() => {
        // Fetch user profile to check verification status
        fetchUserVerificationDetails();
    }, [fetchUserVerificationDetails]);

    const handleFileChange = (event, side) => {
        const file = event.target.files[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                toast.error('Vui lòng chọn file ảnh (JPG, PNG)');
                return;
            }

            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                toast.error('Kích thước file không được vượt quá 5MB');
                return;
            }

            if (side === 'front') {
                setFrontFile(file);
                // Create preview URL
                const reader = new FileReader();
                reader.onloadend = () => {
                    setFrontPreviewUrl(reader.result);
                };
                reader.readAsDataURL(file);
            } else {
                setBackFile(file);
                // Create preview URL
                const reader = new FileReader();
                reader.onloadend = () => {
                    setBackPreviewUrl(reader.result);
                };
                reader.readAsDataURL(file);
            }

            setError(null);
            setVerificationResult(null);
        }
    };

    const fileToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = (error) => reject(error);
        });
    };

    const handleVerify = async () => {
        if (!frontFile) {
            toast.error('Vui lòng chọn ảnh mặt trước CMND/CCCD');
            return;
        }

        if (!backFile) {
            toast.error('Vui lòng chọn ảnh mặt sau CMND/CCCD');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Get user ID from localStorage or auth store
            const userString = localStorage.getItem('authUser');
            if (!userString) {
                toast.error('Vui lòng đăng nhập để xác thực');
                return;
            }

            const user = JSON.parse(userString);
            const userId = user.id;

            // Convert both images to base64
            const frontImageBase64 = await fileToBase64(frontFile);
            const backImageBase64 = await fileToBase64(backFile);

            const requestPayload = {
                userId: userId,
                frontImageBase64: frontImageBase64,
                backImageBase64: backImageBase64,
            };

            console.log('Sending verification request with:', {
                userId,
                hasFrontImage: !!frontImageBase64,
                hasBackImage: !!backImageBase64,
                frontImageLength: frontImageBase64?.length,
                backImageLength: backImageBase64?.length,
            });

            // Call API with both images
            const response = await axiosInstance.post(
                '/users/verify-citizen-id-with-fptai',
                requestPayload,
            );

            if (response.data.statusCode === 200) {
                setVerificationResult(response.data);
                setIsAlreadyVerified(true);
                toast.success('Xác thực CMND/CCCD thành công!');

                // Update user verification status in localStorage
                const updatedUser = {
                    ...user,
                    isVerified: true,
                    citizenIdNumber: response.data.citizenIdNumber,
                };
                localStorage.setItem('authUser', JSON.stringify(updatedUser));
            } else {
                setError(response.data.error || 'Xác thực thất bại');
                toast.error(response.data.error || 'Xác thực thất bại');
            }
        } catch (err) {
            console.error('Verification error:', err);
            const errorMessage =
                err.response?.data?.error ||
                err.message ||
                'Có lỗi xảy ra khi xác thực';
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className='p-8'>
            <div className='max-w-4xl mx-auto'>
                <h1 className='text-2xl font-bold text-gray-800 mb-2'>
                    Xác thực CMND/CCCD
                </h1>
                <p className='text-gray-600 mb-8'>
                    {isAlreadyVerified
                        ? 'Tài khoản của bạn đã được xác thực'
                        : 'Tải lên ảnh CMND/CCCD của bạn để xác thực danh tính'}
                </p>

                {/* Show verification status if already verified */}
                {isAlreadyVerified && verificationResult ? (
                    <div className='bg-green-50 border border-green-200 rounded-lg p-6 mb-6'>
                        <div className='flex items-center mb-4'>
                            <i className='fas fa-check-circle text-green-600 text-2xl mr-3'></i>
                            <h2 className='text-xl font-bold text-green-800'>
                                Tài khoản đã được xác thực
                            </h2>
                        </div>

                        <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mt-6'>
                            <div className='bg-white rounded-lg p-4'>
                                <p className='text-sm text-gray-600 mb-1'>
                                    Số CMND/CCCD
                                </p>
                                <p className='text-lg font-semibold text-gray-800'>
                                    {verificationResult.citizenIdNumber}
                                </p>
                            </div>

                            {verificationResult.name && (
                                <div className='bg-white rounded-lg p-4'>
                                    <p className='text-sm text-gray-600 mb-1'>
                                        Họ và tên
                                    </p>
                                    <p className='text-lg font-semibold text-gray-800'>
                                        {verificationResult.name}
                                    </p>
                                </div>
                            )}

                            <div className='bg-white rounded-lg p-4'>
                                <p className='text-sm text-gray-600 mb-1'>
                                    Trạng thái
                                </p>
                                <p className='text-lg font-semibold text-green-600'>
                                    <i className='fas fa-check-circle mr-2'></i>
                                    Đã xác thực
                                </p>
                            </div>

                            <div className='bg-white rounded-lg p-4'>
                                <p className='text-sm text-gray-600 mb-1'>
                                    Ngày xác thực
                                </p>
                                <p className='text-lg font-semibold text-gray-800'>
                                    {new Date(
                                        verificationResult.verificationDate,
                                    ).toLocaleString('vi-VN')}
                                </p>
                            </div>
                        </div>

                        <div className='mt-6 p-4 bg-blue-50 rounded-lg'>
                            <p className='text-sm text-blue-800'>
                                <i className='fas fa-info-circle mr-2'></i>
                                Tài khoản của bạn đã được xác thực thành công.
                                Bạn có thể sử dụng đầy đủ các tính năng của hệ
                                thống.
                            </p>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Upload Section - Front and Back */}
                        <div className='bg-white rounded-lg shadow-md p-6 mb-6'>
                            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                                {/* Front Side */}
                                <div>
                                    <h3 className='text-lg font-semibold text-gray-800 mb-3'>
                                        <i className='fas fa-id-card mr-2 text-blue-600'></i>
                                        Mặt trước CMND/CCCD
                                    </h3>
                                    <div className='border-2 border-dashed border-gray-300 rounded-lg p-6 text-center'>
                                        {frontPreviewUrl ? (
                                            <div className='space-y-3'>
                                                <img
                                                    src={frontPreviewUrl}
                                                    alt='Front ID Preview'
                                                    className='max-w-full max-h-64 mx-auto rounded-lg'
                                                />
                                                <button
                                                    onClick={() => {
                                                        setFrontFile(null);
                                                        setFrontPreviewUrl(
                                                            null,
                                                        );
                                                    }}
                                                    className='text-red-600 hover:text-red-700 font-medium text-sm'
                                                >
                                                    <i className='fas fa-times mr-2'></i>
                                                    Xóa ảnh
                                                </button>
                                            </div>
                                        ) : (
                                            <div>
                                                <i className='fas fa-id-card text-4xl text-gray-400 mb-3'></i>
                                                <p className='text-gray-600 mb-3 text-sm'>
                                                    Ảnh mặt trước
                                                </p>
                                                <input
                                                    type='file'
                                                    id='frontFileInput'
                                                    accept='image/jpeg,image/png,image/jpg'
                                                    onChange={(e) =>
                                                        handleFileChange(
                                                            e,
                                                            'front',
                                                        )
                                                    }
                                                    className='hidden'
                                                />
                                                <label
                                                    htmlFor='frontFileInput'
                                                    className='inline-block bg-blue-600 text-white px-4 py-2 rounded-lg cursor-pointer hover:bg-blue-700 transition text-sm'
                                                >
                                                    <i className='fas fa-upload mr-2'></i>
                                                    Chọn ảnh
                                                </label>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Back Side */}
                                <div>
                                    <h3 className='text-lg font-semibold text-gray-800 mb-3'>
                                        <i className='fas fa-id-card-alt mr-2 text-green-600'></i>
                                        Mặt sau CMND/CCCD
                                    </h3>
                                    <div className='border-2 border-dashed border-gray-300 rounded-lg p-6 text-center'>
                                        {backPreviewUrl ? (
                                            <div className='space-y-3'>
                                                <img
                                                    src={backPreviewUrl}
                                                    alt='Back ID Preview'
                                                    className='max-w-full max-h-64 mx-auto rounded-lg'
                                                />
                                                <button
                                                    onClick={() => {
                                                        setBackFile(null);
                                                        setBackPreviewUrl(null);
                                                    }}
                                                    className='text-red-600 hover:text-red-700 font-medium text-sm'
                                                >
                                                    <i className='fas fa-times mr-2'></i>
                                                    Xóa ảnh
                                                </button>
                                            </div>
                                        ) : (
                                            <div>
                                                <i className='fas fa-id-card-alt text-4xl text-gray-400 mb-3'></i>
                                                <p className='text-gray-600 mb-3 text-sm'>
                                                    Ảnh mặt sau
                                                </p>
                                                <input
                                                    type='file'
                                                    id='backFileInput'
                                                    accept='image/jpeg,image/png,image/jpg'
                                                    onChange={(e) =>
                                                        handleFileChange(
                                                            e,
                                                            'back',
                                                        )
                                                    }
                                                    className='hidden'
                                                />
                                                <label
                                                    htmlFor='backFileInput'
                                                    className='inline-block bg-green-600 text-white px-4 py-2 rounded-lg cursor-pointer hover:bg-green-700 transition text-sm'
                                                >
                                                    <i className='fas fa-upload mr-2'></i>
                                                    Chọn ảnh
                                                </label>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <p className='text-sm text-gray-500 mt-4 text-center'>
                                Hỗ trợ: JPG, PNG (tối đa 5MB mỗi ảnh)
                            </p>

                            {frontFile && backFile && !verificationResult && (
                                <div className='mt-6'>
                                    <button
                                        onClick={handleVerify}
                                        disabled={loading}
                                        className={`w-full py-3 rounded-lg font-medium text-white transition ${
                                            loading
                                                ? 'bg-gray-400 cursor-not-allowed'
                                                : 'bg-green-600 hover:bg-green-700'
                                        }`}
                                    >
                                        {loading ? (
                                            <>
                                                <i className='fas fa-spinner fa-spin mr-2'></i>
                                                Đang xác thực cả hai mặt...
                                            </>
                                        ) : (
                                            <>
                                                <i className='fas fa-check-circle mr-2'></i>
                                                Xác thực cả hai mặt
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className='bg-red-50 border border-red-200 rounded-lg p-4 mb-6'>
                                <div className='flex items-start'>
                                    <i className='fas fa-exclamation-circle text-red-600 mt-0.5 mr-3'></i>
                                    <div>
                                        <h3 className='text-red-800 font-semibold mb-1'>
                                            Xác thực thất bại
                                        </h3>
                                        <p className='text-red-700 text-sm'>
                                            {error}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Verification Result */}
                        {verificationResult && (
                            <div className='bg-green-50 border border-green-200 rounded-lg p-6'>
                                <div className='flex items-center mb-4'>
                                    <i className='fas fa-check-circle text-green-600 text-2xl mr-3'></i>
                                    <h2 className='text-xl font-bold text-green-800'>
                                        Xác thực thành công!
                                    </h2>
                                </div>

                                <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mt-6'>
                                    <div className='bg-white rounded-lg p-4'>
                                        <p className='text-sm text-gray-600 mb-1'>
                                            Số CMND/CCCD
                                        </p>
                                        <p className='text-lg font-semibold text-gray-800'>
                                            {verificationResult.citizenIdNumber}
                                        </p>
                                    </div>

                                    {verificationResult.name && (
                                        <div className='bg-white rounded-lg p-4'>
                                            <p className='text-sm text-gray-600 mb-1'>
                                                Họ và tên
                                            </p>
                                            <p className='text-lg font-semibold text-gray-800'>
                                                {verificationResult.name}
                                            </p>
                                        </div>
                                    )}

                                    {verificationResult.dateOfBirth && (
                                        <div className='bg-white rounded-lg p-4'>
                                            <p className='text-sm text-gray-600 mb-1'>
                                                Ngày sinh
                                            </p>
                                            <p className='text-lg font-semibold text-gray-800'>
                                                {verificationResult.dateOfBirth}
                                            </p>
                                        </div>
                                    )}

                                    {verificationResult.sex && (
                                        <div className='bg-white rounded-lg p-4'>
                                            <p className='text-sm text-gray-600 mb-1'>
                                                Giới tính
                                            </p>
                                            <p className='text-lg font-semibold text-gray-800'>
                                                {verificationResult.sex}
                                            </p>
                                        </div>
                                    )}

                                    {verificationResult.nationality && (
                                        <div className='bg-white rounded-lg p-4'>
                                            <p className='text-sm text-gray-600 mb-1'>
                                                Quốc tịch
                                            </p>
                                            <p className='text-lg font-semibold text-gray-800'>
                                                {verificationResult.nationality}
                                            </p>
                                        </div>
                                    )}

                                    {verificationResult.placeOfOrigin && (
                                        <div className='bg-white rounded-lg p-4'>
                                            <p className='text-sm text-gray-600 mb-1'>
                                                Quê quán
                                            </p>
                                            <p className='text-lg font-semibold text-gray-800'>
                                                {
                                                    verificationResult.placeOfOrigin
                                                }
                                            </p>
                                        </div>
                                    )}

                                    {verificationResult.placeOfResidence && (
                                        <div className='bg-white rounded-lg p-4 md:col-span-2'>
                                            <p className='text-sm text-gray-600 mb-1'>
                                                Nơi thường trú
                                            </p>
                                            <p className='text-lg font-semibold text-gray-800'>
                                                {
                                                    verificationResult.placeOfResidence
                                                }
                                            </p>
                                        </div>
                                    )}

                                    {verificationResult.expiryDate && (
                                        <div className='bg-white rounded-lg p-4'>
                                            <p className='text-sm text-gray-600 mb-1'>
                                                Ngày hết hạn
                                            </p>
                                            <p className='text-lg font-semibold text-gray-800'>
                                                {verificationResult.expiryDate}
                                            </p>
                                        </div>
                                    )}

                                    <div className='bg-white rounded-lg p-4'>
                                        <p className='text-sm text-gray-600 mb-1'>
                                            Ngày xác thực
                                        </p>
                                        <p className='text-lg font-semibold text-gray-800'>
                                            {new Date(
                                                verificationResult.verificationDate,
                                            ).toLocaleString('vi-VN')}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Instructions */}
                        <div className='bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6'>
                            <h3 className='text-blue-900 font-semibold mb-3 flex items-center'>
                                <i className='fas fa-info-circle mr-2'></i>
                                Hướng dẫn chụp ảnh CMND/CCCD
                            </h3>
                            <ul className='space-y-2 text-blue-800 text-sm'>
                                <li className='flex items-start'>
                                    <i className='fas fa-check text-blue-600 mr-2 mt-1'></i>
                                    <strong>Bắt buộc:</strong> Chụp cả mặt trước
                                    VÀ mặt sau của CMND/CCCD
                                </li>
                                <li className='flex items-start'>
                                    <i className='fas fa-check text-blue-600 mr-2 mt-1'></i>
                                    Số CMND/CCCD trên cả hai mặt phải khớp nhau
                                </li>
                                <li className='flex items-start'>
                                    <i className='fas fa-check text-blue-600 mr-2 mt-1'></i>
                                    Đảm bảo ảnh rõ ràng, đủ ánh sáng, không bị
                                    mờ
                                </li>
                                <li className='flex items-start'>
                                    <i className='fas fa-check text-blue-600 mr-2 mt-1'></i>
                                    Chụp thẳng, toàn bộ CMND/CCCD nằm trong
                                    khung hình
                                </li>
                                <li className='flex items-start'>
                                    <i className='fas fa-check text-blue-600 mr-2 mt-1'></i>
                                    Tránh chụp bị lóa, phản chiếu hoặc bóng mờ
                                </li>
                                <li className='flex items-start'>
                                    <i className='fas fa-check text-blue-600 mr-2 mt-1'></i>
                                    Định dạng: JPG, PNG (tối đa 5MB mỗi ảnh)
                                </li>
                            </ul>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default IdVerification;
