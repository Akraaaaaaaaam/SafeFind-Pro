import { useEffect, useMemo, useState } from 'react';
import {
  ShieldCheck,
  Users,
  FileText,
  Clock3,
  Archive,
  CheckCircle2,
  AlertTriangle,
  Search,
  RefreshCw,
  Eye,
  Shield,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../api/api';
import { Card } from '../components/Ui';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import LoadingOverlay from '../components/common/LoadingOverlay';

function StatusBadge({ status }) {
  const label =
    status === 'ACTIVE'
      ? 'Active'
      : status === 'RESOLVED'
      ? 'Résolue'
      : status === 'UNDER_REVIEW'
      ? 'En revue'
      : status === 'ARCHIVED'
      ? 'Archivée'
      : status || 'Inconnu';

  const style =
    status === 'ACTIVE'
      ? 'bg-emerald-100 text-emerald-700'
      : status === 'RESOLVED'
      ? 'bg-blue-100 text-blue-700'
      : status === 'UNDER_REVIEW'
      ? 'bg-amber-100 text-amber-700'
      : 'bg-slate-100 text-slate-700';

  return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${style}`}>{label}</span>;
}

function StatCard({ icon: Icon, label, value, color = 'text-slate-700' }) {
  return (
    <Card>
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
        <Icon className={`h-5 w-5 ${color}`} />
      </div>
      <div className="text-sm text-gray-500">{label}</div>
      <div className="text-4xl font-bold text-slate-900">{value}</div>
    </Card>
  );
}

export default function AdminPage() {
  const { user } = useAuth();

  const [data, setData] = useState({
    stats: {
      totalUsers: 0,
      totalAlerts: 0,
      totalReports: 0,
      totalModeration: 0,
      underReviewAlerts: 0,
      activeAlerts: 0,
      archivedAlerts: 0,
      resolvedAlerts: 0,
    },
    users: [],
    pendingAlerts: [],
    recentAlerts: [],
    reports: [],
    moderation: [],
  });

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [search, setSearch] = useState('');

  const isAllowed = user?.role === 'ADMIN' || user?.role === 'MODERATOR';

  const load = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/dashboard');
      setData(res.data);
    } catch (error) {
      console.error(error);
      toast.error("Impossible de charger le panel d'administration.");
    } finally {
      setLoading(false);
    }
  };

  const moderate = async (id, action) => {
    try {
      setActionLoading(true);
      await api.post(`/admin/alerts/${id}/review`, {
        action,
        reason: `Action ${action} depuis admin panel`,
      });
      toast.success('Action de modération enregistrée.');
      await load();
    } catch (error) {
      console.error(error);
      toast.error('Impossible d’exécuter cette action.');
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    if (isAllowed) load();
  }, [user?.role]);

  const filteredPendingAlerts = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return data.pendingAlerts || [];

    return (data.pendingAlerts || []).filter((alert) => {
      const child = String(alert.childName || '').toLowerCase();
      const location = String(alert.lastSeenLocation || '').toLowerCase();
      const creator = String(alert.createdBy?.fullname || '').toLowerCase();
      return child.includes(keyword) || location.includes(keyword) || creator.includes(keyword);
    });
  }, [data.pendingAlerts, search]);

  if (!isAllowed) {
    return (
      <Card>
        <h1 className="text-2xl font-bold">Accès refusé</h1>
        <p className="mt-2 text-gray-600">Cette page est réservée aux administrateurs et modérateurs.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <LoadingOverlay
        open={loading || actionLoading}
        title={actionLoading ? 'Action de modération...' : 'Chargement du panel admin...'}
        subtitle={
          actionLoading
            ? 'Mise à jour des statuts en cours.'
            : 'Récupération des alertes, signalements et journaux.'
        }
      />

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Panel Admin / Modération</h1>
          <p className="text-gray-600 mt-1">
            Validation des alertes, supervision des dossiers et suivi des actions.
          </p>
        </div>

        <button
          type="button"
          onClick={load}
          className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold hover:bg-slate-50"
        >
          <RefreshCw className="h-4 w-4" />
          Actualiser
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Users} label="Utilisateurs" value={data.stats.totalUsers} color="text-blue-600" />
        <StatCard icon={FileText} label="Alertes totales" value={data.stats.totalAlerts} color="text-red-600" />
        <StatCard icon={ShieldCheck} label="Signalements" value={data.stats.totalReports} color="text-violet-600" />
        <StatCard icon={Clock3} label="Actions de modération" value={data.stats.totalModeration} color="text-amber-600" />
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border bg-amber-50 p-4">
          <p className="text-sm text-amber-700">En revue</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{data.stats.underReviewAlerts}</p>
        </div>
        <div className="rounded-2xl border bg-emerald-50 p-4">
          <p className="text-sm text-emerald-700">Actives</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{data.stats.activeAlerts}</p>
        </div>
        <div className="rounded-2xl border bg-slate-50 p-4">
          <p className="text-sm text-slate-700">Archivées</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{data.stats.archivedAlerts}</p>
        </div>
        <div className="rounded-2xl border bg-blue-50 p-4">
          <p className="text-sm text-blue-700">Résolues</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{data.stats.resolvedAlerts}</p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
            <div>
              <h2 className="text-xl font-bold">Alertes à valider</h2>
              <p className="text-sm text-gray-500">
                Les alertes en revue doivent être approuvées avant diffusion publique.
              </p>
            </div>
            <div className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
              {filteredPendingAlerts.length} en attente
            </div>
          </div>

          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par nom, lieu ou créateur..."
              className="w-full rounded-xl border py-3 pl-10 pr-4"
            />
          </div>

          <div className="space-y-4">
            {filteredPendingAlerts.length > 0 ? (
              filteredPendingAlerts.map((a) => (
                <div key={a.id} className="rounded-2xl border p-4">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-[260px] flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="font-bold text-slate-900">{a.childName}</div>
                        <StatusBadge status={a.status} />
                      </div>

                      <div className="mt-1 text-sm text-gray-500">
                        Créée par {a.createdBy?.fullname || 'Inconnu'} • {a.lastSeenLocation}
                      </div>

                      <div className="mt-3 grid gap-2 sm:grid-cols-2 text-xs text-gray-600">
                        <div>
                          Priorité : <span className="font-semibold text-red-600">{a.priorityScore ?? 0}/100</span>
                        </div>
                        <div>
                          Risque faux : <span className="font-semibold text-amber-600">{a.falseInfoScore ?? 0}%</span>
                        </div>
                        <div>
                          Complétude : <span className="font-semibold">{a.completenessScore ?? 0}%</span>
                        </div>
                        <div>
                          Signalements : <span className="font-semibold">{a.reportCount ?? 0}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Link
                        to={`/alerts/${a.id}`}
                        className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold hover:bg-slate-50"
                      >
                        <Eye className="h-4 w-4" />
                        Voir
                      </Link>

                      <button
                        type="button"
                        onClick={() => moderate(a.id, 'approve')}
                        className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                      >
                        Approuver
                      </button>

                      <button
                        type="button"
                        onClick={() => moderate(a.id, 'review')}
                        className="rounded-xl bg-amber-500 px-3 py-2 text-sm font-semibold text-white hover:bg-amber-600"
                      >
                        En revue
                      </button>

                      <button
                        type="button"
                        onClick={() => moderate(a.id, 'archive')}
                        className="rounded-xl bg-slate-700 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                      >
                        Archiver
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed p-6 text-center text-gray-500">
                Aucune alerte en attente de validation.
              </div>
            )}
          </div>
        </Card>

        <div className="space-y-6">
          <Card>
            <h2 className="mb-4 text-xl font-bold">Signalements sensibles</h2>
            <div className="space-y-3">
              {(data.reports || []).length > 0 ? (
                data.reports.map((report) => (
                  <div key={report.id} className="rounded-2xl border p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-bold text-slate-900">
                          {report.user?.fullname || 'Utilisateur'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {report.alert?.childName || 'Cas'} • {report.locationLabel || 'Lieu inconnu'}
                        </div>
                      </div>

                      <div
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          Number(report.falseInfoRisk || 0) > 50
                            ? 'bg-red-100 text-red-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        Risque {report.falseInfoRisk ?? 0}%
                      </div>
                    </div>

                    <p className="mt-2 text-sm text-gray-700 line-clamp-2">
                      {report.description || 'Aucune description'}
                    </p>

                    <div className="mt-3">
                      <Link
                        to={`/reports/${report.id}`}
                        className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold hover:bg-slate-50"
                      >
                        <AlertTriangle className="h-4 w-4" />
                        Ouvrir le signalement
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed p-6 text-center text-gray-500">
                  Aucun signalement sensible récent.
                </div>
              )}
            </div>
          </Card>

          <Card>
            <h2 className="mb-4 text-xl font-bold">Journal de modération</h2>
            <div className="space-y-3">
              {(data.moderation || []).length > 0 ? (
                data.moderation.map((m) => (
                  <div key={m.id} className="rounded-2xl border p-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Shield className="h-4 w-4 text-slate-600" />
                      <div className="font-bold text-slate-900">{m.action}</div>
                    </div>

                    <div className="mt-1 text-sm text-gray-500">
                      {m.actor?.fullname || 'Utilisateur'} ({m.actor?.role || 'ROLE'}) • {m.alert?.childName || 'Alerte'}
                    </div>

                    <div className="mt-2 text-sm text-gray-700">{m.reason || '—'}</div>

                    <div className="mt-2 text-xs text-gray-400">
                      {m.createdAt ? new Date(m.createdAt).toLocaleString() : '—'}
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed p-6 text-center text-gray-500">
                  Aucune action de modération récente.
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}