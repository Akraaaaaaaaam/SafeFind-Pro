
import { MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import 'leaflet/dist/leaflet.css';
L.Icon.Default.mergeOptions({ iconRetinaUrl: markerIcon2x, iconUrl: markerIcon, shadowUrl: markerShadow });
function ClickPicker({ value, onChange }) {
  useMapEvents({ click(e) { onChange({ latitude: e.latlng.lat.toFixed(6), longitude: e.latlng.lng.toFixed(6) }); } });
  return value?.latitude && value?.longitude ? <Marker position={[Number(value.latitude), Number(value.longitude)]} /> : null;
}
export default function MapPicker({ value, onChange, height='280px' }) {
  const center = value?.latitude && value?.longitude ? [Number(value.latitude), Number(value.longitude)] : [33.5731, -7.5898];
  return <div className="overflow-hidden rounded-2xl border"><MapContainer center={center} zoom={13} style={{ height, width: '100%' }}><TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" /><ClickPicker value={value} onChange={onChange} /></MapContainer></div>;
}
