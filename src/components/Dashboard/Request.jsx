import { useState, useEffect, useCallback } from 'react';
import { showErrorToast, showInfoToast } from '../toast';
import { useNavigate } from 'react-router-dom';
// import { useNotifications } from "../NotificationComponent/NotificationContext";
import './css/Request.css';
import InvoiceForm from '../Invoices/InvoiceForm';
import { BASE_API_URL } from '../../constants';

const Request = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [selectedRenterInfo, setSelectedRenterInfo] = useState(null);
    const [requestType, setRequestType] = useState('VIEW');
    const [userRole, setUserRole] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isCreatingNew, setIsCreatingNew] = useState(false);
    const [selectedRoomId, setSelectedRoomId] = useState(null);
    const [selectedTenantId, setSelectedTenantId] = useState(null);
    const [tenantNames, setTenantNames] = useState({});
    const navigate = useNavigate();
    // const { sendNotification } = useNotifications();

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        // Check authentication state
        const checkAuth = () => {
            const token = localStorage.getItem('authToken');
            const userData = JSON.parse(localStorage.getItem('userData'));

            console.log('Auth check - Token:', token);
            console.log('Auth check - User data:', userData);

            if (token) {
                // Chỉ cần kiểm tra token
                if (userData) {
                    setUserRole(userData.role);
                    setIsAuthenticated(true);
                    console.log('User authenticated with role:', userData.role);
                } else {
                    // Nếu có token nhưng không có userData, thử lấy thông tin user từ token
                    fetch(`${BASE_API_URL}/renterowner/get-profile`, {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    })
                        .then((response) => {
                            if (!response.ok) {
                                throw new Error(
                                    `HTTP error! status: ${response.status}`,
                                );
                            }
                            return response.json();
                        })
                        .then((data) => {
                            console.log('Got user profile:', data);
                            if (data && data.user && data.user.role) {
                                localStorage.setItem(
                                    'userData',
                                    JSON.stringify(data.user),
                                );
                                setUserRole(data.user.role);
                                setIsAuthenticated(true);
                                console.log(
                                    'User authenticated with role:',
                                    data.user.role,
                                );
                            } else {
                                throw new Error('Invalid user data received');
                            }
                        })
                        .catch((error) => {
                            console.error('Error fetching user data:', error);
                            // Nếu lỗi kết nối, thử sử dụng token để xác thực
                            if (token) {
                                setIsAuthenticated(true);
                                console.log('Using token for authentication');
                            } else {
                                setIsAuthenticated(false);
                            }
                        });
                }
            } else {
                console.log('No token found');
                setIsAuthenticated(false);
            }
        };

        checkAuth();
    }, []);

    // Function to fetch room details
    const fetchRoomDetails = async (roomId) => {
        try {
            const response = await fetch(
                `${BASE_API_URL}/api/rooms/${roomId}`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('authToken')}`,
                    },
                },
            );

            if (!response.ok) {
                throw new Error('Failed to fetch room details');
            }

            // Read response as text first
            const text = await response.text();
            console.log('Raw room response:', text);

            // Clean the response text
            const cleanedText = text
                // eslint-disable-next-line no-control-regex
                .replace(/[\x00-\x1F\x7F-\x9F]/g, '')
                .replace(/\s+/g, ' ')
                .trim();

            // Try to parse the cleaned JSON
            let data;
            try {
                data = JSON.parse(cleanedText);
                console.log('Parsed room data:', data);
            } catch (parseError) {
                console.error('Initial JSON parse failed:', parseError);
                throw new Error('Invalid JSON response format');
            }

            // Fetch owner information
            if (data.data?.ownerId) {
                try {
                    const ownerResponse = await fetch(
                        `${BASE_API_URL}/owner/get-users/${data.data.ownerId}`,
                        {
                            headers: {
                                Authorization: `Bearer ${localStorage.getItem('authToken')}`,
                            },
                        },
                    );

                    if (ownerResponse.ok) {
                        const ownerText = await ownerResponse.text();
                        console.log('Raw owner response:', ownerText);

                        // Clean the owner response text and remove circular references
                        const cleanedOwnerText = ownerText
                            // eslint-disable-next-line no-control-regex
                            .replace(/[\x00-\x1F\x7F-\x9F]/g, '')
                            .replace(/\s+/g, ' ')
                            .replace(/"rooms":\[[^\]]*\]/g, '"rooms":[]')
                            .replace(
                                /"contracts":\[[^\]]*\]/g,
                                '"contracts":[]',
                            )
                            .replace(
                                /"roomImages":\[[^\]]*\]/g,
                                '"roomImages":[]',
                            )
                            .replace(/"room":\{[^}]*\}/g, '"room":{}')
                            .trim();

                        try {
                            const ownerData = JSON.parse(cleanedOwnerText);
                            console.log('Parsed owner data:', ownerData);

                            if (
                                ownerData.usersList &&
                                ownerData.usersList.length > 0
                            ) {
                                const ownerInfo = ownerData.usersList[0];
                                data.data.ownerName = ownerInfo.fullName;
                                console.log(
                                    'Updated room data with owner name:',
                                    data.data,
                                );
                            }
                        } catch (parseError) {
                            console.error(
                                'Error parsing owner data:',
                                parseError,
                            );
                            // Continue without owner name if parsing fails
                        }
                    }
                } catch (error) {
                    console.error('Error fetching owner info:', error);
                    // Continue without owner name if fetch fails
                }
            }

            return data.data;
        } catch (error) {
            console.error('Error fetching room details:', error);
            return null;
        }
    };

    const fetchRequests = useCallback(async () => {
        if (!isAuthenticated) {
            console.log('Not authenticated, skipping fetch');
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('authToken');
            const userData = JSON.parse(localStorage.getItem('userData'));

            console.log('Fetching with token:', token);
            console.log('User data:', userData);

            if (!token) {
                console.log('No token found, redirecting to login');
                setIsAuthenticated(false);
                window.location.href = '/login';
                return;
            }

            // Fetch view requests
            const viewResponse = await fetch(
                `${BASE_API_URL}/api/view-requests/owner`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                },
            );

            console.log('View response status:', viewResponse.status);

            if (!viewResponse.ok) {
                if (
                    viewResponse.status === 401 ||
                    viewResponse.status === 403
                ) {
                    console.log(
                        'Token expired or invalid, redirecting to login',
                    );
                    localStorage.removeItem('authToken');
                    localStorage.removeItem('userData');
                    setIsAuthenticated(false);
                    window.location.href = '/login';
                    return;
                }
                throw new Error('Failed to fetch view requests');
            }

            const viewData = await viewResponse.json();
            console.log('View requests data:', viewData);
            const viewRequests = await Promise.all(
                viewData.map(async (req) => {
                    // Fetch renter information
                    try {
                        const renterResponse = await fetch(
                            `${BASE_API_URL}/owner/get-users/${req.renterId}`,
                            {
                                headers: {
                                    Authorization: `Bearer ${token}`,
                                },
                            },
                        );
                        if (renterResponse.ok) {
                            const renterData = await renterResponse.json();
                            const renterInfo = renterData.usersList?.[0];
                            if (renterInfo) {
                                return {
                                    ...req,
                                    type: 'VIEW',
                                    renterName: renterInfo.fullName,
                                };
                            }
                        }
                    } catch (error) {
                        console.error('Error fetching renter info:', error);
                    }
                    return { ...req, type: 'VIEW' };
                }),
            );

            // Fetch rental requests only if user is OWNER or ADMIN
            let rentalRequests = [];
            if (userRole === 'OWNER' || userRole === 'ADMIN') {
                try {
                    console.log('Fetching rental requests for role:', userRole);
                    const rentalResponse = await fetch(
                        `${BASE_API_URL}/api/rent-requests/owner`,
                        {
                            headers: {
                                Authorization: `Bearer ${token}`,
                            },
                        },
                    );

                    console.log(
                        'Rental response status:',
                        rentalResponse.status,
                    );

                    if (rentalResponse.ok) {
                        const rentalData = await rentalResponse.json();
                        console.log('Rental requests data:', rentalData);
                        rentalRequests = await Promise.all(
                            rentalData.map(async (req) => {
                                console.log('Processing rental request:', req);
                                // Fetch renter information
                                try {
                                    const renterResponse = await fetch(
                                        `${BASE_API_URL}/owner/get-users/${req.tenantId}`,
                                        {
                                            headers: {
                                                Authorization: `Bearer ${token}`,
                                            },
                                        },
                                    );
                                    if (renterResponse.ok) {
                                        const renterData =
                                            await renterResponse.json();
                                        const renterInfo =
                                            renterData.usersList?.[0];
                                        if (renterInfo) {
                                            return {
                                                ...req,
                                                type: 'RENTAL',
                                                renterId: req.tenantId,
                                                renterName: renterInfo.fullName,
                                            };
                                        }
                                    }
                                } catch (error) {
                                    console.error(
                                        'Error fetching renter info:',
                                        error,
                                    );
                                }
                                return {
                                    ...req,
                                    type: 'RENTAL',
                                    renterId: req.tenantId,
                                };
                            }),
                        );
                    } else if (rentalResponse.status === 403) {
                        console.log(
                            'User does not have permission to view rental requests',
                        );
                    } else {
                        console.error(
                            'Failed to fetch rental requests:',
                            rentalResponse.status,
                        );
                    }
                } catch (rentalError) {
                    console.error(
                        'Error fetching rental requests:',
                        rentalError,
                    );
                }
            }

            // Combine both types of requests
            const allRequests = [...viewRequests, ...rentalRequests];
            console.log('Total requests:', {
                view: viewRequests.length,
                rental: rentalRequests.length,
                total: allRequests.length,
            });

            // Create a map of tenant names
            const newTenantNames = {};
            for (const req of allRequests) {
                if (req.renterId && req.renterName) {
                    newTenantNames[req.renterId] = req.renterName;
                }
            }
            setTenantNames(newTenantNames);

            // Fetch room details for each request
            const requestsWithRoomDetails = await Promise.all(
                allRequests.map(async (request) => {
                    if (request.roomId) {
                        const roomData = await fetchRoomDetails(request.roomId);
                        if (roomData) {
                            return { ...request, room: roomData };
                        }
                    }
                    return request;
                }),
            );

            console.log(
                'Final requests with room details:',
                requestsWithRoomDetails,
            );
            setRequests(requestsWithRoomDetails);
        } catch (error) {
            console.error('Fetch error:', error);
            setError(error.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated, userRole]);

    // Fetch requests when authenticated
    useEffect(() => {
        console.log('Auth state changed:', isAuthenticated);
        if (isAuthenticated) {
            console.log('Fetching requests...');
            fetchRequests();
        }
    }, [isAuthenticated, fetchRequests]);

    // Pagination calculations
    const totalPages = Math.ceil(requests.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentRequests = requests
        .filter((req) => req.type === requestType)
        .slice(startIndex, endIndex);

    // Reset to first page when changing request type
    useEffect(() => {
        setCurrentPage(1);
    }, [requestType]);

    // Show renter info modal
    const showRenterInfo = async (renterId, request) => {
        try {
            console.log('Showing renter info for request:', request);
            console.log('Renter ID:', renterId);

            if (!renterId) {
                console.error('No renter ID provided');
                showErrorToast('Không tìm thấy thông tin người thuê');
                return;
            }

            console.log('Fetching renter info for ID:', renterId);

            const response = await fetch(
                `${BASE_API_URL}/owner/get-users/${renterId}`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('authToken')}`,
                    },
                },
            );

            if (!response.ok) {
                throw new Error('Failed to fetch renter information');
            }

            // Read response as text first
            const text = await response.text();
            console.log('Raw renter response length:', text.length);

            // Clean the response text and remove circular references
            const cleanedText = text
                // eslint-disable-next-line no-control-regex
                .replace(/[\x00-\x1F\x7F-\x9F]/g, '')
                .replace(/\s+/g, ' ')
                .replace(/"rooms":\[[^\]]*\]/g, '"rooms":[]')
                .replace(/"contracts":\[[^\]]*\]/g, '"contracts":[]')
                .replace(/"roomImages":\[[^\]]*\]/g, '"roomImages":[]')
                .replace(/"room":\{[^}]*\}/g, '"room":{}')
                .trim();

            // Try to parse the cleaned JSON
            let renterData;
            try {
                renterData = JSON.parse(cleanedText);
                console.log('Parsed renter data:', renterData);
            } catch (parseError) {
                console.error('Initial JSON parse failed:', parseError);
                // Try to find the last valid JSON structure
                const lastBrace = cleanedText.lastIndexOf('}');
                if (lastBrace > 0) {
                    try {
                        const truncatedText = cleanedText.substring(
                            0,
                            lastBrace + 1,
                        );
                        renterData = JSON.parse(truncatedText);
                        console.log('Successfully parsed truncated JSON');
                    } catch (e) {
                        console.error('Failed to parse truncated JSON:', e);
                        throw new Error('Invalid JSON response format');
                    }
                } else {
                    throw new Error('Invalid JSON response format');
                }
            }

            // Extract user data safely
            const userData = renterData?.usersList?.[0] || {};
            console.log('User data:', userData);

            if (!userData || Object.keys(userData).length === 0) {
                throw new Error('No user data found');
            }

            // Extract only the necessary user information
            const renterInfo = {
                fullName: userData.fullName || 'Chưa cập nhật',
                email: userData.email || 'Chưa cập nhật',
                phone: userData.phone || 'Chưa cập nhật',
                dateOfBirth: userData.dob
                    ? new Date(userData.dob).toLocaleDateString()
                    : 'Chưa cập nhật',
                gender: userData.gender || 'Chưa cập nhật',
            };

            console.log('Processed renter info:', renterInfo);

            setSelectedRenterInfo(renterInfo);
            setSelectedRequest(request);
            setIsModalOpen(true);
        } catch (error) {
            console.error('Error showing renter info:', error);
            showErrorToast('Không thể hiển thị thông tin người thuê');
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedRequest(null);
        setSelectedRenterInfo(null);
    };

    // Handle view request response
    const handleViewRequestRespond = async (
        requestId,
        accept,
        adminNote = null,
    ) => {
        try {
            const response = await fetch(
                `${BASE_API_URL}/api/view-requests/respond`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${localStorage.getItem('authToken')}`,
                    },
                    body: JSON.stringify({
                        requestId: requestId,
                        accept: accept,
                        adminNote: adminNote || '',
                    }),
                },
            );

            if (!response.ok) {
                throw new Error('Failed to respond to view request');
            }

            showInfoToast(
                accept
                    ? 'Đã chấp nhận yêu cầu xem phòng'
                    : 'Đã từ chối yêu cầu xem phòng',
            );
            await fetchRequests();
        } catch (error) {
            console.error('Error responding to view request:', error);
            showErrorToast(error.message || 'Có lỗi xảy ra khi xử lý yêu cầu');
        }
    };

    // Handle rental request response
    const handleRentalRequestRespond = async (
        requestId,
        accept,
        adminNote = null,
    ) => {
        try {
            const response = await fetch(
                `${BASE_API_URL}/api/rent-requests/${requestId}`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${localStorage.getItem('authToken')}`,
                    },
                    body: JSON.stringify({
                        accept: accept,
                        adminNote: adminNote || '',
                        status: accept ? 'APPROVED' : 'REJECTED',
                        ownerFinalize: accept,
                    }),
                },
            );

            if (!response.ok) {
                throw new Error('Failed to respond to rental request');
            }

            showInfoToast(
                accept
                    ? 'Đã chấp nhận yêu cầu thuê phòng'
                    : 'Đã từ chối yêu cầu thuê phòng',
            );

            if (accept) {
                // Find the request to get roomId and tenantId
                const request = requests.find((req) => req.id === requestId);
                if (request) {
                    // Show contract form directly instead of navigating
                    setIsCreatingNew(true);
                    setSelectedRoomId(request.roomId);
                    setSelectedTenantId(request.renterId);
                }
            }

            await fetchRequests();
        } catch (error) {
            console.error('Error responding to rental request:', error);
            showErrorToast(error.message || 'Có lỗi xảy ra khi xử lý yêu cầu');
        }
    };

    // Handle cancel rental request
    const handleCancelRental = async (requestId) => {
        try {
            // Find the request to get roomId
            const request = requests.find((req) => req.id === requestId);
            if (!request) {
                throw new Error('Không tìm thấy yêu cầu thuê phòng');
            }

            // Cancel rental request
            const response = await fetch(
                `${BASE_API_URL}/api/rent-requests/${requestId}/cancel`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${localStorage.getItem('authToken')}`,
                    },
                },
            );

            if (!response.ok) {
                throw new Error('Failed to cancel rental request');
            }

            // Update room status back to available
            const updateRoomResponse = await fetch(
                `${BASE_API_URL}/api/rooms/${request.roomId}`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${localStorage.getItem('authToken')}`,
                    },
                    body: JSON.stringify({
                        ...request.room,
                        isRoomAvailable: true,
                    }),
                },
            );

            if (!updateRoomResponse.ok) {
                console.error('Failed to update room status');
                showErrorToast('Không thể cập nhật trạng thái phòng');
            }

            showInfoToast('Đã hủy cho thuê phòng thành công');
            await fetchRequests();
        } catch (error) {
            console.error('Error canceling rental:', error);
            showErrorToast(
                error.message || 'Có lỗi xảy ra khi hủy cho thuê phòng',
            );
        }
    };

    // Handle saving new contract
    const handleSaveContract = async (contractData) => {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                showInfoToast(
                    'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
                );
                navigate('/login');
                return;
            }

            // Check if user is owner or admin
            const userData = JSON.parse(localStorage.getItem('userData'));
            if (
                !userData ||
                (userData.role !== 'OWNER' && userData.role !== 'ADMIN')
            ) {
                showErrorToast('Bạn không có quyền thực hiện thao tác này');
                return;
            }

            // Ensure we have the required data
            if (!selectedRoomId || !selectedTenantId) {
                throw new Error('Missing required data for contract creation');
            }

            // Find the room details from the requests list
            const roomDetails = requests.find(
                (req) => req.roomId === selectedRoomId,
            )?.room;
            if (!roomDetails) {
                throw new Error('Không tìm thấy thông tin phòng');
            }

            // Validate dates
            const startDate = new Date(contractData.startDate);
            const endDate = new Date(contractData.endDate);
            const today = new Date();

            if (startDate < today) {
                throw new Error('Ngày bắt đầu không được trước ngày hiện tại');
            }

            if (endDate <= startDate) {
                throw new Error('Ngày kết thúc phải sau ngày bắt đầu');
            }

            // Create contract using the same endpoint as InvoiceForm
            const contractResponse = await fetch(
                `${BASE_API_URL}/api/contracts`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        tenantId: selectedTenantId,
                        roomId: selectedRoomId,
                        startDate: contractData.startDate,
                        endDate: contractData.endDate,
                        pricePerMonth: roomDetails.price,
                        status: 'ACTIVE',
                    }),
                },
            );

            if (
                contractResponse.status === 401 ||
                contractResponse.status === 403
            ) {
                showInfoToast(
                    'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
                );
                navigate('/login');
                return;
            }

            if (!contractResponse.ok) {
                const errorData = await contractResponse
                    .json()
                    .catch(() => ({}));
                throw new Error(
                    errorData.message || 'Failed to create contract',
                );
            }

            // Update room status to not available
            console.log('Attempting to hide room:', selectedRoomId);
            const updateRoomResponse = await fetch(
                `${BASE_API_URL}/api/rooms/${selectedRoomId}/hide`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                },
            );

            console.log(
                'Hide room response status:',
                updateRoomResponse.status,
            );
            const hideResponseText = await updateRoomResponse.text();
            console.log('Hide room response:', hideResponseText);

            if (
                updateRoomResponse.status === 401 ||
                updateRoomResponse.status === 403
            ) {
                showInfoToast(
                    'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
                );
                navigate('/login');
                return;
            }

            if (!updateRoomResponse.ok) {
                console.error(
                    'Failed to update room status:',
                    hideResponseText,
                );
                showErrorToast('Không thể cập nhật trạng thái phòng');
            } else {
                console.log('Room hidden successfully');
            }

            const responseData = await contractResponse.json();
            showInfoToast(responseData.message || 'Tạo hợp đồng thành công');
            setIsCreatingNew(false);
            setSelectedRoomId(null);
            setSelectedTenantId(null);
            await fetchRequests(); // Refresh the requests list
        } catch (error) {
            console.error('Error creating contract:', error);
            showErrorToast(error.message || 'Có lỗi xảy ra khi tạo hợp đồng');
        }
    };

    // Show loading or error state if not authenticated
    if (!isAuthenticated) {
        return (
            <div className='request-container'>
                <h2>Yêu cầu phòng trọ</h2>
                <p>Vui lòng đăng nhập để xem yêu cầu của bạn.</p>
            </div>
        );
    }

    return (
        <div className='request-container'>
            <h2>Yêu cầu phòng trọ</h2>
            {loading ? (
                <p>Đang tải...</p>
            ) : error ? (
                <p className='error-message'>{error}</p>
            ) : currentRequests.length === 0 ? (
                <p>Không có yêu cầu nào.</p>
            ) : (
                <>
                    <table className='requests-table'>
                        <thead>
                            <tr>
                                <th>Phòng</th>
                                <th>Người thuê</th>
                                {requestType === 'VIEW' && <th>Tin nhắn</th>}
                                <th>Trạng thái</th>
                                <th>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentRequests.map((req) => (
                                <tr key={req.id}>
                                    <td>
                                        <span
                                            className='room-name'
                                            title={
                                                req.room?.title ||
                                                'Unknown Room'
                                            }
                                            onClick={() =>
                                                showRenterInfo(
                                                    req.renterId,
                                                    req,
                                                )
                                            }
                                        >
                                            {req.room?.title || 'Unknown Room'}
                                        </span>
                                    </td>
                                    <td>
                                        <span
                                            style={{
                                                fontWeight: 500,
                                                color: '#333',
                                            }}
                                        >
                                            {tenantNames[req.renterId] ||
                                                'Đang tải...'}
                                        </span>
                                    </td>
                                    {requestType === 'VIEW' && (
                                        <td>{req.message}</td>
                                    )}
                                    <td>
                                        {req.status === 'PENDING' ? (
                                            <span className='status-pending'>
                                                Đang chờ
                                            </span>
                                        ) : req.status === 'APPROVED' ? (
                                            <span className='status-approved'>
                                                Đã chấp nhận
                                            </span>
                                        ) : req.status === 'REJECTED' ? (
                                            <span className='status-rejected'>
                                                Đã từ chối
                                            </span>
                                        ) : req.status === 'BOTH_FINALIZED' ? (
                                            <span className='status-finalized'>
                                                Đã hoàn tất
                                            </span>
                                        ) : (
                                            <span className='status-message'>
                                                {req.status}
                                                {req.adminNote &&
                                                    ` - ${req.adminNote}`}
                                            </span>
                                        )}
                                    </td>
                                    <td>
                                        {req.status === 'PENDING' && (
                                            <div className='action-buttons'>
                                                <button
                                                    className='accept-btn'
                                                    onClick={() => {
                                                        if (
                                                            req.type === 'VIEW'
                                                        ) {
                                                            handleViewRequestRespond(
                                                                req.id,
                                                                true,
                                                            );
                                                        } else {
                                                            handleRentalRequestRespond(
                                                                req.id,
                                                                true,
                                                            );
                                                        }
                                                    }}
                                                >
                                                    Chấp nhận
                                                </button>
                                                <button
                                                    className='reject-btn'
                                                    onClick={() => {
                                                        const adminNote =
                                                            prompt(
                                                                'Lý do từ chối:',
                                                            );
                                                        if (
                                                            adminNote !== null
                                                        ) {
                                                            if (
                                                                req.type ===
                                                                'VIEW'
                                                            ) {
                                                                handleViewRequestRespond(
                                                                    req.id,
                                                                    false,
                                                                    adminNote,
                                                                );
                                                            } else {
                                                                handleRentalRequestRespond(
                                                                    req.id,
                                                                    false,
                                                                    adminNote,
                                                                );
                                                            }
                                                        }
                                                    }}
                                                >
                                                    Từ chối
                                                </button>
                                            </div>
                                        )}
                                        {(req.status === 'APPROVED' ||
                                            req.status === 'BOTH_FINALIZED') &&
                                            req.type === 'RENTAL' && (
                                                <button
                                                    className='cancel-rental-btn'
                                                    onClick={() =>
                                                        handleCancelRental(
                                                            req.id,
                                                        )
                                                    }
                                                >
                                                    Hủy cho thuê phòng
                                                </button>
                                            )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Pagination controls */}
                    {totalPages > 1 && (
                        <div className='pagination'>
                            <button
                                onClick={() => setCurrentPage(1)}
                                disabled={currentPage === 1}
                                className='pagination-btn'
                            >
                                Trang đầu
                            </button>
                            <button
                                onClick={() =>
                                    setCurrentPage((p) => Math.max(1, p - 1))
                                }
                                disabled={currentPage === 1}
                                className='pagination-btn'
                            >
                                Trước
                            </button>
                            {[...Array(totalPages).keys()].map((i) => (
                                <button
                                    key={i + 1}
                                    className={`pagination-btn ${currentPage === i + 1 ? 'active' : ''}`}
                                    onClick={() => setCurrentPage(i + 1)}
                                >
                                    {i + 1}
                                </button>
                            ))}
                            <button
                                onClick={() =>
                                    setCurrentPage((p) =>
                                        Math.min(totalPages, p + 1),
                                    )
                                }
                                disabled={currentPage === totalPages}
                                className='pagination-btn'
                            >
                                Tiếp
                            </button>
                            <button
                                onClick={() => setCurrentPage(totalPages)}
                                disabled={currentPage === totalPages}
                                className='pagination-btn'
                            >
                                Trang cuối
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* Modal for showing renter info */}
            {isModalOpen && selectedRequest && (
                <div className='modal-overlay' onClick={closeModal}>
                    <div
                        className='modal-content'
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3>Thông tin người thuê</h3>
                        {selectedRenterInfo ? (
                            <div className='renter-info'>
                                <div className='info-section'>
                                    <h4>Thông tin cá nhân</h4>
                                    <p>
                                        <strong>Họ và tên:</strong>{' '}
                                        {selectedRenterInfo.fullName}
                                    </p>
                                    <p>
                                        <strong>Email:</strong>{' '}
                                        {selectedRenterInfo.email}
                                    </p>
                                    <p>
                                        <strong>Số điện thoại:</strong>{' '}
                                        {selectedRenterInfo.phone}
                                    </p>
                                    <p>
                                        <strong>Ngày sinh:</strong>{' '}
                                        {selectedRenterInfo.dateOfBirth}
                                    </p>
                                    <p>
                                        <strong>Giới tính:</strong>{' '}
                                        {selectedRenterInfo.gender}
                                    </p>
                                </div>
                                <div className='info-section'>
                                    <h4>Thông tin yêu cầu</h4>
                                    <p>
                                        <strong>Loại yêu cầu:</strong>{' '}
                                        {selectedRequest.type === 'VIEW'
                                            ? 'Xem phòng'
                                            : 'Thuê phòng'}
                                    </p>
                                    <p>
                                        <strong>Phòng:</strong>{' '}
                                        {selectedRequest.room?.title ||
                                            'Không xác định'}
                                    </p>
                                    <p>
                                        <strong>Địa chỉ:</strong>{' '}
                                        {selectedRequest.room?.addressDetails ||
                                            'Không xác định'}
                                    </p>
                                    <p>
                                        <strong>Chủ phòng:</strong>{' '}
                                        {selectedRequest.room?.ownerName ||
                                            'Không xác định'}
                                    </p>
                                    <p>
                                        <strong>Nội dung bài viết:</strong>{' '}
                                        {selectedRequest.room?.description ||
                                            'Không có mô tả'}
                                    </p>
                                    <p>
                                        <strong>Trạng thái:</strong>{' '}
                                        {selectedRequest.status === 'PENDING'
                                            ? 'Đang chờ'
                                            : selectedRequest.status ===
                                                'APPROVED'
                                              ? 'Đã chấp nhận'
                                              : selectedRequest.status ===
                                                  'REJECTED'
                                                ? 'Đã từ chối'
                                                : selectedRequest.status ===
                                                    'BOTH_FINALIZED'
                                                  ? 'Đã hoàn tất'
                                                  : selectedRequest.status}
                                    </p>
                                    {selectedRequest.adminNote && (
                                        <p>
                                            <strong>Ghi chú:</strong>{' '}
                                            {selectedRequest.adminNote}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <p>Đang tải thông tin người thuê...</p>
                        )}
                        <button
                            className='close-modal-btn'
                            onClick={closeModal}
                        >
                            &times;
                        </button>
                    </div>
                </div>
            )}

            {isCreatingNew && (
                <div className='form-overlay'>
                    <InvoiceForm
                        onSave={handleSaveContract}
                        onCancel={() => setIsCreatingNew(false)}
                        roomId={selectedRoomId}
                        tenantId={selectedTenantId}
                    />
                </div>
            )}
        </div>
    );
};

export default Request;
