import { useMemo } from 'react';
import MapPreview from './MapPreview';

const typeIcon = (type) => {
    const map = {
        restaurant: '🍽️',
        school: '🏫',
        university: '🏫',
        hospital: '🏥',
        bank: '🏦',
        gas_station: '⛽',
        train_station: '🚉',
        fire_station: '🚒',
        pharmacy: '💊',
        supermarket: '🛒',
        cafe: '☕',
        park: '🌳',
        lodging: '🏨',
        police: '👮‍♂️',
        default: '📍',
    };
    if (!type) return map.default;
    const key = String(type).toLowerCase();
    return map[key] || map.default;
};

export default function LocationSummary({
    address,
    maxItems, // Remove default value to show all items
    nearbyPlaces: propNearbyPlaces,
    location: propLocation,
}) {
    const query = useMemo(() => (address || '').trim(), [address]);

    // Use prop data directly, show all items by default unless maxItems is specified
    const nearby = propNearbyPlaces || [];
    const placeItems =
        maxItems && maxItems > 0 ? nearby.slice(0, maxItems) : nearby;
    const mapLocation = propLocation
        ? {
              latitude: propLocation.latitude,
              longitude: propLocation.longitude,
              formattedAddress: propLocation.formattedAddress,
          }
        : query; // fallback to address string

    return (
        <div className='location-summary'>
            <MapPreview location={mapLocation} />

            <div className='nearby-mini'>
                <div className='nearby-header'>
                    <h5>Địa điểm xung quanh (≤ 500m)</h5>
                </div>
                {placeItems.length === 0 && (
                    <p className='nearby-empty'>
                        Không tìm thấy địa điểm lân cận.
                    </p>
                )}
                {placeItems.length > 0 && (
                    <ul
                        className='nearby-mini-list'
                        style={{ maxHeight: '400px', overflowY: 'auto' }}
                    >
                        {placeItems.map((p, i) => (
                            <li
                                key={`${p.latitude}-${p.longitude}-${p.name}-${i}`}
                                className='nearby-mini-item'
                            >
                                <span className='nearby-icon' aria-hidden>
                                    {typeIcon(p.type)}
                                </span>
                                <div className='nearby-content'>
                                    <div className='nearby-title-row'>
                                        <span className='nearby-name'>
                                            {p.name}
                                        </span>
                                        {p.rating > 0 && (
                                            <span
                                                className='place-rating'
                                                title='Xếp hạng'
                                            >
                                                ⭐ {p.rating.toFixed(1)}
                                            </span>
                                        )}
                                    </div>
                                    <div className='nearby-meta'>
                                        <span className='place-type'>
                                            {String(p.type || '').replace(
                                                /_/g,
                                                ' ',
                                            )}
                                        </span>
                                        <span className='dot' />
                                        <span className='place-distance'>
                                            {p.distanceInMeters < 1000
                                                ? `${Math.round(p.distanceInMeters)}m`
                                                : `${(p.distanceInMeters / 1000).toFixed(1)}km`}
                                        </span>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
