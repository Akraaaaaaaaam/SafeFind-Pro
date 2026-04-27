import { useEffect, useMemo, useState } from 'react';
import {
  MapPin,
  ShieldCheck,
  Award,
  Star,
  Mail,
  Phone,
  Save,
  LocateFixed,
  UserCircle2,
  BadgeCheck,
  Activity,
  FileText,
  MessageCircle,
} from 'lucide-react';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';
import { Card, Input, SectionTitle } from '../components/Ui';
import { toast } from 'sonner';
import LoadingOverlay from '../components/common/LoadingOverlay';

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white border">
        <Icon className="h-4 w-4 text-slate-600" />
      </div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="font-semibold text-slate-900">{value || '—'}</p>
      </div>
    </div>
  );
}

function StatBox({ icon: Icon, label, value, color = 'text-slate-700' }) {
  return (
    <div className="rounded-2xl border bg-white p-4">
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 ${color}`} />
        <span className="text-sm text-gray-500">{label}</span>
      </div>
      <div className="mt-2 text-2xl font-bold text-slate-900">{value}</div>
    </div>
  );
}

export default function ProfilePage() {
  const { user, reloadProfile } = useAuth();

  const [form, setForm] = useState({
    fullname: '',
    phone: '',
    city: '',
    latitude: '',
    longitude: '',
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        fullname: user.fullname || '',
        phone: user.phone || '',
        city: user.city || '',
        latitude: user.latitude ?? '',
        longitude: user.longitude ?? '',
      });
    }
  }, [user]);

  const badgeList = useMemo(() => user?.badges || [], [user]);

  const initials = useMemo(() => {
    const name = String(user?.fullname || '').trim();
    if (!name) return 'U';
    const parts = name.split(' ').filter(Boolean);
    return parts
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join('');
  }, [user?.fullname]);

  const stats = useMemo(() => {
    return {
      alerts: user?.stats?.alerts ?? 0,
      reports: user?.stats?.reports ?? 0,
      messages: user?.stats?.messages ?? 0,
    };
  }, [user]);

  const save = async (e) => {
    e.preventDefault();

    if (!form.fullname.trim()) {
      toast.error('Le nom complet est obligatoire.');
      return;
    }

    try {
      setSaving(true);
      await api.put('/users/me', form);
      await reloadProfile();
      toast.success('Profil mis à jour.');
    } catch (error) {
      console.error(error);
      toast.error("Impossible d'enregistrer les modifications.");
    } finally {
      setSaving(false);
    }
  };

  const detectLocation = () => {
    if (!navigator.geolocation) {
      return toast.error('Géolocalisation indisponible.');
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((prev) => ({
          ...prev,
          latitude: String(pos.coords.latitude),
          longitude: String(pos.coords.longitude),
        }));
        toast.success('Position mise à jour.');
      },
      () => toast.error('Impossible de récupérer la position.')
    );
  };

  return (
    <div className="space-y-8">
      <LoadingOverlay
        open={saving}
        title="Enregistrement du profil..."
        subtitle="Mise à jour des informations personnelles en cours."
      />

      <SectionTitle
        title="Mon profil"
        subtitle="Gardez votre profil à jour pour recevoir les alertes pertinentes et participer efficacement."
      />

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card>
          <div className="mb-6 flex items-start gap-4 flex-wrap">
            <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-orange-500 to-red-500 text-2xl font-bold text-white shadow">
              {initials}
            </div>

            <div className="flex-1">
              <h2 className="text-2xl font-bold text-slate-900">
                {user?.fullname || 'Utilisateur'}
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Profil personnel, informations de contact et position.
              </p>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <StatBox
                  icon={Activity}
                  label="Réputation"
                  value={`${user?.reputation ?? 0}%`}
                  color="text-amber-500"
                />
                <StatBox
                  icon={FileText}
                  label="Alertes créées"
                  value={stats.alerts}
                  color="text-red-500"
                />
                <StatBox
                  icon={MessageCircle}
                  label="Messages"
                  value={stats.messages}
                  color="text-blue-500"
                />
              </div>
            </div>
          </div>

          <form onSubmit={save} className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-semibold">Nom complet</span>
              <Input
                value={form.fullname}
                onChange={(e) => setForm({ ...form, fullname: e.target.value })}
                placeholder="Votre nom complet"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold">Téléphone</span>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="Téléphone"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold">Ville</span>
              <Input
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                placeholder="Ville"
              />
            </label>

            <div className="rounded-2xl border bg-slate-50 p-4 text-sm space-y-3">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-slate-500" />
                <span className="text-gray-600">Email :</span>
                <strong className="text-slate-900">{user?.email || '—'}</strong>
              </div>

              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span className="text-gray-600">Rôle :</span>
                <strong className="text-slate-900">{user?.role || 'USER'}</strong>
              </div>

              <div className="flex items-center gap-2">
                <BadgeCheck className="h-4 w-4 text-blue-600" />
                <span className="text-gray-600">Confiance :</span>
                <strong className="text-slate-900">{user?.trustScore ?? 0}/100</strong>
              </div>
            </div>

            <label className="space-y-2">
              <span className="text-sm font-semibold">Latitude</span>
              <Input
                value={form.latitude}
                onChange={(e) => setForm({ ...form, latitude: e.target.value })}
                placeholder="Latitude"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold">Longitude</span>
              <Input
                value={form.longitude}
                onChange={(e) => setForm({ ...form, longitude: e.target.value })}
                placeholder="Longitude"
              />
            </label>

            <div className="md:col-span-2 flex gap-3 flex-wrap">
              <button
                type="button"
                onClick={detectLocation}
                className="inline-flex items-center gap-2 rounded-xl border px-4 py-3 font-semibold hover:bg-slate-50"
              >
                <LocateFixed className="h-4 w-4" />
                Utiliser ma position
              </button>

              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white hover:bg-slate-800"
              >
                <Save className="h-4 w-4" />
                Enregistrer
              </button>
            </div>
          </form>
        </Card>

        <div className="space-y-6">
          <Card>
            <h2 className="text-2xl font-bold">Résumé du compte</h2>

            <div className="mt-4 space-y-3">
              <InfoRow icon={UserCircle2} label="Nom" value={user?.fullname} />
              <InfoRow icon={Mail} label="Email" value={user?.email} />
              <InfoRow
                icon={Phone}
                label="Téléphone"
                value={user?.phone || 'Non renseigné'}
              />
              <InfoRow
                icon={MapPin}
                label="Ville"
                value={user?.city || 'Non renseignée'}
              />
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <StatBox
                icon={FileText}
                label="Alertes créées"
                value={stats.alerts}
                color="text-red-500"
              />
              <StatBox
                icon={ShieldCheck}
                label="Signalements envoyés"
                value={stats.reports}
                color="text-violet-500"
              />
            </div>
          </Card>

          <Card>
            <h2 className="text-2xl font-bold">Badges & confiance</h2>

            <div className="mt-4 space-y-4">
              <div className="rounded-2xl bg-amber-50 p-4 text-sm">
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-amber-600" />
                  <strong>Badges obtenus</strong>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {badgeList.length > 0 ? (
                    badgeList.map((badge) => (
                      <span
                        key={badge}
                        className="rounded-full border bg-white px-3 py-1 text-xs font-semibold text-slate-700"
                      >
                        {badge}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-500">
                      Aucun badge pour le moment.
                    </span>
                  )}
                </div>
              </div>

              <div className="rounded-2xl bg-emerald-50 p-4 text-sm">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-emerald-600" />
                  <strong>Score de confiance</strong>
                </div>
                <p className="mt-2 text-gray-700">{user?.trustScore ?? 0}/100</p>
              </div>
            </div>
          </Card>

          <Card>
            <h2 className="text-2xl font-bold">Protection des données</h2>
            <div className="mt-4 space-y-3 text-sm text-gray-700">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 text-slate-500" />
                <span>
                  Les alertes proches peuvent être mieux ciblées quand votre
                  position est renseignée.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <ShieldCheck className="h-4 w-4 mt-0.5 text-slate-500" />
                <span>
                  Seuls les utilisateurs connectés peuvent consulter les dossiers
                  détaillés.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <Phone className="h-4 w-4 mt-0.5 text-slate-500" />
                <span>
                  Les échanges sont centralisés par affaire pour éviter la perte
                  d’information.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <Award className="h-4 w-4 mt-0.5 text-slate-500" />
                <span>
                  Votre réputation et vos badges renforcent la confiance dans la
                  communauté.
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}