import { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    GoogleMap,
    LoadScript,
    Marker,
    InfoWindow,
} from '@react-google-maps/api';
import { GOOGLE_MAPS_API_KEY } from '../constants';
import { axiosInstance } from '../lib/axios';
import { Loader } from 'lucide-react';

const containerStyle = {
    width: '100vw',
    height: '100vh',
};

const center = {
    lat: 16.0544, // Da Nang latitude
    lng: 108.2022, // Da Nang longitude
};

const Map = ({ rooms: propRooms = [] }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [roomsWithCoords, setRoomsWithCoords] = useState([]);
    const [isLoadingCoords, setIsLoadingCoords] = useState(false);

    // Get rooms from props or location state
    const rooms = useMemo(() => {
        return propRooms.length > 0 ? propRooms : location.state?.rooms || [];
    }, [propRooms, location.state?.rooms]);

    useEffect(() => {
        const fetchCoordinates = async () => {
            if (!rooms || rooms.length === 0) return;

            setIsLoadingCoords(true);

            // Create address objects for API call
            const addressData = rooms.map((room) => ({
                id: room.id,
                address:
                    `${room.addressDetails || ''} ${room.ward || ''} ${room.district || ''} ${room.city || ''}`.trim(),
            }));

            try {
                // Fetch coordinates from API
                const response = await axiosInstance.post(
                    '/maps/markers',
                    addressData,
                );

                // console.log(response.data)

                // if(!response.data.isHasRoomData) {
                //     const updatedRooms = rooms.map((room) => {
                //         const coordData = response.data.find(
                //             (coord) => coord.id === room.id,
                //         );
                //         if (coordData) {
                //             return {
                //                 ...room,
                //                 latitude: coordData.latitude,
                //                 longitude: coordData.longitude,
                //             };
                //         }
                //         return room;
                //     });

                //     setRoomsWithCoords(updatedRooms);
                //     return;
                // }

                // Update rooms with fetched coordinates

                const rooms = response.data.map((data) => {
                    return {
                        latitude: data.latitude,
                        longitude: data.longitude,
                        ...data.roomData,
                    };
                });
                console.log(rooms);
                setRoomsWithCoords(rooms);
            } catch (error) {
                console.error('Error fetching coordinates:', error);
                // Fallback to rooms with existing coordinates
                setRoomsWithCoords(
                    rooms.filter((room) => room.latitude && room.longitude),
                );
            } finally {
                setIsLoadingCoords(false);
            }
        };

        fetchCoordinates();
    }, [rooms]);

    const validRooms = roomsWithCoords.filter(
        (room) => room.latitude && room.longitude,
    );

    return (
        <div className='w-screen h-screen overflow-hidden fixed inset-0'>
            {isLoadingCoords && (
                <div className='absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
                    <div className='bg-white p-6 rounded-lg shadow-lg flex items-center space-x-3'>
                        <Loader className='w-6 h-6 animate-spin text-blue-500' />
                        <span className='text-lg font-medium'>
                            Loading room locations...
                        </span>
                    </div>
                </div>
            )}
            <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY}>
                <GoogleMap
                    mapContainerStyle={containerStyle}
                    center={center}
                    zoom={12}
                    options={{
                        zoomControl: true,
                        streetViewControl: false,
                        mapTypeControl: false,
                        fullscreenControl: true,
                    }}
                >
                    {validRooms.map((room) => (
                        <Marker
                            key={room.id}
                            position={{
                                lat: parseFloat(room.latitude),
                                lng: parseFloat(room.longitude),
                            }}
                            onClick={() => setSelectedRoom(room)}
                        />
                    ))}

                    {selectedRoom && (
                        <InfoWindow
                            position={{
                                lat: parseFloat(selectedRoom.latitude),
                                lng: parseFloat(selectedRoom.longitude),
                            }}
                            onCloseClick={() => setSelectedRoom(null)}
                        >
                            <div className='max-w-sm p-2'>
                                <h3 className='font-bold text-lg mb-2'>
                                    {selectedRoom.title}
                                </h3>
                                <div className='text-sm space-y-1'>
                                    <p>
                                        <strong>Price:</strong>{' '}
                                        {new Intl.NumberFormat('vi-VN', {
                                            style: 'currency',
                                            currency: 'VND',
                                        }).format(selectedRoom.price)}
                                    </p>
                                    <p>
                                        <strong>Location:</strong>{' '}
                                        {selectedRoom.street},{' '}
                                        {selectedRoom.ward},{' '}
                                        {selectedRoom.district},{' '}
                                        {selectedRoom.city}
                                    </p>
                                    <p>
                                        <strong>Room Size:</strong>{' '}
                                        {selectedRoom.roomSize} m²
                                    </p>
                                    <p>
                                        <strong>Bedrooms:</strong>{' '}
                                        {selectedRoom.numBedrooms} |{' '}
                                        <strong>Bathrooms:</strong>{' '}
                                        {selectedRoom.numBathrooms}
                                    </p>
                                    <p>
                                        <strong>Available From:</strong>{' '}
                                        {new Date(
                                            selectedRoom.availableFrom,
                                        ).toLocaleDateString('vi-VN')}
                                    </p>
                                    <p>
                                        <strong>Owner:</strong>{' '}
                                        {selectedRoom.ownerName}
                                    </p>
                                </div>
                                <div className='mt-2 text-xs text-gray-600'>
                                    <p>
                                        {selectedRoom.description.length > 100
                                            ? `${selectedRoom.description.substring(0, 100)}...`
                                            : selectedRoom.description}
                                    </p>
                                </div>
                                {selectedRoom.imageUrls &&
                                    selectedRoom.imageUrls.length > 0 && (
                                        <img
                                            src={selectedRoom.imageUrls[0]}
                                            alt={selectedRoom.title}
                                            className='w-full h-24 object-cover rounded mt-2'
                                        />
                                    )}
                                <button
                                    onClick={() =>
                                        navigate(
                                            `/ResultRoom/${selectedRoom.id}`,
                                        )
                                    }
                                    className='mt-3 w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded transition-colors'
                                >
                                    View Detail
                                </button>
                            </div>
                        </InfoWindow>
                    )}
                </GoogleMap>
            </LoadScript>
        </div>
    );
};

export default Map;
