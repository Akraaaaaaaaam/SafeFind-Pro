import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/api';
import { socket } from '../api/socket';
import { useAuth } from '../context/AuthContext';
import LoadingOverlay from '../components/common/LoadingOverlay';
import MapSection from '../components/MapSection';

export default function MapPage() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [selectedAlertId, setSelectedAlertId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [params] = useSearchParams();

  const loadAlerts = async () => {
    try {
      setLoading(true);

      const query =
        user?.latitude && user?.longitude
          ? `?nearLat=${user.latitude}&nearLng=${user.longitude}`
          : '';

      const { data } = await api.get(`/alerts${query}`);
      const list = data.alerts || [];

      setAlerts(list);

      const fromQuery = Number(params.get('alert')) || null;
      setSelectedAlertId(fromQuery || list?.[0]?.id || null);
    } catch (error) {
      console.error('Erreur chargement carte:', error);
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, [user?.latitude, user?.longitude]);

  useEffect(() => {
    const refresh = () => loadAlerts();

    socket.on('alert:created', refresh);
    socket.on('alert:resolved', refresh);
    socket.on('report:created', refresh);
    socket.on('alert:moderated', refresh);

    const timer = setInterval(refresh, 12000);

    return () => {
      socket.off('alert:created', refresh);
      socket.off('alert:resolved', refresh);
      socket.off('report:created', refresh);
      socket.off('alert:moderated', refresh);
      clearInterval(timer);
    };
  }, [user?.latitude, user?.longitude]);

  return (
    <>
      <LoadingOverlay
        open={loading}
        title="Chargement de la carte..."
        subtitle="Récupération des alertes, zones et positions en cours."
      />

      <MapSection
        alerts={alerts}
        selectedAlertId={selectedAlertId}
        onSelectAlert={setSelectedAlertId}
      />
    </>
  );
}