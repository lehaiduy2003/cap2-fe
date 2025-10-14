import { useEffect, useMemo, useState } from 'react';
import { axiosInstance } from '../lib/axios';
import MapPreview from './MapPreview';

const typeIcon = (type) => {
    const map = {
        restaurant: '🍽️',
        school: '🏫',
        hospital: '🏥',
        bank: '🏦',
        gas_station: '⛽',
        pharmacy: '💊',
        supermarket: '🛒',
        cafe: '☕',
        park: '🌳',
        lodging: '🏨',
        default: '📍',
    };
    if (!type) return map.default;
    const key = String(type).toLowerCase();
    return map[key] || map.default;
};

export default function LocationSummary({ address, maxItems = 8 }) {
    const query = useMemo(() => (address || '').trim(), [address]);
    const [locationData, setLocationData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        let cancelled = false;
        const fetchData = async () => {
            if (!query) return;
            setLoading(true);
            setError('');
            try {
                const res = await axiosInstance.post('/maps/locations', {
                    address: query,
                });
                if (!cancelled) {
                    setLocationData(res.data);
                }
            } catch (err) {
                if (!cancelled) {
                    setError(
                        err?.response?.data?.message ||
                            'Không tải được vị trí xung quanh',
                    );
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        fetchData();
        return () => {
            cancelled = true;
        };
    }, [query]);

    const nearby = locationData?.nearbyPlaces || [];
    const placeItems = maxItems > 0 ? nearby.slice(0, maxItems) : nearby;
    const mapLocation = locationData?.location
        ? {
              latitude: locationData.location.latitude,
              longitude: locationData.location.longitude,
              formattedAddress: locationData.location.formattedAddress,
          }
        : query; // fallback to address string

    return (
        <div className='location-summary'>
            <MapPreview location={mapLocation} />

            <div className='nearby-mini'>
                <div className='nearby-header'>
                    <h5>Địa điểm xung quanh (≤ 1km)</h5>
                    {loading && <span className='nearby-badge'>Đang tải…</span>}
                    {error && <span className='nearby-error'>{error}</span>}
                </div>
                {placeItems.length === 0 && !loading && !error && (
                    <p className='nearby-empty'>
                        Không tìm thấy địa điểm lân cận.
                    </p>
                )}
                {placeItems.length > 0 && (
                    <ul className='nearby-mini-list'>
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
