import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Circle,
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import {
  Flame,
  MapPinned,
  Search,
  SlidersHorizontal,
  LocateFixed,
} from 'lucide-react';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import 'leaflet/dist/leaflet.css';

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

function MapController({ center }) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, 13);
  }, [center, map]);

  return null;
}

function groupHotZones(alerts) {
  const groups = {};

  alerts.forEach((alert) => {
    const lat = Number(alert.latitude || 0);
    const lng = Number(alert.longitude || 0);

    const key = `${lat.toFixed(2)}_${lng.toFixed(2)}`;

    if (!groups[key]) {
      groups[key] = {
        lat,
        lng,
        count: 0,
        names: [],
        locationNames: [],
      };
    }

    groups[key].count += 1;
    groups[key].names.push(alert.childName);
    groups[key].locationNames.push(alert.lastSeenLocation || 'Zone inconnue');
  });

  return Object.values(groups)
    .map((group) => ({
      ...group,
      radius:
        group.count >= 5
          ? 1200
          : group.count === 4
          ? 950
          : group.count === 3
          ? 750
          : group.count === 2
          ? 550
          : 350,
      color:
        group.count >= 5
          ? '#dc2626'
          : group.count === 4
          ? '#ea580c'
          : group.count === 3
          ? '#f59e0b'
          : group.count === 2
          ? '#f97316'
          : '#fdba74',
      fillOpacity:
        group.count >= 5
          ? 0.35
          : group.count === 4
          ? 0.3
          : group.count === 3
          ? 0.26
          : group.count === 2
          ? 0.2
          : 0.14,
    }))
    .sort((a, b) => b.count - a.count);
}

function formatStatus(status) {
  if (status === 'ACTIVE') return 'Active';
  if (status === 'RESOLVED') return 'Résolue';
  if (status === 'UNDER_REVIEW') return 'En revue';
  if (status === 'ARCHIVED') return 'Archivée';
  return status || 'Inconnu';
}

function statusBadgeClass(status) {
  if (status === 'ACTIVE') return 'bg-red-100 text-red-600';
  if (status === 'RESOLVED') return 'bg-green-100 text-green-600';
  if (status === 'UNDER_REVIEW') return 'bg-amber-100 text-amber-600';
  return 'bg-slate-100 text-slate-600';
}

export default function MapSection({
  alerts = [],
  selectedAlertId,
  onSelectAlert,
}) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [distanceFilter, setDistanceFilter] = useState('ALL');
  const [showHotZones, setShowHotZones] = useState(true);

  const filteredAlerts = useMemo(() => {
    let list = [...alerts];

    const keyword = search.trim().toLowerCase();
    if (keyword) {
      list = list.filter((alert) => {
        const name = String(alert.childName || '').toLowerCase();
        const location = String(alert.lastSeenLocation || '').toLowerCase();
        return name.includes(keyword) || location.includes(keyword);
      });
    }

    if (statusFilter !== 'ALL') {
      list = list.filter((alert) => alert.status === statusFilter);
    }

    if (priorityFilter !== 'ALL') {
      list = list.filter((alert) => {
        const score = Number(alert.priorityScore || 0);
        if (priorityFilter === 'HIGH') return score >= 80;
        if (priorityFilter === 'MEDIUM') return score >= 50 && score < 80;
        if (priorityFilter === 'LOW') return score < 50;
        return true;
      });
    }

    if (distanceFilter !== 'ALL') {
      list = list.filter((alert) => {
        const distance = Number(alert.distanceKm ?? 999999);
        if (distanceFilter === 'NEAR') return distance <= 2;
        if (distanceFilter === 'MEDIUM') return distance > 2 && distance <= 10;
        if (distanceFilter === 'FAR') return distance > 10;
        return true;
      });
    }

    return list;
  }, [alerts, search, statusFilter, priorityFilter, distanceFilter]);

  const selected =
    filteredAlerts.find((a) => a.id === selectedAlertId) || filteredAlerts[0];

  const [mapCenter, setMapCenter] = useState(
    selected ? [selected.latitude, selected.longitude] : [33.5731, -7.5898]
  );

  useEffect(() => {
    if (selected) {
      setMapCenter([selected.latitude, selected.longitude]);
    }
  }, [selected?.id]);

  const hotZones = useMemo(() => {
    return groupHotZones(filteredAlerts).slice(0, 6);
  }, [filteredAlerts]);

  const resetFilters = () => {
    setSearch('');
    setStatusFilter('ALL');
    setPriorityFilter('ALL');
    setDistanceFilter('ALL');
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border bg-white p-5 shadow-sm">
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Carte interactive temps réel
            </h1>
            <p className="mt-1 text-gray-600">
              Visualisez les alertes, explorez les zones sensibles et centrez la carte sur chaque cas.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700">
            <MapPinned className="h-4 w-4" />
            Live
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr_auto]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par nom ou lieu..."
              className="w-full rounded-xl border py-3 pl-10 pr-4"
            />
          </div>

          <select
            className="w-full rounded-xl border px-4 py-3"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">Tous les statuts</option>
            <option value="ACTIVE">Actives</option>
            <option value="RESOLVED">Résolues</option>
            <option value="UNDER_REVIEW">En revue</option>
            <option value="ARCHIVED">Archivées</option>
          </select>

          <select
            className="w-full rounded-xl border px-4 py-3"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
          >
            <option value="ALL">Toutes priorités</option>
            <option value="HIGH">Priorité élevée</option>
            <option value="MEDIUM">Priorité moyenne</option>
            <option value="LOW">Priorité faible</option>
          </select>

          <select
            className="w-full rounded-xl border px-4 py-3"
            value={distanceFilter}
            onChange={(e) => setDistanceFilter(e.target.value)}
          >
            <option value="ALL">Toutes distances</option>
            <option value="NEAR">Proches (≤ 2 km)</option>
            <option value="MEDIUM">Moyennes (2 à 10 km)</option>
            <option value="FAR">Lointaines (&gt; 10 km)</option>
          </select>

          <button
            type="button"
            onClick={resetFilters}
            className="rounded-xl border px-4 py-3 text-sm font-semibold hover:bg-slate-50"
          >
            Réinitialiser
          </button>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-gray-500">
          <div className="inline-flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4" />
            {filteredAlerts.length} alerte(s) visible(s)
          </div>

          <button
            type="button"
            onClick={() => setShowHotZones((v) => !v)}
            className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 font-semibold ${
              showHotZones
                ? 'border-orange-200 bg-orange-50 text-orange-700'
                : 'bg-white text-slate-700'
            }`}
          >
            <Flame className="h-4 w-4" />
            {showHotZones ? 'Masquer zones chaudes' : 'Afficher zones chaudes'}
          </button>
        </div>
      </div>

      <div className="rounded-3xl border bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Flame className="h-5 w-5 text-red-500" />
          <h2 className="text-xl font-bold text-slate-900">Zones les plus sensibles</h2>
        </div>

        {hotZones.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-6">
            {hotZones.map((zone, index) => (
              <div key={`${zone.lat}-${zone.lng}`} className="rounded-2xl border bg-slate-50 p-4">
                <p className="text-xs text-gray-500">Zone #{index + 1}</p>
                <p className="mt-1 line-clamp-1 font-semibold text-slate-900">
                  {zone.locationNames?.[0] || zone.names?.[0] || 'Zone inconnue'}
                </p>
                <p className="mt-2 text-sm font-semibold text-red-600">
                  {zone.count} cas proches
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">Aucune zone sensible à afficher.</p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="rounded-3xl border bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold">Carte SafeFind</h2>
              <p className="text-sm text-gray-500">
                Cliquez sur une alerte pour centrer automatiquement la carte.
              </p>
            </div>

            <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
              <LocateFixed className="h-4 w-4" />
              Carte active
            </div>
          </div>

          <div className="h-[560px] w-full overflow-hidden rounded-2xl border">
            <MapContainer
              center={mapCenter}
              zoom={13}
              scrollWheelZoom={true}
              style={{ height: '100%', width: '100%' }}
            >
              <MapController center={mapCenter} />

              <TileLayer
                attribution="&copy; OpenStreetMap contributors"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {showHotZones &&
                hotZones.map((zone, index) => (
                  <Circle
                    key={`hot-${index}`}
                    center={[zone.lat, zone.lng]}
                    radius={zone.radius}
                    pathOptions={{
                      color: zone.color,
                      fillColor: zone.color,
                      fillOpacity: zone.fillOpacity,
                      weight: 1,
                    }}
                  />
                ))}

              {filteredAlerts.map((alert) => (
                <Circle
                  key={`c-${alert.id}`}
                  center={[alert.latitude, alert.longitude]}
                  radius={alert.radius}
                  pathOptions={{
                    color: alert.status === 'ACTIVE' ? '#ef4444' : '#10b981',
                    fillColor: alert.status === 'ACTIVE' ? '#fee2e2' : '#d1fae5',
                    fillOpacity: 0.35,
                  }}
                />
              ))}

              {filteredAlerts.map((alert) => (
                <Marker
                  key={`m-${alert.id}`}
                  position={[alert.latitude, alert.longitude]}
                  eventHandlers={{
                    click: () => {
                      onSelectAlert(alert.id);
                      setMapCenter([alert.latitude, alert.longitude]);
                    },
                  }}
                >
                  <Popup>
                    <div className="min-w-[180px] space-y-1">
                      <div className="font-bold">{alert.childName}</div>
                      <div className="text-sm">{alert.lastSeenLocation}</div>
                      <div className="text-sm">Priorité : {alert.priorityScore}/100</div>
                      <div className="text-sm">Temps écoulé : {alert.elapsed}</div>
                      <div className="text-sm">Signalements : {alert.reportCount}</div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </div>

        <div className="rounded-3xl border bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold">Alertes</h2>
            <span className="text-xs text-gray-500">{filteredAlerts.length} résultat(s)</span>
          </div>

          <div className="max-h-[560px] space-y-4 overflow-auto pr-1">
            {filteredAlerts.length > 0 ? (
              filteredAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`rounded-2xl border bg-white p-4 transition hover:shadow ${
                    selectedAlertId === alert.id
                      ? 'border-orange-400 ring-2 ring-orange-100'
                      : ''
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      onSelectAlert(alert.id);
                      setMapCenter([alert.latitude, alert.longitude]);
                    }}
                    className="w-full text-left"
                  >
                    <div className="mb-2 flex items-start justify-between gap-3">
                      <div>
                        <div className="font-bold text-slate-900">{alert.childName}</div>
                        <div className="text-sm text-gray-500">
                          {alert.age} ans • {alert.gender}
                        </div>
                      </div>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClass(
                          alert.status
                        )}`}
                      >
                        {formatStatus(alert.status)}
                      </span>
                    </div>

                    <div className="text-sm text-gray-700">{alert.lastSeenLocation}</div>

                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-500">
                      <div>
                        Temps : <span className="font-semibold text-slate-700">{alert.elapsed}</span>
                      </div>
                      <div>
                        Distance :{' '}
                        <span className="font-semibold text-slate-700">
                          {alert.distanceKm ? `${alert.distanceKm} km` : '—'}
                        </span>
                      </div>
                      <div>
                        Priorité :{' '}
                        <span className="font-semibold text-red-600">{alert.priorityScore}</span>
                      </div>
                      <div>
                        Risque faux :{' '}
                        <span className="font-semibold text-amber-600">
                          {alert.falseInfoScore}%
                        </span>
                      </div>
                    </div>
                  </button>

                  <Link
                    to={`/alerts/${alert.id}`}
                    className="mt-3 inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                  >
                    Voir détail
                  </Link>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed bg-white p-6 text-center text-gray-500">
                Aucune alerte ne correspond aux filtres actuels.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}