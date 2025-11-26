import React, { useEffect, useState } from 'react';

interface LocationDisplayProps {
	coordsOrAddress: string;
}

// Fungsi deteksi koordinat
function isCoords(str: string): boolean {
	return /^-?\d+\.\d+\s*,\s*-?\d+\.\d+$/.test(str.trim());
}

const LocationDisplay: React.FC<LocationDisplayProps> = ({ coordsOrAddress }) => {
	const [address, setAddress] = useState<string | null>(null);

	useEffect(() => {
		if (isCoords(coordsOrAddress)) {
			const [lat, lng] = coordsOrAddress.split(',').map(Number);
			fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
				.then(res => res.json())
				.then(data => setAddress(data.display_name || coordsOrAddress))
				.catch(() => setAddress(coordsOrAddress));
		} else {
			setAddress(coordsOrAddress);
		}
	}, [coordsOrAddress]);

	return (
		<div style={{ fontSize: 12, color: '#888' }}>
			{address || coordsOrAddress}
		</div>
	);
};

export default LocationDisplay;
