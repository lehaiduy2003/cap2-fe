import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { VAT_API_URL } from '../../constants';
import * as UC from '@uploadcare/react-uploader';

const { FileUploaderRegular } = UC;

const DocumentUpload = () => {
    const [documents, setDocuments] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [filter, setFilter] = useState('all'); // all, completed, processing, failed
    const [loading, setLoading] = useState(false);
    const [uploadMessage, setUploadMessage] = useState(null);
    const uploaderRef = useRef(null);
    const processedUploadsRef = useRef(new Set());

    const getAuthHeaders = () => {
        const userId = localStorage.getItem('userId');
        const token = localStorage.getItem('token');
        return {
            'Content-Type': 'application/json',
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

    // Handle Uploadcare file upload complete
    const handleUploadComplete = async (items) => {
        if (!items || !items.allEntries || items.allEntries.length === 0) {
            return;
        }

        // Process all successfully uploaded files
        const successfulUploads = items.allEntries.filter(
            (file) => file.status === 'success' && file.cdnUrl,
        );

        if (successfulUploads.length === 0) {
            return;
        }

        // Check if we've already processed these uploads to prevent duplicates
        const uploadKey = successfulUploads
            .map((f) => f.uuid)
            .sort()
            .join(',');
        if (processedUploadsRef.current.has(uploadKey)) {
            return; // Already processed
        }

        processedUploadsRef.current.add(uploadKey);
        setUploading(true);

        try {
            let successCount = 0;
            let errorCount = 0;

            for (const file of successfulUploads) {
                try {
                    // Extract file info
                    const upload_url = file.cdnUrl;
                    const original_filename = file.name || 'document';
                    const title = file.name || 'Untitled Document';

                    // Send to VAT service to create document record and trigger RAG processing
                    await axios.post(
                        `${VAT_API_URL}/api/v1/documents`,
                        {
                            title,
                            original_filename,
                            upload_url,
                            property_id: null, // Can be set if needed
                            metadata: {
                                file_size: file.size,
                                content_type:
                                    file.mimeType || 'application/octet-stream',
                                uploadcare_uuid: file.uuid,
                            },
                        },
                        {
                            headers: getAuthHeaders(),
                        },
                    );
                    successCount++;
                } catch (error) {
                    console.error(`Error uploading ${file.name}:`, error);
                    errorCount++;
                }
            }

            // Show a single consolidated message
            if (successCount > 0) {
                setUploadMessage({
                    type: 'success',
                    text: `Tải ${successCount} tài liệu lên thành công! Hệ thống sẽ xử lý tự động trong nền.`,
                });
            }
            if (errorCount > 0) {
                setUploadMessage({
                    type: 'error',
                    text: `Không thể tải ${errorCount} tài liệu lên.`,
                });
            }

            // Auto-hide message after 5 seconds
            setTimeout(() => setUploadMessage(null), 5000);

            // Refresh document list only once
            fetchDocuments();
        } catch (error) {
            console.error('Upload error:', error);
            setUploadMessage({
                type: 'error',
                text:
                    'Không thể tải tài liệu lên: ' +
                    (error.response?.data?.error || error.message),
            });
            setTimeout(() => setUploadMessage(null), 5000);
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
            setUploadMessage({
                type: 'success',
                text: 'Xóa tài liệu thành công',
            });
            setTimeout(() => setUploadMessage(null), 3000);
            fetchDocuments();
        } catch (error) {
            console.error('Delete error:', error);
            setUploadMessage({
                type: 'error',
                text:
                    'Không thể xóa tài liệu: ' +
                    (error.response?.data?.error || error.message),
            });
            setTimeout(() => setUploadMessage(null), 5000);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString('vi-VN');
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed':
                return 'text-green-600 bg-green-100';
            case 'processing':
                return 'text-blue-600 bg-blue-100';
            case 'pending':
                return 'text-yellow-600 bg-yellow-100';
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
            case 'pending':
                return 'Đang chờ';
            case 'failed':
                return 'Thất bại';
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

                    {/* Message Display */}
                    {uploadMessage && (
                        <div
                            className={`mb-4 p-4 rounded-lg ${
                                uploadMessage.type === 'success'
                                    ? 'bg-green-50 text-green-800 border border-green-200'
                                    : 'bg-red-50 text-red-800 border border-red-200'
                            }`}
                        >
                            <p className='font-medium'>{uploadMessage.text}</p>
                        </div>
                    )}

                    {/* Uploadcare File Uploader */}
                    <div className='uploadcare-wrapper'>
                        <FileUploaderRegular
                            ref={uploaderRef}
                            pubkey='84bfc996cb9f9a9b5d78'
                            maxLocalFileSizeBytes={10485760} // 10MB
                            multiple={true}
                            accept='.pdf,.doc,.docx,.txt'
                            imgOnly={false}
                            sourceList='local, gdrive'
                            classNameUploader='uc-light'
                            onChange={handleUploadComplete}
                        />
                    </div>

                    {uploading && (
                        <div className='mt-4 text-center'>
                            <div className='inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
                            <p className='text-gray-600 mt-2'>
                                Đang tạo bản ghi tài liệu...
                            </p>
                        </div>
                    )}

                    <div className='mt-4 text-sm text-gray-500 bg-blue-50 p-4 rounded-lg'>
                        <p className='font-medium text-blue-900 mb-2'>
                            📚 Hướng dẫn sử dụng:
                        </p>
                        <ul className='space-y-1'>
                            <li>
                                📄 Hỗ trợ: PDF, Word (DOCX, DOC), Text (TXT)
                            </li>
                            <li>📦 Kích thước tối đa: 10MB mỗi file</li>
                            <li>
                                🤖 Hệ thống sẽ tự động xử lý và phân tích tài
                                liệu
                            </li>
                            <li>⚡ Có thể tải nhiều file cùng lúc</li>
                        </ul>
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
                                { key: 'pending', label: 'Đang chờ' },
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
                                            Trạng Thái
                                        </th>
                                        <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                                            Chunks
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
                                            <td className='px-6 py-4'>
                                                <div className='flex items-center'>
                                                    <svg
                                                        className='h-5 w-5 text-gray-400 mr-3 shrink-0'
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
                                                            {
                                                                doc.original_filename
                                                            }
                                                        </div>
                                                    </div>
                                                </div>
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
                                                {doc.chunk_count || 0} chunks
                                            </td>
                                            <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                                                {formatDate(doc.created_at)}
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
