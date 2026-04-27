import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import LoadingOverlay from "../components/common/LoadingOverlay";
import {
  ArrowLeft,
  BadgeCheck,
  FileText,
  Image as ImageIcon,
  MapPin,
  ScanSearch,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  User,
  Clock3,
  Link2,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function ReportDetailsPage() {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const token = localStorage.getItem("token");
        const { data } = await axios.get(`${API_URL}/api/reports/${id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        setReport(data.report);
      } catch (error) {
        console.error("Erreur chargement signalement:", error);
        setReport(null);
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [id]);

  const scoreSummary = useMemo(() => {
    if (!report) return null;

    const face = Number(report.faceMatchScore ?? 0);
    const confidence = Number(report.aiConfidence ?? 0);
    const risk = Number(report.falseInfoRisk ?? 0);

    let faceLabel = "Faible correspondance";
    if (face >= 85) faceLabel = "Correspondance très forte";
    else if (face >= 60) faceLabel = "Correspondance moyenne";
    else if (face >= 35) faceLabel = "Correspondance faible";

    let confidenceLabel = "Confiance basse";
    if (confidence >= 85) confidenceLabel = "Confiance très élevée";
    else if (confidence >= 60) confidenceLabel = "Confiance moyenne";
    else if (confidence >= 35) confidenceLabel = "Confiance limitée";

    let riskLabel = "Risque élevé";
    if (risk <= 20) riskLabel = "Risque faible";
    else if (risk <= 50) riskLabel = "Risque moyen";

    return {
      faceLabel,
      confidenceLabel,
      riskLabel,
    };
  }, [report]);

  if (loading) {
    return (
      <LoadingOverlay
        open={true}
        title="Chargement du signalement..."
        subtitle="Analyse des détails et des scores IA."
      />
    );
  }

  if (!report) {
    return (
      <div className="mx-auto max-w-6xl p-6">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
          <p className="font-medium text-red-600">Signalement introuvable.</p>
        </div>
      </div>
    );
  }

  const linkedAlertUrl = report.alert ? `/alerts/${report.alert.id}` : "/alerts";

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 space-y-8">
      <div className="rounded-3xl border bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <p className="text-sm text-gray-500">Détail du signalement</p>

            <h1 className="text-3xl font-bold text-slate-900">
              Observation liée à {report.alert?.childName || "un cas"}
            </h1>

            <div className="flex flex-wrap gap-2">
              <StatusBadge verified={report.verified} />
              <MiniPill
                icon={Clock3}
                text={
                  report.seenAt
                    ? new Date(report.seenAt).toLocaleString()
                    : "Date inconnue"
                }
              />
              <MiniPill
                icon={MapPin}
                text={report.locationLabel || "Lieu non précisé"}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              to={linkedAlertUrl}
              className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <Link2 className="h-4 w-4" />
              Voir le dossier lié
            </Link>

            <Link
              to={linkedAlertUrl}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour au cas
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <div className="rounded-3xl border bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-2">
              <FileText className="h-5 w-5 text-slate-700" />
              <h2 className="text-2xl font-bold text-slate-900">
                Informations du signalement
              </h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <InfoItem
                icon={User}
                label="Signalé par"
                value={report.user?.fullname || "Utilisateur"}
              />
              <InfoItem
                icon={MapPin}
                label="Lieu observé"
                value={report.locationLabel || "Non renseigné"}
              />
              <InfoItem
                icon={Clock3}
                label="Date / heure"
                value={
                  report.seenAt
                    ? new Date(report.seenAt).toLocaleString()
                    : "Non renseignée"
                }
              />
              <InfoItem
                icon={ShieldCheck}
                label="Statut"
                value={report.verified ? "Vérifié" : "À revoir / non confirmé"}
              />
            </div>

            <div className="mt-5 rounded-2xl border bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Description détaillée
              </p>
              <p className="mt-2 leading-7 text-gray-800">
                {report.description || "Aucune description fournie."}
              </p>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl bg-emerald-50 p-4 text-sm text-slate-700">
                <div className="mb-2 flex items-center gap-2 font-semibold text-emerald-700">
                  <ShieldCheck className="h-4 w-4" />
                  Lecture du système
                </div>
                <p>
                  Ce signalement est{" "}
                  <strong>{report.verified ? "marqué comme vérifié" : "à revoir"}</strong>{" "}
                  selon l’analyse actuelle.
                </p>
              </div>

              <div className="rounded-2xl bg-violet-50 p-4 text-sm text-slate-700">
                <div className="mb-2 flex items-center gap-2 font-semibold text-violet-700">
                  <Sparkles className="h-4 w-4" />
                  Interprétation IA
                </div>
                <p>
                  Match visage : <strong>{scoreSummary?.faceLabel}</strong>
                  <br />
                  Confiance : <strong>{scoreSummary?.confidenceLabel}</strong>
                  <br />
                  Risque : <strong>{scoreSummary?.riskLabel}</strong>
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-2">
              <ScanSearch className="h-5 w-5 text-slate-700" />
              <h2 className="text-2xl font-bold text-slate-900">Scores IA</h2>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <ScoreCard
                label="Match facial"
                value={report.faceMatchScore ?? 0}
                color="purple"
                hint={scoreSummary?.faceLabel}
              />
              <ScoreCard
                label="Confiance IA"
                value={report.aiConfidence ?? 0}
                color="blue"
                hint={scoreSummary?.confidenceLabel}
              />
              <ScoreCard
                label="Risque fausse info"
                value={report.falseInfoRisk ?? 0}
                color="red"
                hint={scoreSummary?.riskLabel}
              />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-slate-700" />
              <h2 className="text-2xl font-bold text-slate-900">
                Comparaison visuelle
              </h2>
            </div>

            <div className="space-y-5">
              <PhotoBlock
                title="Photo de référence"
                subtitle={report.alert?.childName || "Cas lié"}
                src={
                  report.alert?.photoUrl ||
                  "https://via.placeholder.com/500x500?text=Reference"
                }
                alt="Photo de référence"
              />

              <PhotoBlock
                title="Photo du signalement"
                subtitle="Photo envoyée par le témoin"
                src={
                  report.photoUrl ||
                  "https://via.placeholder.com/500x500?text=Signalement"
                }
                alt="Photo du signalement"
              />
            </div>
          </div>

          <div className="rounded-3xl border bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-slate-700" />
              <h2 className="text-xl font-bold text-slate-900">Cas lié</h2>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-gray-500">Alerte concernée</p>
              <p className="mt-1 text-lg font-semibold text-slate-900">
                {report.alert?.childName || "Alerte inconnue"}
              </p>

              <Link
                to={linkedAlertUrl}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Ouvrir le dossier
              </Link>
            </div>

            {report.user ? (
              <div className="mt-4 rounded-2xl bg-amber-50 p-4">
                <div className="flex items-center gap-2 font-semibold text-amber-700">
                  <BadgeCheck className="h-4 w-4" />
                  Profil du déclarant
                </div>
                <p className="mt-2 text-sm text-slate-700">
                  Nom : <strong>{report.user.fullname || "Utilisateur"}</strong>
                  <br />
                  Réputation : <strong>{report.user.reputation ?? 0}%</strong>
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ verified }) {
  return verified ? (
    <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700">
      <ShieldCheck className="h-4 w-4" />
      Vérifié
    </span>
  ) : (
    <span className="inline-flex items-center gap-2 rounded-full bg-orange-100 px-3 py-1 text-sm font-semibold text-orange-700">
      <ShieldAlert className="h-4 w-4" />
      À revoir
    </span>
  );
}

function MiniPill({ icon: Icon, text }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
      <Icon className="h-3.5 w-3.5" />
      {text}
    </span>
  );
}

function InfoItem({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border bg-gray-50 p-4">
      <div className="flex items-center gap-2 text-xs text-gray-500">
        {Icon ? <Icon className="h-4 w-4" /> : null}
        <span>{label}</span>
      </div>
      <p className="mt-2 font-medium text-gray-900">{value}</p>
    </div>
  );
}

function PhotoBlock({ title, subtitle, src, alt }) {
  return (
    <div className="rounded-2xl border bg-slate-50 p-4">
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
      <img
        src={src}
        alt={alt}
        className="mt-3 h-80 w-full rounded-2xl border object-cover bg-white"
      />
    </div>
  );
}

function ScoreCard({ label, value, color, hint }) {
  const safeValue = Math.max(0, Math.min(100, Number(value || 0)));

  const bar =
    color === "purple"
      ? "bg-purple-500"
      : color === "blue"
      ? "bg-blue-500"
      : "bg-red-500";

  const badgeStyle =
    color === "purple"
      ? "bg-purple-100 text-purple-700"
      : color === "blue"
      ? "bg-blue-100 text-blue-700"
      : "bg-red-100 text-red-700";

  return (
    <div className="rounded-2xl border p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-gray-700">{label}</p>
          {hint ? (
            <p className="mt-1 text-xs text-gray-500">{hint}</p>
          ) : null}
        </div>
        <span className={`rounded-full px-3 py-1 text-sm font-bold ${badgeStyle}`}>
          {safeValue}%
        </span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-gray-100">
        <div className={`h-full ${bar}`} style={{ width: `${safeValue}%` }} />
      </div>
    </div>
  );
}