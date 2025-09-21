import { useEffect, useState } from 'react';
import { axiosInstance } from '../lib/axios';

const MapComponent = () => {
    const [markers, setMarkers] = useState([]);
    const [selectedMarker, setSelectedMarker] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        axiosInstance
            .get('/api/markers')
            .then((response) => setMarkers(response.data))
            .catch((error) => {
                console.error('Error fetching markers:', error);
                setError('Failed to fetch markers. Please try again later.');
            });
    }, []);

    const mapContainerStyle = {
        width: '100%',
        height: '800px',
        position: 'relative',
    };

    const markerStyle = {
        position: 'absolute',
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        backgroundColor: '#007bff',
        cursor: 'pointer',
        transform: 'translate(-50%, -50%)',
    };

    const calculatePosition = (lat, lng) => {
        const mapWidth = 800;
        const mapHeight = 500;
        const centerLat = 16.05967;
        const centerLng = 108.211627;
        const zoom = 5;

        const xOffset = (lng - centerLng) * zoom * 1000;
        const yOffset = (lat - centerLat) * zoom * -1000;

        return {
            top: `${mapHeight / 2 + yOffset}px`,
            left: `${mapWidth / 2 + xOffset}px`,
        };
    };

    return (
        <div style={mapContainerStyle}>
            <iframe
                src='https://files-maps.viettel.vn/embed/index.html?center=108.21162700000002,16.05967&zoom=5'
                width='100%'
                height='100%'
                frameBorder='0'
                scrolling='no'
                marginHeight='0'
                marginWidth='0'
            />

            {error && (
                <div
                    style={{
                        position: 'absolute',
                        top: '20px',
                        left: '20px',
                        backgroundColor: 'white',
                        padding: '10px',
                        borderRadius: '8px',
                        boxShadow: '0px 4px 10px rgba(0,0,0,0.25)',
                        color: 'red',
                    }}
                >
                    {error}
                </div>
            )}

            {markers.map((marker) => {
                const position = calculatePosition(
                    marker.latitude,
                    marker.longitude,
                );
                return (
                    <div
                        key={marker.id}
                        style={{
                            ...markerStyle,
                            top: position.top,
                            left: position.left,
                        }}
                        onClick={() => setSelectedMarker(marker)}
                    />
                );
            })}

            {selectedMarker && (
                <div
                    style={{
                        position: 'absolute',
                        bottom: '20px',
                        left: '20px',
                        backgroundColor: 'white',
                        padding: '10px',
                        borderRadius: '8px',
                        boxShadow: '0px 4px 10px rgba(0,0,0,0.25)',
                    }}
                >
                    <h3>{selectedMarker.name}</h3>
                    <p>Địa chỉ: {selectedMarker.address}</p>
                    <p>Giá thuê: ${selectedMarker.price}</p>
                    <p>Số người ở chung: {selectedMarker.roommates}</p>
                </div>
            )}
        </div>
    );
};

export default MapComponent;
