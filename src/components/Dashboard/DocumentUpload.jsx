import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { VAT_API_URL } from '../../constants';

const DocumentUpload = () => {
    const [documents, setDocuments] = useState([]);
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [dragActive, setDragActive] = useState(false);
    const [filter, setFilter] = useState('all'); // all, completed, processing, failed
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef(null);

    const getAuthHeaders = () => {
        const userId = localStorage.getItem('userId');
        const token = localStorage.getItem('token');
        return {
            'x-user-id': userId,
            Authorization: `Bearer ${token}`,
        };
    };

    const fetchDocuments = async () => {
        setLoading(true);
        try {
            const params = filter !== 'all' ? { status: filter } : {};
            const response = await axios.get(
                `${VAT_API_URL}/api/v1/documents`,
                {
                    headers: getAuthHeaders(),
                    params,
                },
            );
            setDocuments(response.data.documents || response.data);
        } catch (error) {
            console.error('Error fetching documents:', error);
            setDocuments([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDocuments();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filter]);

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileSelect(e.dataTransfer.files[0]);
        }
    };

    const handleFileSelect = (file) => {
        const allowedTypes = [
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/msword',
            'text/plain',
        ];

        if (!allowedTypes.includes(file.type)) {
            alert('Chỉ hỗ trợ file PDF, Word (DOCX) và text');
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            alert('Kích thước file phải nhỏ hơn 10MB');
            return;
        }

        setSelectedFile(file);
    };

    const handleFileInputChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            handleFileSelect(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) return;

        setUploading(true);
        setUploadProgress(0);

        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('title', selectedFile.name);
        formData.append('kb_scope', 'owner');

        try {
            const response = await axios.post(
                `${VAT_API_URL}/api/v1/documents/upload`,
                formData,
                {
                    headers: {
                        ...getAuthHeaders(),
                        'Content-Type': 'multipart/form-data',
                    },
                    onUploadProgress: (progressEvent) => {
                        const progress = Math.round(
                            (progressEvent.loaded * 100) / progressEvent.total,
                        );
                        setUploadProgress(progress);
                    },
                },
            );

            console.log('Upload successful:', response.data);
            alert(
                'Tải tài liệu lên thành công! Hệ thống sẽ xử lý tự động trong nền.',
            );
            setSelectedFile(null);
            setUploadProgress(0);
            fetchDocuments();
        } catch (error) {
            console.error('Upload error:', error);
            alert(
                'Không thể tải tài liệu lên: ' +
                    (error.response?.data?.error || error.message),
            );
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (documentId) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa tài liệu này?')) {
            return;
        }

        try {
            await axios.delete(
                `${VAT_API_URL}/api/v1/documents/${documentId}`,
                {
                    headers: getAuthHeaders(),
                },
            );
            alert('Xóa tài liệu thành công');
            fetchDocuments();
        } catch (error) {
            console.error('Delete error:', error);
            alert(
                'Không thể xóa tài liệu: ' +
                    (error.response?.data?.error || error.message),
            );
        }
    };

    const formatFileSize = (bytes) => {
        if (!bytes) return 'N/A';
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString();
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed':
                return 'text-green-600 bg-green-100';
            case 'processing':
                return 'text-blue-600 bg-blue-100';
            case 'failed':
                return 'text-red-600 bg-red-100';
            default:
                return 'text-gray-600 bg-gray-100';
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'completed':
                return 'Hoàn thành';
            case 'processing':
                return 'Đang xử lý';
            case 'failed':
                return 'Thất bại';
            case 'pending':
                return 'Đang chờ';
            default:
                return status;
        }
    };

    return (
        <div className='min-h-screen bg-gray-50 p-6'>
            <div className='max-w-6xl mx-auto'>
                {/* Header */}
                <div className='mb-8'>
                    <h1 className='text-3xl font-bold text-gray-900 mb-2'>
                        Kho Tài Liệu Thông Minh
                    </h1>
                    <p className='text-gray-600'>
                        Tải lên tài liệu về phòng trọ để nâng cao khả năng tư
                        vấn và hỗ trợ của AI
                    </p>
                </div>

                {/* Upload Section */}
                <div className='bg-white rounded-lg shadow-md p-6 mb-8'>
                    <h2 className='text-xl font-semibold text-gray-800 mb-4'>
                        Tải Tài Liệu Lên
                    </h2>

                    {/* Drag and Drop Area */}
                    <div
                        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                            dragActive
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-300 hover:border-gray-400'
                        }`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                    >
                        <input
                            ref={fileInputRef}
                            type='file'
                            className='hidden'
                            accept='.pdf,.docx,.doc,.txt'
                            onChange={handleFileInputChange}
                            disabled={uploading}
                        />

                        {!selectedFile ? (
                            <div className='space-y-4'>
                                <svg
                                    className='mx-auto h-12 w-12 text-gray-400'
                                    stroke='currentColor'
                                    fill='none'
                                    viewBox='0 0 48 48'
                                    aria-hidden='true'
                                >
                                    <path
                                        d='M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02'
                                        strokeWidth={2}
                                        strokeLinecap='round'
                                        strokeLinejoin='round'
                                    />
                                </svg>
                                <div>
                                    <button
                                        onClick={() =>
                                            fileInputRef.current?.click()
                                        }
                                        className='text-blue-600 hover:text-blue-700 font-medium'
                                        disabled={uploading}
                                    >
                                        Nhấn để tải lên
                                    </button>
                                    <span className='text-gray-600'>
                                        {' '}
                                        hoặc kéo thả file vào đây
                                    </span>
                                </div>
                                <p className='text-sm text-gray-500'>
                                    File PDF, Word (DOCX) hoặc text tối đa 10MB
                                </p>
                            </div>
                        ) : (
                            <div className='space-y-4'>
                                <div className='flex items-center justify-center space-x-3'>
                                    <svg
                                        className='h-8 w-8 text-blue-600'
                                        fill='none'
                                        viewBox='0 0 24 24'
                                        stroke='currentColor'
                                    >
                                        <path
                                            strokeLinecap='round'
                                            strokeLinejoin='round'
                                            strokeWidth={2}
                                            d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                                        />
                                    </svg>
                                    <div className='text-left'>
                                        <p className='font-medium text-gray-900'>
                                            {selectedFile.name}
                                        </p>
                                        <p className='text-sm text-gray-500'>
                                            {formatFileSize(selectedFile.size)}
                                        </p>
                                    </div>
                                </div>

                                {uploading && (
                                    <div className='w-full'>
                                        <div className='flex justify-between text-sm text-gray-600 mb-1'>
                                            <span>Đang tải lên...</span>
                                            <span>{uploadProgress}%</span>
                                        </div>
                                        <div className='w-full bg-gray-200 rounded-full h-2'>
                                            <div
                                                className='bg-blue-600 h-2 rounded-full transition-all duration-300'
                                                style={{
                                                    width: `${uploadProgress}%`,
                                                }}
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className='flex space-x-3 justify-center'>
                                    <button
                                        onClick={handleUpload}
                                        disabled={uploading}
                                        className='px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors'
                                    >
                                        {uploading ? 'Đang tải...' : 'Tải lên'}
                                    </button>
                                    <button
                                        onClick={() => setSelectedFile(null)}
                                        disabled={uploading}
                                        className='px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
                                    >
                                        Hủy
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Documents List */}
                <div className='bg-white rounded-lg shadow-md p-6'>
                    <div className='flex justify-between items-center mb-6'>
                        <h2 className='text-xl font-semibold text-gray-800'>
                            Tài Liệu Của Bạn
                        </h2>
                        <div className='flex space-x-2'>
                            {[
                                { key: 'all', label: 'Tất cả' },
                                { key: 'completed', label: 'Hoàn thành' },
                                { key: 'processing', label: 'Đang xử lý' },
                                { key: 'failed', label: 'Thất bại' },
                            ].map((status) => (
                                <button
                                    key={status.key}
                                    onClick={() => setFilter(status.key)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                        filter === status.key
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    {status.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {loading ? (
                        <div className='text-center py-12'>
                            <div className='inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
                            <p className='text-gray-600 mt-4'>
                                Đang tải danh sách tài liệu...
                            </p>
                        </div>
                    ) : documents.length === 0 ? (
                        <div className='text-center py-12'>
                            <svg
                                className='mx-auto h-12 w-12 text-gray-400'
                                fill='none'
                                viewBox='0 0 24 24'
                                stroke='currentColor'
                            >
                                <path
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                    strokeWidth={2}
                                    d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                                />
                            </svg>
                            <p className='text-gray-600 mt-4'>
                                Chưa có tài liệu nào
                            </p>
                            <p className='text-sm text-gray-500 mt-2'>
                                Tải lên tài liệu đầu tiên để bắt đầu
                            </p>
                        </div>
                    ) : (
                        <div className='overflow-x-auto'>
                            <table className='min-w-full divide-y divide-gray-200'>
                                <thead className='bg-gray-50'>
                                    <tr>
                                        <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                                            Tài Liệu
                                        </th>
                                        <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                                            Kích Thước
                                        </th>
                                        <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                                            Trạng Thái
                                        </th>
                                        <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                                            Ngày Tải Lên
                                        </th>
                                        <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                                            Thao Tác
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className='bg-white divide-y divide-gray-200'>
                                    {documents.map((doc) => (
                                        <tr
                                            key={doc.id}
                                            className='hover:bg-gray-50'
                                        >
                                            <td className='px-6 py-4 whitespace-nowrap'>
                                                <div className='flex items-center'>
                                                    <svg
                                                        className='h-5 w-5 text-gray-400 mr-3'
                                                        fill='none'
                                                        viewBox='0 0 24 24'
                                                        stroke='currentColor'
                                                    >
                                                        <path
                                                            strokeLinecap='round'
                                                            strokeLinejoin='round'
                                                            strokeWidth={2}
                                                            d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                                                        />
                                                    </svg>
                                                    <div>
                                                        <div className='text-sm font-medium text-gray-900'>
                                                            {doc.title}
                                                        </div>
                                                        <div className='text-sm text-gray-500'>
                                                            {doc.filename}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                                                {formatFileSize(doc.file_size)}
                                            </td>
                                            <td className='px-6 py-4 whitespace-nowrap'>
                                                <span
                                                    className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                                                        doc.status,
                                                    )}`}
                                                >
                                                    {getStatusLabel(doc.status)}
                                                </span>
                                            </td>
                                            <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                                                {formatDate(
                                                    doc.upload_date ||
                                                        doc.created_at,
                                                )}
                                            </td>
                                            <td className='px-6 py-4 whitespace-nowrap text-sm'>
                                                <button
                                                    onClick={() =>
                                                        handleDelete(doc.id)
                                                    }
                                                    className='text-red-600 hover:text-red-900 font-medium'
                                                >
                                                    Xóa
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DocumentUpload;
