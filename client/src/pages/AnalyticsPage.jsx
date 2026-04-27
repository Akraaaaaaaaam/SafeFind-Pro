import { useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  Clock3,
  MapPin,
  ShieldCheck,
  Search,
  Filter,
  RefreshCw,
  TrendingUp,
  Users,
  Siren,
  BadgeCheck,
  Sparkles,
} from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../api/api';
import LoadingOverlay from '../components/common/LoadingOverlay';
import { Card } from '../components/Ui';

export default function AnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const [locationSearch, setLocationSearch] = useState('');
  const [hourFilter, setHourFilter] = useState('ALL');

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const res = await api.get('/analytics');
      setData(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  const filteredLocations = useMemo(() => {
    if (!data?.topLocations) return [];
    const keyword = locationSearch.trim().toLowerCase();

    if (!keyword) return data.topLocations;

    return data.topLocations.filter((row) =>
      String(row.name || '').toLowerCase().includes(keyword)
    );
  }, [data, locationSearch]);

  const filteredHours = useMemo(() => {
    if (!data?.byHour) return [];

    if (hourFilter === 'ALL') return data.byHour;
    if (hourFilter === 'MORNING') return data.byHour.filter((row) => row.hour >= 6 && row.hour < 12);
    if (hourFilter === 'AFTERNOON') return data.byHour.filter((row) => row.hour >= 12 && row.hour < 18);
    if (hourFilter === 'EVENING') return data.byHour.filter((row) => row.hour >= 18 && row.hour < 24);
    if (hourFilter === 'NIGHT') return data.byHour.filter((row) => row.hour >= 0 && row.hour < 6);

    return data.byHour;
  }, [data, hourFilter]);

  const maxLocationCount = useMemo(() => {
    return Math.max(...filteredLocations.map((row) => row.count), 1);
  }, [filteredLocations]);

  const maxHourCount = useMemo(() => {
    return Math.max(...filteredHours.map((row) => row.count), 1);
  }, [filteredHours]);

  const topLocation = filteredLocations[0];
  const peakHour = [...filteredHours].sort((a, b) => b.count - a.count)[0];

  return (
    <div className="space-y-8">
      <LoadingOverlay
        open={loading}
        title="Chargement des statistiques..."
        subtitle="Analyse des lieux, heures, rôles et indicateurs en cours."
      />

      <div className="rounded-3xl border bg-gradient-to-br from-white via-[#fff8f4] to-[#fff4ea] p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="inline-flex rounded-full bg-orange-100 px-4 py-2 text-sm font-medium text-orange-700">
              Tableau de bord analytique
            </div>
            <h1 className="mt-4 text-4xl font-extrabold text-slate-900">
              Analytics & Data Science
            </h1>
            <p className="mt-3 max-w-3xl text-gray-600">
              Suivez les zones les plus sensibles, les heures critiques, la répartition des rôles,
              les badges communautaires et l’interprétation des scores utilisés par l’application.
            </p>
          </div>

          <button
            type="button"
            onClick={loadAnalytics}
            className="inline-flex items-center gap-2 rounded-xl border bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-50"
          >
            <RefreshCw className="h-4 w-4" />
            Actualiser
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <InsightCard
            icon={MapPin}
            title="Zone dominante"
            value={topLocation?.name || '—'}
            subtitle={topLocation ? `${topLocation.count} cas recensés` : 'Aucune donnée'}
          />
          <InsightCard
            icon={Clock3}
            title="Créneau le plus sensible"
            value={peakHour ? `${peakHour.hour}h` : '—'}
            subtitle={peakHour ? `${peakHour.count} cas` : 'Aucune donnée'}
          />
          <InsightCard
            icon={TrendingUp}
            title="Vision globale"
            value={`${data?.totals?.alerts ?? 0} alertes`}
            subtitle="Vue synthétique de l’activité"
          />
        </div>
      </div>

      {data ? (
        <>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-5">
            <StatCard label="Total alertes" value={data.totals?.alerts ?? 0} icon={Siren} />
            <StatCard label="Alertes actives" value={data.totals?.active ?? 0} icon={ShieldCheck} />
            <StatCard label="Alertes résolues" value={data.totals?.resolved ?? 0} icon={Clock3} />
            <StatCard label="Utilisateurs" value={data.totals?.users ?? 0} icon={Users} />
            <StatCard label="Signalements" value={data.totals?.reports ?? 0} icon={BarChart3} />
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <Card className="h-full">
              <div className="mb-5 flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Zones les plus touchées</h2>
                  <p className="text-sm text-gray-500">
                    Recherche et classement des localisations les plus fréquemment signalées
                  </p>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  <MapPin className="h-4 w-4" />
                  Top zones
                </div>
              </div>

              <div className="relative mb-5">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  value={locationSearch}
                  onChange={(e) => setLocationSearch(e.target.value)}
                  placeholder="Rechercher une zone..."
                  className="w-full rounded-xl border py-3 pl-10 pr-4"
                />
              </div>

              <div className="space-y-4">
                {filteredLocations.length > 0 ? (
                  filteredLocations.map((row, index) => (
                    <motion.div
                      key={row.name}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.22, delay: index * 0.03 }}
                    >
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700">
                            {index + 1}
                          </div>
                          <span className="font-medium text-slate-900">{row.name}</span>
                        </div>
                        <span className="text-sm font-semibold text-slate-700">{row.count}</span>
                      </div>

                      <div className="h-3 overflow-hidden rounded-full bg-slate-200">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.max(8, (row.count / maxLocationCount) * 100)}%` }}
                          transition={{ duration: 0.5, delay: index * 0.04 }}
                          className="h-3 rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"
                        />
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">Aucune zone ne correspond à la recherche.</p>
                )}
              </div>
            </Card>

            <Card className="h-full">
              <div className="mb-5 flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Heures des disparitions</h2>
                  <p className="text-sm text-gray-500">
                    Répartition des cas selon les créneaux horaires
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-gray-500" />
                  <select
                    className="rounded-xl border px-3 py-2 text-sm"
                    value={hourFilter}
                    onChange={(e) => setHourFilter(e.target.value)}
                  >
                    <option value="ALL">Toute la journée</option>
                    <option value="MORNING">Matin</option>
                    <option value="AFTERNOON">Après-midi</option>
                    <option value="EVENING">Soir</option>
                    <option value="NIGHT">Nuit</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
                {filteredHours.map((row, index) => (
                  <motion.div
                    key={row.hour}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.22, delay: index * 0.02 }}
                    className="rounded-2xl border bg-white p-3 text-center shadow-sm"
                  >
                    <div className="text-xs text-gray-500">{row.hour}h</div>
                    <div className="mt-3 flex h-28 items-end overflow-hidden rounded-xl bg-orange-100">
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${Math.max(6, (row.count / maxHourCount) * 100)}%` }}
                        transition={{ duration: 0.45, delay: index * 0.02 }}
                        className="w-full rounded-xl bg-gradient-to-t from-orange-500 to-amber-400"
                      />
                    </div>
                    <div className="mt-2 text-sm font-bold text-slate-900">{row.count}</div>
                  </motion.div>
                ))}
              </div>
            </Card>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <Card>
              <div className="mb-4 flex items-center gap-2">
                <Users className="h-5 w-5 text-slate-700" />
                <h2 className="text-2xl font-bold text-slate-900">Répartition des rôles</h2>
              </div>

              <div className="space-y-3">
                {data.userRoles?.map((row, index) => (
                  <motion.div
                    key={row.role}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.03 }}
                    className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3"
                  >
                    <span className="font-medium text-slate-800">{row.role}</span>
                    <strong className="text-slate-900">{row.count}</strong>
                  </motion.div>
                ))}
              </div>
            </Card>

            <Card>
              <div className="mb-4 flex items-center gap-2">
                <BadgeCheck className="h-5 w-5 text-slate-700" />
                <h2 className="text-2xl font-bold text-slate-900">Badges communautaires</h2>
              </div>

              <div className="space-y-3">
                {Object.entries(data.badgeStats || {}).map(([badge, count], index) => (
                  <motion.div
                    key={badge}
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.03 }}
                    className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3"
                  >
                    <span className="font-medium text-slate-800">{badge}</span>
                    <strong className="text-slate-900">{count}</strong>
                  </motion.div>
                ))}
              </div>
            </Card>
          </div>

          <Card className="bg-gradient-to-br from-white to-slate-50">
            <div className="mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-violet-600" />
              <h2 className="text-2xl font-bold text-slate-900">Comment sont calculés les scores</h2>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border bg-white p-4">
                <h3 className="font-bold text-slate-900">Priorité</h3>
                <p className="mt-2 text-sm text-gray-700">{data.explanation?.priority}</p>
              </div>

              <div className="rounded-2xl border bg-white p-4">
                <h3 className="font-bold text-slate-900">Risque de mauvaise information</h3>
                <p className="mt-2 text-sm text-gray-700">{data.explanation?.falseInfo}</p>
              </div>

              <div className="rounded-2xl border bg-white p-4">
                <h3 className="font-bold text-slate-900">Reconnaissance faciale</h3>
                <p className="mt-2 text-sm text-gray-700">
                  La comparaison image de référence / image témoin est faite côté service IA FastAPI.
                  Le résultat aide la modération mais ne remplace pas une validation humaine.
                </p>
              </div>
            </div>
          </Card>
        </>
      ) : null}
    </div>
  );
}

function InsightCard({ icon: Icon, title, value, subtitle }) {
  return (
    <div className="rounded-2xl border bg-white/80 p-4 shadow-sm">
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
        <Icon className="h-5 w-5" />
      </div>
      <div className="text-sm text-gray-500">{title}</div>
      <div className="mt-1 text-xl font-bold text-slate-900">{value}</div>
      <div className="mt-1 text-sm text-gray-600">{subtitle}</div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon }) {
  return (
    <Card className="h-full">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-r from-red-500 to-orange-500 text-white">
        <Icon className="h-6 w-6" />
      </div>
      <div className="text-sm text-gray-500">{label}</div>
      <div className="text-4xl font-bold text-slate-900">{value}</div>
    </Card>
  );
}