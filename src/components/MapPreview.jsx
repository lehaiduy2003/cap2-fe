import { useMemo, useState } from 'react';
import {
    LoadScript,
    GoogleMap,
    MarkerF,
    InfoWindowF,
} from '@react-google-maps/api';
import { GOOGLE_MAPS_API_KEY } from '../constants';

const containerStyle = {
    width: '100%',
    height: '260px',
    borderRadius: '12px',
    overflow: 'hidden',
};

export default function MapPreview({ location, height = 260 }) {
    // Normalize inputs: support string (address) or object with coords/address
    const isString = typeof location === 'string';
    const lat = !isString ? (location?.latitude ?? location?.lat) : undefined;
    const lng = !isString ? (location?.longitude ?? location?.lng) : undefined;
    const address = isString
        ? location
        : location?.formattedAddress ||
          location?.addressDetails ||
          location?.location ||
          '';

    const center = useMemo(
        () => ({ lat: lat ?? 10.762622, lng: lng ?? 106.660172 }),
        [lat, lng],
    );
    const [open, setOpen] = useState(false);
    const hasKey = Boolean(GOOGLE_MAPS_API_KEY);

    // Nothing to show
    if ((!lat || !lng) && !address) {
        return (
            <div className='location-card'>
                <div className='location-header'>
                    <h4>Vị trí</h4>
                </div>
                <p className='location-hint'>Không có thông tin vị trí.</p>
            </div>
        );
    }

    // If we don't have coordinates, but we have an address, show a lightweight embed
    if ((!lat || !lng) && address) {
        const q = encodeURIComponent(address);
        const src = `https://www.google.com/maps?q=${q}&output=embed`;
        return (
            <div className='location-card'>
                <div className='location-header'>
                    <h4>Vị trí</h4>
                </div>
                <p className='location-address'>{address}</p>
                <div className='map-frame' style={{ height }}>
                    <iframe
                        title={`Bản đồ: ${address}`}
                        src={src}
                        width='100%'
                        height='100%'
                        style={{ border: 0 }}
                        loading='lazy'
                        referrerPolicy='no-referrer-when-downgrade'
                    />
                </div>
                <a
                    className='map-link'
                    href={`https://www.google.com/maps?q=${q}`}
                    target='_blank'
                    rel='noreferrer noopener'
                >
                    Mở trong Google Maps ↗
                </a>
            </div>
        );
    }

    // If coordinates exist but API key is missing, still show an embed using lat,lng
    if (lat && lng && !hasKey) {
        const q = encodeURIComponent(`${lat},${lng}`);
        const src = `https://www.google.com/maps?q=${q}&output=embed`;
        return (
            <div className='location-card'>
                <div className='location-header'>
                    <h4>Vị trí</h4>
                </div>
                {address && <p className='location-address'>{address}</p>}
                <div className='map-frame' style={{ height }}>
                    <iframe
                        title={`Bản đồ: ${address || `${lat},${lng}`}`}
                        src={src}
                        width='100%'
                        height='100%'
                        style={{ border: 0 }}
                        loading='lazy'
                        referrerPolicy='no-referrer-when-downgrade'
                    />
                </div>
                <a
                    className='map-link'
                    href={`https://www.google.com/maps?q=${q}`}
                    target='_blank'
                    rel='noreferrer noopener'
                >
                    Mở trong Google Maps ↗
                </a>
            </div>
        );
    }

    return (
        <div className='location-card'>
            <div className='location-header'>
                <h4>Vị trí</h4>
                {address && <span className='location-address'>{address}</span>}
            </div>
            <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY}>
                <GoogleMap
                    mapContainerStyle={{
                        ...containerStyle,
                        height: `${height}px`,
                    }}
                    center={center}
                    zoom={15}
                    options={{
                        streetViewControl: false,
                        mapTypeControl: false,
                        fullscreenControl: false,
                    }}
                >
                    <MarkerF position={center} onClick={() => setOpen(true)} />
                    {open && (
                        <InfoWindowF
                            position={center}
                            onCloseClick={() => setOpen(false)}
                        >
                            <div>
                                <strong>Vị trí phòng</strong>
                                {address && (
                                    <p style={{ margin: '4px 0 0' }}>
                                        {address}
                                    </p>
                                )}
                            </div>
                        </InfoWindowF>
                    )}
                </GoogleMap>
            </LoadScript>
        </div>
    );
}

// No PropTypes to avoid extra dependency; component supports string or object input.
