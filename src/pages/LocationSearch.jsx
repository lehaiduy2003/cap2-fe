import { useState, useEffect, useCallback } from 'react';
import { GoogleMap, LoadScript, InfoWindow } from '@react-google-maps/api';
import { axiosInstance } from '../lib/axios';
import '../styles/LocationSearch.css';
import { GOOGLE_MAPS_API_KEY } from '../constants';

const LocationSearch = () => {
    const [address, setAddress] = useState('');
    const [loading, setLoading] = useState(false);
    const [locationData, setLocationData] = useState(null);
    const [error, setError] = useState('');
    const [selectedPlace, setSelectedPlace] = useState(null);
    const [isMapLoaded, setIsMapLoaded] = useState(false);
    const [map, setMap] = useState(null);
    const [markers, setMarkers] = useState([]);

    // Google Maps configuration
    const mapContainerStyle = {
        width: '100%',
        height: '600px',
    };

    const defaultCenter = {
        lat: 10.762622, // Ho Chi Minh City default
        lng: 106.660172,
    };

    const handleSearch = async () => {
        if (!address.trim()) {
            setError('Please enter a location');
            return;
        }

        setLoading(true);
        setError('');
        setLocationData(null);
        setSelectedPlace(null);

        try {
            const response = await axiosInstance.post('/maps/locations', {
                address: address.trim(),
            });

            if (response.data.status === 'SUCCESS') {
                setLocationData(response.data);
            } else {
                setError(response.data.message || 'Failed to search location');
            }
        } catch (err) {
            console.error('Search error:', err);
            setError(
                err.response?.data?.message ||
                    'An error occurred while searching',
            );
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    const getMapCenter = () => {
        if (locationData?.location) {
            return {
                lat: locationData.location.latitude,
                lng: locationData.location.longitude,
            };
        }
        return defaultCenter;
    };

    const getPlaceIcon = useCallback((type) => {
        const iconMap = {
            restaurant: '🍽️',
            school: '🏫',
            hospital: '🏥',
            bank: '🏦',
            gas_station: '⛽',
            pharmacy: '💊',
            supermarket: '🛒',
            default: '📍',
        };
        return iconMap[type] || iconMap.default;
    }, []);

    const handlePlaceCardClick = (place) => {
        setSelectedPlace(place);
    };

    const handlePlaceCardKeyDown = (e, place) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setSelectedPlace(place);
        }
    };

    // Recreate markers when locationData changes
    useEffect(() => {
        const createMarkers = (mapInstance) => {
            if (
                !mapInstance ||
                !window.google?.maps?.marker?.AdvancedMarkerElement
            )
                return;

            // Clear existing markers
            markers.forEach((marker) => {
                if (marker.map) {
                    marker.map = null;
                }
            });

            const newMarkers = [];

            // Create main location marker (blue)
            if (locationData?.location) {
                const mainLocationElement = document.createElement('div');
                mainLocationElement.innerHTML = `
                    <div style="
                        width: 40px; 
                        height: 40px; 
                        background-color: #007bff; 
                        border: 4px solid white; 
                        border-radius: 50%; 
                        display: flex; 
                        align-items: center; 
                        justify-content: center;
                        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                        cursor: pointer;
                    ">
                        <div style="
                            width: 16px; 
                            height: 16px; 
                            background-color: white; 
                            border-radius: 50%;
                        "></div>
                    </div>
                `;

                const mainMarker =
                    new window.google.maps.marker.AdvancedMarkerElement({
                        map: mapInstance,
                        position: {
                            lat: locationData.location.latitude,
                            lng: locationData.location.longitude,
                        },
                        content: mainLocationElement,
                        title: 'Searched Location',
                    });

                newMarkers.push(mainMarker);
            }

            // Create nearby places markers (green with icons)
            if (locationData?.nearbyPlaces) {
                locationData.nearbyPlaces.forEach((place) => {
                    const placeElement = document.createElement('div');
                    placeElement.innerHTML = `
                        <div style="
                            width: 30px; 
                            height: 30px; 
                            background-color: #28a745; 
                            border: 3px solid white; 
                            border-radius: 50%; 
                            display: flex; 
                            align-items: center; 
                            justify-content: center;
                            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                            cursor: pointer;
                            font-size: 14px;
                        ">
                            ${getPlaceIcon(place.type)}
                        </div>
                    `;

                    const placeMarker =
                        new window.google.maps.marker.AdvancedMarkerElement({
                            map: mapInstance,
                            position: {
                                lat: place.latitude,
                                lng: place.longitude,
                            },
                            content: placeElement,
                            title: place.name,
                        });

                    // Add click event to marker
                    placeElement.addEventListener('click', () => {
                        setSelectedPlace(place);
                    });

                    newMarkers.push(placeMarker);
                });
            }

            setMarkers(newMarkers);
        };

        if (map && isMapLoaded && locationData) {
            createMarkers(map);
        }
    }, [
        map,
        isMapLoaded,
        locationData,
        getPlaceIcon,
        setSelectedPlace,
        markers,
    ]);

    return (
        <div className='location-search-container'>
            <div className='search-section'>
                <h1>Location Search</h1>
                <div className='search-input-group'>
                    <input
                        type='text'
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder='Enter physical location (e.g., 123 Main St, New York)'
                        className='location-input'
                        disabled={loading}
                        aria-label='Location search input'
                    />
                    <button
                        onClick={handleSearch}
                        disabled={loading || !address.trim()}
                        className='search-button'
                        aria-label='Search location'
                    >
                        {loading ? 'Searching...' : 'Search'}
                    </button>
                </div>

                {error && (
                    <div className='error-message'>
                        <p>{error}</p>
                    </div>
                )}
            </div>

            {locationData && (
                <div className='results-container'>
                    <div className='map-section'>
                        <div className='location-info-header'>
                            <h2>📍 {locationData.location.formattedAddress}</h2>
                            <p>
                                Coordinates:{' '}
                                {locationData.location.latitude.toFixed(6)},{' '}
                                {locationData.location.longitude.toFixed(6)}
                            </p>
                        </div>

                        <LoadScript
                            googleMapsApiKey={GOOGLE_MAPS_API_KEY}
                            libraries={['marker']}
                            onLoad={() => setIsMapLoaded(true)}
                            onError={() =>
                                setError('Failed to load Google Maps')
                            }
                        >
                            <GoogleMap
                                mapContainerStyle={mapContainerStyle}
                                center={getMapCenter()}
                                zoom={15}
                                options={{
                                    zoomControl: true,
                                    streetViewControl: false,
                                    mapTypeControl: false,
                                    fullscreenControl: true,
                                    mapId: 'DEMO_MAP_ID', // Required for AdvancedMarkerElement
                                }}
                                onLoad={(mapInstance) => {
                                    setMap(mapInstance);
                                }}
                                onUnmount={() => {
                                    setMap(null);
                                    setMarkers([]);
                                }}
                            >
                                {isMapLoaded && window.google?.maps?.marker && (
                                    <>
                                        {/* Markers will be created using direct Google Maps API */}
                                        {/* Info window for selected place */}
                                        {selectedPlace && (
                                            <InfoWindow
                                                position={{
                                                    lat: selectedPlace.latitude,
                                                    lng: selectedPlace.longitude,
                                                }}
                                                onCloseClick={() =>
                                                    setSelectedPlace(null)
                                                }
                                            >
                                                <div className='info-window'>
                                                    <h4>
                                                        {selectedPlace.name}
                                                    </h4>
                                                    <p>
                                                        {selectedPlace.address}
                                                    </p>
                                                    <div className='info-details'>
                                                        <span className='place-type'>
                                                            {selectedPlace.type.replace(
                                                                /_/g,
                                                                ' ',
                                                            )}
                                                        </span>
                                                        {selectedPlace.rating >
                                                            0 && (
                                                            <span className='place-rating'>
                                                                ⭐{' '}
                                                                {selectedPlace.rating.toFixed(
                                                                    1,
                                                                )}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className='place-distance'>
                                                        {selectedPlace.distanceInMeters <
                                                        1000
                                                            ? `${Math.round(selectedPlace.distanceInMeters)}m away`
                                                            : `${(selectedPlace.distanceInMeters / 1000).toFixed(1)}km away`}
                                                    </p>
                                                </div>
                                            </InfoWindow>
                                        )}
                                    </>
                                )}
                            </GoogleMap>
                        </LoadScript>
                    </div>

                    <div className='nearby-section'>
                        {locationData.nearbyPlaces &&
                            locationData.nearbyPlaces.length > 0 && (
                                <div className='nearby-places'>
                                    <h3>Nearby Places (within 1km)</h3>
                                    <div className='places-list'>
                                        {locationData.nearbyPlaces.map(
                                            (place, index) => (
                                                <div
                                                    key={`place-${place.latitude}-${place.longitude}-${place.name}-${index}`}
                                                    className={`place-card ${selectedPlace === place ? 'selected' : ''}`}
                                                    onClick={() =>
                                                        handlePlaceCardClick(
                                                            place,
                                                        )
                                                    }
                                                    onKeyDown={(e) =>
                                                        handlePlaceCardKeyDown(
                                                            e,
                                                            place,
                                                        )
                                                    }
                                                    role='button'
                                                    tabIndex={0}
                                                    aria-label={`Select ${place.name}`}
                                                >
                                                    <div className='place-icon'>
                                                        {getPlaceIcon(
                                                            place.type,
                                                        )}
                                                    </div>
                                                    <div className='place-content'>
                                                        <h4>{place.name}</h4>
                                                        <p className='place-address'>
                                                            {place.address}
                                                        </p>
                                                        <div className='place-details'>
                                                            <span className='place-type'>
                                                                {place.type.replace(
                                                                    /_/g,
                                                                    ' ',
                                                                )}
                                                            </span>
                                                            {place.rating >
                                                                0 && (
                                                                <span className='place-rating'>
                                                                    ⭐{' '}
                                                                    {place.rating.toFixed(
                                                                        1,
                                                                    )}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className='place-distance'>
                                                            {place.distanceInMeters <
                                                            1000
                                                                ? `${Math.round(place.distanceInMeters)}m away`
                                                                : `${(place.distanceInMeters / 1000).toFixed(1)}km away`}
                                                        </p>
                                                    </div>
                                                </div>
                                            ),
                                        )}
                                    </div>
                                </div>
                            )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default LocationSearch;
