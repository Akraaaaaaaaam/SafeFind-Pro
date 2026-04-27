import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ImagePlus,
  LocateFixed,
  Search,
  SlidersHorizontal,
  Sparkles,
  X,
  Pencil,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import api from '../api/api';
import { socket } from '../api/socket';
import LoadingOverlay from '../components/common/LoadingOverlay';
import MapPicker from '../components/MapPicker';
import { Card, Field, Input, SectionTitle, TextArea } from '../components/Ui';
import { useAuth } from '../context/AuthContext';

const ALERT_DRAFT_KEY = 'safefind_alert_draft_v1';

const initialAlert = {
  childName: '',
  age: '',
  gender: 'Garçon',
  heightCm: '',
  weightKg: '',
  eyeColor: '',
  hairColor: '',
  clothesTop: '',
  clothesBottom: '',
  shoes: '',
  accessories: '',
  distinctiveSigns: '',
  medicalNotes: '',
  emergencyContacts: '',
  description: '',
  lastSeenLocation: '',
  latitude: '',
  longitude: '',
  missingSince: '',
  radius: 2500,
};

const alertSteps = [
  { id: 1, title: 'Identité', subtitle: 'Infos principales' },
  { id: 2, title: 'Apparence', subtitle: 'Description physique' },
  { id: 3, title: 'Disparition', subtitle: 'Lieu et heure' },
  { id: 4, title: 'Validation', subtitle: 'Photo et résumé' },
];

function validateAlert(form) {
  const errors = {};

  [
    'childName',
    'age',
    'gender',
    'heightCm',
    'weightKg',
    'eyeColor',
    'hairColor',
    'clothesTop',
    'clothesBottom',
    'shoes',
    'description',
    'lastSeenLocation',
    'latitude',
    'longitude',
    'missingSince',
  ].forEach((key) => {
    if (!String(form[key] ?? '').trim()) errors[key] = 'Champ obligatoire';
  });

  if (form.childName && !/^[a-zA-ZÀ-ÿ' -]{3,}$/.test(form.childName)) {
    errors.childName = 'Nom invalide';
  }
  if (form.age && (Number(form.age) < 1 || Number(form.age) > 17)) {
    errors.age = 'Âge entre 1 et 17';
  }
  if (form.heightCm && (Number(form.heightCm) < 40 || Number(form.heightCm) > 220)) {
    errors.heightCm = 'Taille invalide';
  }
  if (form.weightKg && (Number(form.weightKg) < 3 || Number(form.weightKg) > 180)) {
    errors.weightKg = 'Poids invalide';
  }

  return errors;
}

function stepContentAnimation() {
  return {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -12 },
    transition: { duration: 0.22 },
  };
}

function ErrorText({ children }) {
  if (!children) return null;
  return <p className="mt-1 text-xs font-medium text-red-600">{children}</p>;
}

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
      ? 'bg-red-100 text-red-700'
      : status === 'RESOLVED'
      ? 'bg-green-100 text-green-700'
      : status === 'UNDER_REVIEW'
      ? 'bg-amber-100 text-amber-700'
      : 'bg-slate-100 text-slate-700';

  return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${style}`}>{label}</span>;
}

export default function AlertsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const editId = searchParams.get('edit');

  const [alerts, setAlerts] = useState([]);
  const [selectedId, setSelectedId] = useState(null);

  const [form, setForm] = useState(initialAlert);
  const [alertPhoto, setAlertPhoto] = useState(null);
  const [alertPhotoPreview, setAlertPhotoPreview] = useState('');
  const [errors, setErrors] = useState({});

  const [pageLoading, setPageLoading] = useState(true);
  const [submittingAlert, setSubmittingAlert] = useState(false);
  const [editLoading, setEditLoading] = useState(false);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [distanceFilter, setDistanceFilter] = useState('ALL');

  const [alertStep, setAlertStep] = useState(1);

  const loadAlerts = async () => {
    try {
      setPageLoading(true);

      const query =
        user?.latitude && user?.longitude
          ? `?nearLat=${user.latitude}&nearLng=${user.longitude}`
          : '';

      const { data } = await api.get(`/alerts${query}`);
      const list = data.alerts || [];
      setAlerts(list);
      setSelectedId((prev) => prev || list[0]?.id || null);
    } finally {
      setPageLoading(false);
    }
  };

  const loadAlertForEdit = async (alertId) => {
    if (!alertId) return;

    try {
      setEditLoading(true);
      const { data } = await api.get(`/alerts/${alertId}`);
      const alert = data.alert;

      setForm({
        childName: alert.childName || '',
        age: alert.age || '',
        gender: alert.gender || 'Garçon',
        heightCm: alert.heightCm || '',
        weightKg: alert.weightKg || '',
        eyeColor: alert.eyeColor || '',
        hairColor: alert.hairColor || '',
        clothesTop: alert.clothesTop || '',
        clothesBottom: alert.clothesBottom || '',
        shoes: alert.shoes || '',
        accessories: alert.accessories || '',
        distinctiveSigns: alert.distinctiveSigns || '',
        medicalNotes: alert.medicalNotes || '',
        emergencyContacts: alert.emergencyContacts || '',
        description: alert.description || '',
        lastSeenLocation: alert.lastSeenLocation || '',
        latitude: alert.latitude || '',
        longitude: alert.longitude || '',
        missingSince: alert.missingSince
          ? new Date(alert.missingSince).toISOString().slice(0, 16)
          : '',
        radius: alert.radius || 2500,
      });

      setAlertPhoto(null);
      setAlertPhotoPreview(alert.photoUrl || '');
      setAlertStep(1);
      setErrors({});
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error(error);
      toast.error("Impossible de charger l’alerte à modifier.");
    } finally {
      setEditLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts().catch(() => {});
  }, []);

  useEffect(() => {
    const refresh = () => loadAlerts().catch(() => {});
    ['alert:created', 'alert:resolved', 'report:created', 'message:created', 'alert:moderated'].forEach((evt) =>
      socket.on(evt, refresh)
    );

    return () =>
      ['alert:created', 'alert:resolved', 'report:created', 'message:created', 'alert:moderated'].forEach((evt) =>
        socket.off(evt, refresh)
      );
  }, []);

  useEffect(() => {
    if (!alertPhoto) return;

    const url = URL.createObjectURL(alertPhoto);
    setAlertPhotoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [alertPhoto]);

  useEffect(() => {
    if (editId) {
      loadAlertForEdit(editId);
      return;
    }

    try {
      const saved = localStorage.getItem(ALERT_DRAFT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.form) setForm((prev) => ({ ...prev, ...parsed.form }));
        if (parsed?.step) setAlertStep(parsed.step);
      }
    } catch {}
  }, [editId]);

  useEffect(() => {
    if (editId) return;
    try {
      localStorage.setItem(
        ALERT_DRAFT_KEY,
        JSON.stringify({
          form,
          step: alertStep,
        })
      );
    } catch {}
  }, [form, alertStep, editId]);

  const sortedAlerts = useMemo(() => {
    return [...alerts].sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0));
  }, [alerts]);

  const filteredAlerts = useMemo(() => {
    let list = [...sortedAlerts];

    const keyword = search.trim().toLowerCase();
    if (keyword) {
      list = list.filter((alert) => {
        const name = String(alert.childName || '').toLowerCase();
        const place = String(alert.lastSeenLocation || '').toLowerCase();
        return name.includes(keyword) || place.includes(keyword);
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
  }, [sortedAlerts, search, statusFilter, priorityFilter, distanceFilter]);

  const completionPercent = useMemo(() => {
    const totalFields = 15;
    const filled = [
      form.childName,
      form.age,
      form.gender,
      form.heightCm,
      form.weightKg,
      form.eyeColor,
      form.hairColor,
      form.clothesTop,
      form.clothesBottom,
      form.shoes,
      form.description,
      form.lastSeenLocation,
      form.latitude,
      form.longitude,
      form.missingSince,
    ].filter((v) => String(v ?? '').trim() !== '').length;

    return Math.round((filled / totalFields) * 100);
  }, [form]);

  const detectLocation = (setter) => {
    if (!navigator.geolocation) return toast.error('Géolocalisation indisponible.');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setter((prev) => ({
          ...prev,
          latitude: String(pos.coords.latitude),
          longitude: String(pos.coords.longitude),
        }));
        toast.success('Position GPS récupérée.');
      },
      () => toast.error('Impossible de récupérer votre position.')
    );
  };

  const resetFilters = () => {
    setSearch('');
    setStatusFilter('ALL');
    setPriorityFilter('ALL');
    setDistanceFilter('ALL');
  };

  const resetFormCompletely = () => {
    setForm(initialAlert);
    setAlertPhoto(null);
    setAlertPhotoPreview('');
    setAlertStep(1);
    setErrors({});
    localStorage.removeItem(ALERT_DRAFT_KEY);

    const next = new URLSearchParams(searchParams);
    next.delete('edit');
    setSearchParams(next);
  };

  const getAlertStepValidationErrors = (stepId) => {
    const fullErrors = validateAlert(form);

    const stepFields = {
      1: ['childName', 'age', 'gender'],
      2: ['heightCm', 'weightKg', 'eyeColor', 'hairColor', 'clothesTop', 'clothesBottom', 'shoes'],
      3: ['missingSince', 'lastSeenLocation', 'latitude', 'longitude'],
      4: ['description'],
    };

    const allowedFields = stepFields[stepId] || [];
    const scoped = {};

    allowedFields.forEach((field) => {
      if (fullErrors[field]) scoped[field] = fullErrors[field];
    });

    return scoped;
  };

  const canGoToAlertStep = (stepId) => Object.keys(getAlertStepValidationErrors(stepId)).length === 0;

  const nextAlertStep = () => {
    const scopedErrors = getAlertStepValidationErrors(alertStep);
    setErrors((prev) => ({ ...prev, ...scopedErrors }));

    if (Object.keys(scopedErrors).length > 0) {
      toast.error('Veuillez compléter correctement cette étape avant de continuer.');
      return;
    }

    if (alertStep < 4) setAlertStep((prev) => prev + 1);
  };

  const prevAlertStep = () => {
    if (alertStep > 1) setAlertStep((prev) => prev - 1);
  };

  const submitAlert = async (e) => {
    e.preventDefault();
    const validation = validateAlert(form);
    setErrors(validation);

    if (Object.keys(validation).length) {
      toast.error('Corrige les champs invalides.');
      const firstStepWithError = [1, 2, 3, 4].find((stepId) => !canGoToAlertStep(stepId));
      if (firstStepWithError) setAlertStep(firstStepWithError);
      return;
    }

    try {
      setSubmittingAlert(true);

      const payload = new FormData();
      Object.entries(form).forEach(([k, v]) => payload.append(k, v));
      if (alertPhoto && typeof alertPhoto !== 'string') {
        payload.append('photo', alertPhoto);
      }

      let data;

      if (editId) {
        const res = await api.put(`/alerts/${editId}`, payload, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        data = res.data;
        toast.success("Alerte modifiée avec succès.");
      } else {
        const res = await api.post('/alerts', payload, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        data = res.data;
        toast.success('Alerte créée avec succès.');
      }

      resetFormCompletely();
      await loadAlerts();

      if (data?.alert?.id) {
        navigate(`/alerts/${data.alert.id}`);
      }
    } catch (error) {
      console.error(error);
      toast.error(
        error?.response?.data?.message ||
          (editId ? "Erreur modification alerte" : 'Erreur création alerte')
      );
    } finally {
      setSubmittingAlert(false);
    }
  };

  return (
    <div className="space-y-8">
      <LoadingOverlay
        open={pageLoading}
        title="Chargement des alertes..."
        subtitle="Récupération des cas actifs et de la liste des alertes."
      />

      <LoadingOverlay
        open={submittingAlert}
        title={editId ? "Modification de l’alerte..." : "Création de l’alerte..."}
        subtitle="Enregistrement du dossier en cours. Ne quittez pas la page."
      />

      <LoadingOverlay
        open={editLoading}
        title="Chargement de l’alerte..."
        subtitle="Préparation du formulaire de modification."
      />

      <SectionTitle
        title={editId ? "Modifier une alerte" : "Gestion des alertes"}
        subtitle={
          editId
            ? "Mettez à jour l’alerte existante puis enregistrez les changements."
            : "Créez une alerte de manière guidée puis consultez la liste des cas existants."
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1.12fr_0.88fr]">
        <Card>
          <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-2xl font-bold">
                {editId ? "Modifier l’alerte" : "Créer une alerte professionnelle"}
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                {editId
                  ? "Seul le créateur de l’alerte ou un admin/modérateur doit faire cette action."
                  : "Le brouillon est sauvegardé automatiquement si vous quittez la page."}
              </p>
            </div>

            <div className="min-w-[180px]">
              <div className="mb-2 flex items-center justify-between text-xs text-gray-500">
                <span>Complétude</span>
                <span>{completionPercent}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-red-500 to-orange-500"
                  style={{ width: `${completionPercent}%` }}
                />
              </div>
            </div>
          </div>

          {editId ? (
            <div className="mb-5 flex items-center justify-between rounded-2xl border bg-amber-50 p-4 text-sm">
              <div className="flex items-center gap-2 text-amber-800">
                <Pencil className="h-4 w-4" />
                Mode modification activé
              </div>
              <button
                type="button"
                onClick={resetFormCompletely}
                className="rounded-xl border border-amber-200 bg-white px-4 py-2 font-semibold hover:bg-amber-100"
              >
                Annuler la modification
              </button>
            </div>
          ) : null}

          <div className="mb-6 grid gap-3 md:grid-cols-4">
            {alertSteps.map((step) => {
              const isDone = step.id < alertStep && canGoToAlertStep(step.id);
              const isCurrent = alertStep === step.id;

              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => {
                    if (step.id <= alertStep) setAlertStep(step.id);
                  }}
                  className={`rounded-2xl border p-4 text-left transition ${
                    isCurrent
                      ? 'border-orange-400 bg-orange-50 ring-2 ring-orange-100'
                      : isDone
                      ? 'border-emerald-200 bg-emerald-50'
                      : 'bg-white'
                  }`}
                >
                  <div className="text-xs font-semibold text-gray-500">Étape {step.id}</div>
                  <div className="mt-1 flex items-center gap-2 font-bold text-slate-900">
                    {step.title}
                    {isDone ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : null}
                  </div>
                  <div className="mt-1 text-xs text-gray-500">{step.subtitle}</div>
                </button>
              );
            })}
          </div>

          <form onSubmit={submitAlert} className="space-y-6">
            <AnimatePresence mode="wait">
              {alertStep === 1 && (
                <motion.div key="alert-step-1" {...stepContentAnimation()} className="grid gap-4 md:grid-cols-2">
                  <Field label="Nom complet" error={errors.childName}>
                    <Input
                      value={form.childName}
                      onChange={(e) => setForm({ ...form, childName: e.target.value })}
                      placeholder="Ex: Sofia El Alami"
                    />
                    <ErrorText>{errors.childName}</ErrorText>
                  </Field>

                  <Field label="Âge" error={errors.age}>
                    <Input
                      type="number"
                      value={form.age}
                      onChange={(e) => setForm({ ...form, age: e.target.value })}
                      placeholder="7"
                    />
                    <ErrorText>{errors.age}</ErrorText>
                  </Field>

                  <Field label="Genre">
                    <select
                      className="w-full rounded-xl border px-4 py-3"
                      value={form.gender}
                      onChange={(e) => setForm({ ...form, gender: e.target.value })}
                    >
                      <option>Garçon</option>
                      <option>Fille</option>
                    </select>
                  </Field>

                  <Field label="Contact d’urgence">
                    <Input
                      value={form.emergencyContacts}
                      onChange={(e) => setForm({ ...form, emergencyContacts: e.target.value })}
                      placeholder="Téléphone du parent ou proche"
                    />
                  </Field>

                  <Field label="Notes médicales" className="md:col-span-2">
                    <Input
                      value={form.medicalNotes}
                      onChange={(e) => setForm({ ...form, medicalNotes: e.target.value })}
                      placeholder="Médicaments, allergies, besoins spéciaux..."
                    />
                  </Field>
                </motion.div>
              )}

              {alertStep === 2 && (
                <motion.div key="alert-step-2" {...stepContentAnimation()} className="grid gap-4 md:grid-cols-2">
                  <Field label={`Taille (cm) — ${form.heightCm || 0}`} error={errors.heightCm}>
                    <div className="space-y-2">
                      <input
                        type="range"
                        min="50"
                        max="200"
                        value={form.heightCm || 50}
                        onChange={(e) => setForm({ ...form, heightCm: e.target.value })}
                        className="w-full"
                      />
                      <Input
                        type="number"
                        value={form.heightCm}
                        onChange={(e) => setForm({ ...form, heightCm: e.target.value })}
                        placeholder="123"
                      />
                    </div>
                    <ErrorText>{errors.heightCm}</ErrorText>
                  </Field>

                  <Field label="Poids (kg)" error={errors.weightKg}>
                    <Input
                      type="number"
                      value={form.weightKg}
                      onChange={(e) => setForm({ ...form, weightKg: e.target.value })}
                      placeholder="24"
                    />
                    <ErrorText>{errors.weightKg}</ErrorText>
                  </Field>

                  <Field label="Couleur des yeux" error={errors.eyeColor}>
                    <Input
                      value={form.eyeColor}
                      onChange={(e) => setForm({ ...form, eyeColor: e.target.value })}
                      placeholder="Marron"
                    />
                    <ErrorText>{errors.eyeColor}</ErrorText>
                  </Field>

                  <Field label="Couleur des cheveux" error={errors.hairColor}>
                    <Input
                      value={form.hairColor}
                      onChange={(e) => setForm({ ...form, hairColor: e.target.value })}
                      placeholder="Brun"
                    />
                    <ErrorText>{errors.hairColor}</ErrorText>
                  </Field>

                  <Field label="Haut porté" error={errors.clothesTop}>
                    <Input
                      value={form.clothesTop}
                      onChange={(e) => setForm({ ...form, clothesTop: e.target.value })}
                      placeholder="Robe bleue"
                    />
                    <ErrorText>{errors.clothesTop}</ErrorText>
                  </Field>

                  <Field label="Bas porté" error={errors.clothesBottom}>
                    <Input
                      value={form.clothesBottom}
                      onChange={(e) => setForm({ ...form, clothesBottom: e.target.value })}
                      placeholder="Jean bleu"
                    />
                    <ErrorText>{errors.clothesBottom}</ErrorText>
                  </Field>

                  <Field label="Chaussures" error={errors.shoes}>
                    <Input
                      value={form.shoes}
                      onChange={(e) => setForm({ ...form, shoes: e.target.value })}
                      placeholder="Baskets roses"
                    />
                    <ErrorText>{errors.shoes}</ErrorText>
                  </Field>

                  <Field label="Accessoires">
                    <Input
                      value={form.accessories}
                      onChange={(e) => setForm({ ...form, accessories: e.target.value })}
                      placeholder="Sac, montre, casquette..."
                    />
                  </Field>

                  <Field label="Signes distinctifs" className="md:col-span-2">
                    <Input
                      value={form.distinctiveSigns}
                      onChange={(e) => setForm({ ...form, distinctiveSigns: e.target.value })}
                      placeholder="Lunettes, cicatrice, grain de beauté..."
                    />
                  </Field>
                </motion.div>
              )}

              {alertStep === 3 && (
                <motion.div key="alert-step-3" {...stepContentAnimation()} className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Heure / date de disparition" error={errors.missingSince}>
                      <Input
                        type="datetime-local"
                        value={form.missingSince}
                        onChange={(e) => setForm({ ...form, missingSince: e.target.value })}
                      />
                      <ErrorText>{errors.missingSince}</ErrorText>
                    </Field>

                    <Field label="Lieu de disparition" error={errors.lastSeenLocation}>
                      <Input
                        value={form.lastSeenLocation}
                        onChange={(e) => setForm({ ...form, lastSeenLocation: e.target.value })}
                        placeholder="Marché, gare, école, plage..."
                      />
                      <ErrorText>{errors.lastSeenLocation}</ErrorText>
                    </Field>

                    <Field label="Latitude" error={errors.latitude}>
                      <Input
                        value={form.latitude}
                        onChange={(e) => setForm({ ...form, latitude: e.target.value })}
                        placeholder="GPS automatique ou manuel"
                      />
                      <ErrorText>{errors.latitude}</ErrorText>
                    </Field>

                    <Field label="Longitude" error={errors.longitude}>
                      <Input
                        value={form.longitude}
                        onChange={(e) => setForm({ ...form, longitude: e.target.value })}
                        placeholder="GPS automatique ou manuel"
                      />
                      <ErrorText>{errors.longitude}</ErrorText>
                    </Field>
                  </div>

                  <div className="flex gap-3 flex-wrap">
                    <button
                      type="button"
                      onClick={() => detectLocation(setForm)}
                      className="inline-flex items-center gap-2 rounded-xl border px-4 py-3 font-semibold hover:bg-slate-50"
                    >
                      <LocateFixed className="h-4 w-4" />
                      Utiliser le GPS automatique
                    </button>

                    <div className="flex-1 min-w-[260px]">
                      <Field label={`Zone de recherche (m) — ${form.radius}`}>
                        <input
                          type="range"
                          min="500"
                          max="5000"
                          step="100"
                          value={form.radius}
                          onChange={(e) => setForm({ ...form, radius: e.target.value })}
                          className="w-full"
                        />
                      </Field>
                    </div>
                  </div>

                  <div>
                    <p className="mb-2 text-sm font-semibold text-slate-700">
                      Sélectionnez l’emplacement exact sur la carte
                    </p>
                    <MapPicker
                      value={form}
                      onChange={(coords) => setForm((prev) => ({ ...prev, ...coords }))}
                    />
                  </div>
                </motion.div>
              )}

              {alertStep === 4 && (
                <motion.div key="alert-step-4" {...stepContentAnimation()} className="space-y-5">
                  <Field label="Photo de la personne disparue">
                    <div className="rounded-2xl border border-dashed p-4 bg-slate-50">
                      <label className="flex cursor-pointer items-center gap-3">
                        <ImagePlus className="h-5 w-5 text-slate-600" />
                        <span className="text-sm font-medium text-slate-700">
                          {alertPhoto ? alertPhoto.name : 'Ajouter une photo'}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setAlertPhoto(e.target.files?.[0] || null)}
                          className="hidden"
                        />
                      </label>

                      {alertPhotoPreview ? (
                        <div className="mt-4 relative w-fit">
                          <img
                            src={alertPhotoPreview}
                            alt="Aperçu alerte"
                            className="h-40 w-40 rounded-2xl object-cover border"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setAlertPhoto(null);
                              setAlertPhotoPreview('');
                            }}
                            className="absolute -top-2 -right-2 rounded-full bg-white border p-1 shadow"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </Field>

                  <Field label="Description détaillée" error={errors.description}>
                    <TextArea
                      rows="5"
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      placeholder="Contexte, direction prise, comportement, accompagnement, vêtements précis..."
                    />
                    <ErrorText>{errors.description}</ErrorText>
                  </Field>

                  <div className="rounded-2xl bg-blue-50 p-4 text-sm text-slate-700">
                    <Sparkles className="mb-2 h-5 w-5 text-blue-600" />
                    IA assistée : plus les champs sont précis, plus le score de confiance augmente et le risque de fausse information diminue.
                  </div>

                  <div className="rounded-2xl bg-slate-50 border p-4 space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <strong>Récapitulatif rapide</strong>
                    </div>
                    <div>Nom : <strong>{form.childName || '—'}</strong></div>
                    <div>Âge : <strong>{form.age || '—'}</strong></div>
                    <div>Lieu : <strong>{form.lastSeenLocation || '—'}</strong></div>
                    <div>Date/heure : <strong>{form.missingSince || '—'}</strong></div>
                    <div>Zone : <strong>{form.radius} m</strong></div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-center justify-between gap-3 flex-wrap border-t pt-4">
              <button
                type="button"
                onClick={prevAlertStep}
                disabled={alertStep === 1}
                className="inline-flex items-center gap-2 rounded-xl border px-4 py-3 font-semibold disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
                Précédent
              </button>

              <div className="text-sm text-gray-500">
                Étape {alertStep} / {alertSteps.length}
              </div>

              {alertStep < 4 ? (
                <button
                  type="button"
                  onClick={nextAlertStep}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white"
                >
                  Suivant
                  <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <button className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-500 to-orange-500 px-5 py-3 font-semibold text-white">
                  {editId ? <Pencil className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                  {editId ? "Enregistrer les modifications" : "Créer l’alerte"}
                </button>
              )}
            </div>
          </form>
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-4">
            <SlidersHorizontal className="h-5 w-5 text-slate-700" />
            <h2 className="text-xl font-bold">Alertes existantes</h2>
          </div>

          <div className="space-y-4 mb-5">
            <div className="relative">
              <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher par nom ou lieu..."
                className="w-full rounded-xl border pl-10 pr-4 py-3"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                className="w-full rounded-xl border px-4 py-3 sm:col-span-2"
                value={distanceFilter}
                onChange={(e) => setDistanceFilter(e.target.value)}
              >
                <option value="ALL">Toutes distances</option>
                <option value="NEAR">Proches (≤ 2 km)</option>
                <option value="MEDIUM">Moyennes (2 à 10 km)</option>
                <option value="FAR">Lointaines (&gt; 10 km)</option>
              </select>
            </div>

            <div className="flex items-center justify-between gap-3 flex-wrap">
              <p className="text-sm text-gray-500">
                {filteredAlerts.length} résultat(s) trouvé(s)
              </p>
              <button
                type="button"
                onClick={resetFilters}
                className="rounded-xl border px-4 py-2 text-sm font-semibold hover:bg-gray-50"
              >
                Réinitialiser
              </button>
            </div>
          </div>

          <div className="space-y-4 max-h-[920px] overflow-auto pr-1">
            {filteredAlerts.length > 0 ? (
              filteredAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`rounded-2xl border p-4 ${
                    selectedId === alert.id ? 'border-orange-400 ring-2 ring-orange-100' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <button
                      type="button"
                      onClick={() => setSelectedId(alert.id)}
                      className="flex-1 text-left"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-bold text-slate-900">{alert.childName}</div>
                          <div className="text-sm text-gray-500">{alert.lastSeenLocation}</div>
                        </div>

                        <StatusBadge status={alert.status} />
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-600">
                        <div>
                          Temps : <span className="font-semibold">{alert.elapsed}</span>
                        </div>
                        <div>
                          Priorité : <span className="font-semibold text-red-600">{alert.priorityScore}/100</span>
                        </div>
                        <div>
                          Risque faux : <span className="font-semibold text-amber-600">{alert.falseInfoScore}%</span>
                        </div>
                        <div>
                          Signalements : <span className="font-semibold">{alert.reportCount}</span>
                        </div>
                        <div className="col-span-2">
                          Distance :{' '}
                          <span className="font-semibold">
                            {alert.distanceKm !== null && alert.distanceKm !== undefined
                              ? `${alert.distanceKm} km`
                              : 'Indisponible'}
                          </span>
                        </div>
                      </div>
                    </button>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2">
                    <Link
                      to={`/alerts/${alert.id}?tab=SUMMARY`}
                      className="rounded-xl border px-3 py-2 text-center text-sm font-semibold hover:bg-slate-50"
                    >
                      Mettre en focus
                    </Link>

                    <Link
                      to={`/alerts/${alert.id}?tab=REPORTS`}
                      className="rounded-xl bg-slate-900 px-3 py-2 text-center text-sm font-semibold text-white hover:bg-slate-800"
                    >
                      Ouvrir le dossier
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed p-6 text-center text-gray-500">
                Aucune alerte ne correspond à votre recherche ou à vos filtres.
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}