import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../styles/Toast.css'; // Kết nối CSS tuỳ biến

export const showSuccessToast = (message) => {
    toast.success(message || 'Thành công!', {
        className: 'custom-toast success-toast',
    });
};

export const showErrorToast = (message) => {
    toast.error(message || 'Lỗi!', {
        className: 'custom-toast error-toast',
    });
};

export const showInfoToast = (message) => {
    toast.info(message || 'Đặt phòng thành công', {
        className: 'custom-toast success-toast',
    });
};

export const showWarningToast = (message) => {
    toast.warn(message || 'Cảnh báo!', {
        className: 'custom-toast warning-toast',
    });
};
