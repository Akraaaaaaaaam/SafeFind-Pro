import { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import LoadingOverlay from "../components/common/LoadingOverlay";
import ShareCaseButton from "../components/ShareCaseButton";
import { useAuth } from "../context/AuthContext";
import api from "../api/api";
import MapPicker from "../components/MapPicker";
import { Input, TextArea } from "../components/Ui";
import { toast } from "sonner";
import {
  Clock3,
  FileText,
  MessageCircle,
  ShieldCheck,
  Siren,
  CheckCircle2,
  Search,
  Filter,
  Download,
  LayoutDashboard,
  MapPin,
  Sparkles,
  History,
  Pencil,
  Check,
  Send,
  LocateFixed,
  Eye,
  ImagePlus,
  X,
  AlertTriangle,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const TABS = {
  SUMMARY: "SUMMARY",
  REPORTS: "REPORTS",
  FORUM: "FORUM",
  HISTORY: "HISTORY",
};

const initialReportForm = {
  description: "",
  locationLabel: "",
  latitude: "",
  longitude: "",
  seenAt: "",
};

export default function AlertDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [messageLoading, setMessageLoading] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(TABS.SUMMARY);

  const [reportSearch, setReportSearch] = useState("");
  const [reportStatusFilter, setReportStatusFilter] = useState("ALL");
  const [reportRiskFilter, setReportRiskFilter] = useState("ALL");
  const [forumMessage, setForumMessage] = useState("");

  const [reportForm, setReportForm] = useState(initialReportForm);
  const [reportPhoto, setReportPhoto] = useState(null);
  const [reportPhotoPreview, setReportPhotoPreview] = useState("");

  const fetchAlert = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const { data } = await axios.get(`${API_URL}/api/alerts/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setAlert(data.alert);
    } catch (error) {
      console.error("Erreur chargement alerte:", error);
      setAlert(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlert();
  }, [id]);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab && TABS[tab]) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!reportPhoto) {
      setReportPhotoPreview("");
      return;
    }

    const url = URL.createObjectURL(reportPhoto);
    setReportPhotoPreview(url);

    return () => URL.revokeObjectURL(url);
  }, [reportPhoto]);

  const canManageAlert =
    alert &&
    user &&
    (Number(alert.createdById) === Number(user.id) ||
      user.role === "ADMIN" ||
      user.role === "MODERATOR");

  const canEditAlert =
    alert &&
    user &&
    (Number(alert.createdById) === Number(user.id) ||
      user.role === "ADMIN" ||
      user.role === "MODERATOR");

  const isOwnAlert =
    alert &&
    user &&
    Number(alert.createdById) === Number(user.id);

  const changeTab = (tab) => {
    setActiveTab(tab);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("tab", tab);
      return next;
    });
  };

  const timeline = useMemo(() => {
    if (!alert) return [];

    const items = [];

    if (alert.createdAt) {
      items.push({
        type: "alert_created",
        date: alert.createdAt,
        title: "Alerte créée",
        description: `Le dossier de ${alert.childName} a été créé.`,
        actor: alert.createdBy?.fullname || "Utilisateur",
      });
    }

    (alert.moderationActions || []).forEach((action) => {
      items.push({
        type: "moderation",
        date: action.createdAt,
        title: `Action de modération : ${action.action}`,
        description: action.reason || "Aucune raison précisée",
        actor: action.actor?.fullname || "Modérateur",
        role: action.actor?.role || "",
      });
    });

    (alert.reports || []).forEach((report) => {
      items.push({
        type: "report",
        date: report.createdAt || report.seenAt,
        title: "Signalement reçu",
        description: report.description,
        actor: report.user?.fullname || "Utilisateur",
        location: report.locationLabel,
      });
    });

    (alert.messages || []).forEach((message) => {
      items.push({
        type: "message",
        date: message.createdAt,
        title: "Message dans le forum",
        description: message.content,
        actor: message.user?.fullname || "Utilisateur",
        role: message.user?.role || "",
      });
    });

    if (alert.resolvedAt) {
      items.push({
        type: "resolved",
        date: alert.resolvedAt,
        title: "Cas résolu",
        description: `Le cas de ${alert.childName} a été marqué comme résolu.`,
        actor: "Système / Responsable",
      });
    }

    return items.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [alert]);

  const filteredReports = useMemo(() => {
    const reports = alert?.reports || [];
    let list = [...reports];

    const keyword = reportSearch.trim().toLowerCase();
    if (keyword) {
      list = list.filter((report) => {
        const author = String(report.user?.fullname || "").toLowerCase();
        const location = String(report.locationLabel || "").toLowerCase();
        const description = String(report.description || "").toLowerCase();

        return (
          author.includes(keyword) ||
          location.includes(keyword) ||
          description.includes(keyword)
        );
      });
    }

    if (reportStatusFilter !== "ALL") {
      if (reportStatusFilter === "VERIFIED") {
        list = list.filter((report) => report.verified === true);
      }
      if (reportStatusFilter === "REVIEW") {
        list = list.filter((report) => report.verified !== true);
      }
    }

    if (reportRiskFilter !== "ALL") {
      list = list.filter((report) => {
        const risk = Number(report.falseInfoRisk || 0);
        if (reportRiskFilter === "LOW") return risk <= 20;
        if (reportRiskFilter === "MEDIUM") return risk > 20 && risk <= 50;
        if (reportRiskFilter === "HIGH") return risk > 50;
        return true;
      });
    }

    return list;
  }, [alert, reportSearch, reportStatusFilter, reportRiskFilter]);

  const resetReportFilters = () => {
    setReportSearch("");
    setReportStatusFilter("ALL");
    setReportRiskFilter("ALL");
  };

  const handleResolveAlert = async () => {
    if (!alert) return;

    try {
      setActionLoading(true);
      await api.post(`/alerts/${alert.id}/resolve`);
      toast.success("Alerte marquée comme résolue.");
      await fetchAlert();
    } catch (error) {
      console.error(error);
      toast.error("Impossible de marquer cette alerte comme résolue.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditAlert = () => {
    if (!alert) return;
    navigate(`/alerts?edit=${alert.id}`);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!forumMessage.trim() || !alert?.id) return;

    try {
      setMessageLoading(true);
      await api.post("/messages", {
        alertId: alert.id,
        content: forumMessage.trim(),
      });
      setForumMessage("");
      toast.success("Message envoyé.");
      await fetchAlert();
    } catch (error) {
      console.error(error);
      toast.error("Impossible d’envoyer le message.");
    } finally {
      setMessageLoading(false);
    }
  };

  const detectReportLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Géolocalisation indisponible.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setReportForm((prev) => ({
          ...prev,
          latitude: String(pos.coords.latitude),
          longitude: String(pos.coords.longitude),
        }));
        toast.success("Position GPS récupérée.");
      },
      () => toast.error("Impossible de récupérer votre position.")
    );
  };

  const handleSubmitReport = async (e) => {
    e.preventDefault();

    if (!alert?.id) return;

    if (isOwnAlert) {
      toast.error("Vous ne pouvez pas faire un signalement sur votre propre alerte.");
      return;
    }

    if (
      !reportForm.description.trim() ||
      !reportForm.locationLabel.trim() ||
      !reportForm.latitude.trim() ||
      !reportForm.longitude.trim() ||
      !reportForm.seenAt.trim()
    ) {
      toast.error("Veuillez compléter tous les champs obligatoires du signalement.");
      return;
    }

    try {
      setReportLoading(true);

      const payload = new FormData();
      payload.append("description", reportForm.description.trim());
      payload.append("locationLabel", reportForm.locationLabel.trim());
      payload.append("latitude", reportForm.latitude);
      payload.append("longitude", reportForm.longitude);
      payload.append("seenAt", reportForm.seenAt);
      payload.append("alertId", String(alert.id));

      if (reportPhoto) {
        payload.append("photo", reportPhoto);
      }

      await api.post("/reports", payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Signalement envoyé avec succès.");
      setReportForm(initialReportForm);
      setReportPhoto(null);
      setReportPhotoPreview("");
      await fetchAlert();
    } catch (error) {
      console.error(error);
      toast.error(
        error?.response?.data?.message || "Impossible d’envoyer le signalement."
      );
    } finally {
      setReportLoading(false);
    }
  };

  const exportCaseToPDF = () => {
    if (!alert) return;

    const reportRows = (alert.reports || [])
      .map(
        (report, index) => `
          <tr>
            <td>${index + 1}</td>
            <td>${report.user?.fullname || "Utilisateur"}</td>
            <td>${report.locationLabel || "-"}</td>
            <td>${report.description || "-"}</td>
            <td>${report.faceMatchScore ?? 0}%</td>
            <td>${report.aiConfidence ?? 0}%</td>
            <td>${report.falseInfoRisk ?? 0}%</td>
            <td>${report.verified ? "Vérifié" : "À revoir"}</td>
          </tr>
        `
      )
      .join("");

    const messageRows = (alert.messages || [])
      .map(
        (message, index) => `
          <tr>
            <td>${index + 1}</td>
            <td>${message.user?.fullname || "Utilisateur"}</td>
            <td>${message.user?.role || "-"}</td>
            <td>${message.content || "-"}</td>
          </tr>
        `
      )
      .join("");

    const timelineRows = timeline
      .map(
        (item, index) => `
          <tr>
            <td>${index + 1}</td>
            <td>${item.title}</td>
            <td>${item.actor || "-"}</td>
            <td>${item.role || "-"}</td>
            <td>${item.location || "-"}</td>
            <td>${item.date ? new Date(item.date).toLocaleString() : "-"}</td>
            <td>${item.description || "-"}</td>
          </tr>
        `
      )
      .join("");

    const popup = window.open("", "_blank", "width=1100,height=900");
    if (!popup) return;

    popup.document.write(`
      <html>
        <head>
          <title>Dossier - ${alert.childName}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 30px;
              color: #1f2937;
              line-height: 1.5;
            }
            h1, h2, h3 { margin-bottom: 10px; }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              gap: 20px;
              margin-bottom: 30px;
              border-bottom: 2px solid #e5e7eb;
              padding-bottom: 20px;
            }
            .status {
              display: inline-block;
              padding: 8px 14px;
              border-radius: 999px;
              background: #ffedd5;
              color: #c2410c;
              font-weight: bold;
              font-size: 12px;
            }
            .section { margin-top: 28px; }
            .grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 12px;
            }
            .box {
              border: 1px solid #e5e7eb;
              background: #f8fafc;
              border-radius: 12px;
              padding: 12px;
            }
            img {
              max-width: 280px;
              max-height: 280px;
              border-radius: 12px;
              border: 1px solid #ddd;
              object-fit: cover;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 12px;
              font-size: 13px;
            }
            th, td {
              border: 1px solid #d1d5db;
              padding: 8px;
              text-align: left;
              vertical-align: top;
            }
            th { background: #f3f4f6; }
            .muted { color: #6b7280; font-size: 13px; }
            .desc {
              border: 1px solid #e5e7eb;
              border-radius: 12px;
              padding: 14px;
              background: #eff6ff;
            }
            @media print {
              body { padding: 10px; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1>Dossier du cas : ${alert.childName}</h1>
              <p class="muted">${alert.elapsed || "Temps non disponible"} • ${alert.lastSeenLocation}</p>
              <p class="muted">Créé par : ${alert.createdBy?.fullname || "Inconnu"}</p>
            </div>
            <div>
              <span class="status">${alert.status}</span>
            </div>
          </div>

          <div class="section">
            <h2>Informations générales</h2>
            <div style="display:flex; gap:24px; align-items:flex-start; flex-wrap:wrap;">
              <div>
                <img src="${alert.photoUrl || "https://via.placeholder.com/300x300?text=Photo"}" alt="${alert.childName}" />
              </div>
              <div style="flex:1; min-width:320px;">
                <div class="grid">
                  <div class="box"><strong>Âge :</strong> ${alert.age} ans</div>
                  <div class="box"><strong>Sexe :</strong> ${alert.gender}</div>
                  <div class="box"><strong>Taille :</strong> ${alert.heightCm} cm</div>
                  <div class="box"><strong>Poids :</strong> ${alert.weightKg} kg</div>
                  <div class="box"><strong>Yeux :</strong> ${alert.eyeColor}</div>
                  <div class="box"><strong>Cheveux :</strong> ${alert.hairColor}</div>
                  <div class="box"><strong>Vêtement haut :</strong> ${alert.clothesTop}</div>
                  <div class="box"><strong>Vêtement bas :</strong> ${alert.clothesBottom}</div>
                  <div class="box"><strong>Chaussures :</strong> ${alert.shoes}</div>
                  <div class="box"><strong>Accessoires :</strong> ${alert.accessories || "—"}</div>
                  <div class="box"><strong>Signes distinctifs :</strong> ${alert.distinctiveSigns || "—"}</div>
                  <div class="box"><strong>Dernier lieu :</strong> ${alert.lastSeenLocation}</div>
                </div>
              </div>
            </div>
          </div>

          <div class="section">
            <h2>Description</h2>
            <div class="desc">${alert.description || "-"}</div>
          </div>

          <div class="section">
            <h2>Scores du cas</h2>
            <div class="grid">
              <div class="box"><strong>Priorité :</strong> ${alert.priorityScore ?? 0}%</div>
              <div class="box"><strong>Complétude :</strong> ${alert.completenessScore ?? 0}%</div>
              <div class="box"><strong>Risque fausse information :</strong> ${alert.falseInfoScore ?? 0}%</div>
              <div class="box"><strong>Temps écoulé :</strong> ${alert.elapsed || "-"}</div>
            </div>
          </div>

          <div class="section">
            <h2>Timeline du cas</h2>
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Événement</th>
                  <th>Auteur</th>
                  <th>Rôle</th>
                  <th>Lieu</th>
                  <th>Date</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                ${timelineRows || `<tr><td colspan="7">Aucun historique disponible.</td></tr>`}
              </tbody>
            </table>
          </div>

          <div class="section">
            <h2>Signalements reçus</h2>
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Auteur</th>
                  <th>Lieu</th>
                  <th>Description</th>
                  <th>Match visage</th>
                  <th>Confiance IA</th>
                  <th>Risque</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                ${reportRows || `<tr><td colspan="8">Aucun signalement disponible.</td></tr>`}
              </tbody>
            </table>
          </div>

          <div class="section">
            <h2>Messages du forum</h2>
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Auteur</th>
                  <th>Rôle</th>
                  <th>Message</th>
                </tr>
              </thead>
              <tbody>
                ${messageRows || `<tr><td colspan="4">Aucun message disponible.</td></tr>`}
              </tbody>
            </table>
          </div>

          <div class="section no-print" style="margin-top:30px;">
            <button onclick="window.print()" style="padding:12px 20px; border:none; border-radius:12px; background:#111827; color:white; font-weight:bold; cursor:pointer;">
              Imprimer / Enregistrer en PDF
            </button>
          </div>
        </body>
      </html>
    `);

    popup.document.close();
  };

  if (loading) {
    return (
      <LoadingOverlay
        open={true}
        title="Chargement du cas..."
        subtitle="Récupération des détails, signalements, messages et historique."
      />
    );
  }

  if (!alert) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <p className="text-red-600 font-medium">Cas introuvable.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 space-y-8">
      <LoadingOverlay
        open={actionLoading}
        title="Mise à jour du dossier..."
        subtitle="Veuillez patienter."
      />

      <LoadingOverlay
        open={messageLoading}
        title="Envoi du message..."
        subtitle="Publication dans le forum du cas."
      />

      <LoadingOverlay
        open={reportLoading}
        title="Envoi du signalement..."
        subtitle="Analyse et enregistrement du signalement en cours."
      />

      <div className="rounded-3xl border bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex gap-5">
            <img
              src={alert.photoUrl || "https://via.placeholder.com/300x300?text=Photo"}
              alt={alert.childName}
              className="h-32 w-32 rounded-2xl border object-cover"
            />

            <div>
              <p className="text-sm text-gray-500">Dossier du cas</p>
              <h1 className="text-3xl font-bold text-slate-900">{alert.childName}</h1>
              <p className="mt-1 text-sm text-gray-600">
                {alert.elapsed || "Temps non disponible"} • {alert.lastSeenLocation}
              </p>
              <p className="mt-1 text-sm text-gray-500">
                Créé par {alert.createdBy?.fullname || "Inconnu"}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <StatusBadge status={alert.status} />
                <SmallMetric label="Priorité" value={`${alert.priorityScore ?? 0}%`} />
                <SmallMetric label="Complétude" value={`${alert.completenessScore ?? 0}%`} />
                <SmallMetric label="Risque" value={`${alert.falseInfoScore ?? 0}%`} />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {canEditAlert && alert.status !== "RESOLVED" ? (
              <button
                type="button"
                onClick={handleEditAlert}
                className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold hover:bg-slate-50"
              >
                <Pencil className="h-4 w-4" />
                Modifier
              </button>
            ) : null}

            {canManageAlert && alert.status === "ACTIVE" ? (
              <button
                type="button"
                onClick={handleResolveAlert}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                <Check className="h-4 w-4" />
                Marquer résolue
              </button>
            ) : null}

            <button
              type="button"
              onClick={exportCaseToPDF}
              className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold hover:bg-slate-50"
            >
              <Download className="h-4 w-4" />
              Exporter PDF
            </button>

            <ShareCaseButton alertId={alert.id} alertName={alert.childName} />

            <Link
              to="/alerts"
              className="rounded-xl bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-200"
            >
              Retour
            </Link>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 border-b pb-3">
        <TabButton
          active={activeTab === TABS.SUMMARY}
          icon={LayoutDashboard}
          label="Résumé"
          onClick={() => changeTab(TABS.SUMMARY)}
        />
        <TabButton
          active={activeTab === TABS.REPORTS}
          icon={FileText}
          label={`Signalements (${alert.reports?.length || 0})`}
          onClick={() => changeTab(TABS.REPORTS)}
        />
        <TabButton
          active={activeTab === TABS.FORUM}
          icon={MessageCircle}
          label={`Forum (${alert.messages?.length || 0})`}
          onClick={() => changeTab(TABS.FORUM)}
        />
        <TabButton
          active={activeTab === TABS.HISTORY}
          icon={History}
          label="Historique"
          onClick={() => changeTab(TABS.HISTORY)}
        />
      </div>

      {activeTab === TABS.SUMMARY ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="rounded-3xl border bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-2xl font-bold text-slate-900">Résumé du cas</h2>

            <div className="grid gap-4 md:grid-cols-2 text-sm">
              <InfoItem label="Âge" value={`${alert.age} ans`} />
              <InfoItem label="Sexe" value={alert.gender} />
              <InfoItem label="Taille" value={`${alert.heightCm} cm`} />
              <InfoItem label="Poids" value={`${alert.weightKg} kg`} />
              <InfoItem label="Yeux" value={alert.eyeColor} />
              <InfoItem label="Cheveux" value={alert.hairColor} />
              <InfoItem label="Vêtement haut" value={alert.clothesTop} />
              <InfoItem label="Vêtement bas" value={alert.clothesBottom} />
              <InfoItem label="Chaussures" value={alert.shoes} />
              <InfoItem label="Accessoires" value={alert.accessories || "—"} />
              <InfoItem label="Signes distinctifs" value={alert.distinctiveSigns || "—"} />
              <InfoItem label="Dernier lieu" value={alert.lastSeenLocation} />
            </div>

            <div className="mt-6 rounded-2xl bg-blue-50 p-4 text-sm text-slate-700">
              <div className="mb-2 font-semibold text-slate-900">Description</div>
              <p>{alert.description || "Aucune description."}</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-xl font-bold">Scores du cas</h3>
              <ScoreBox label="Priorité" value={alert.priorityScore ?? 0} color="orange" />
              <div className="mt-4">
                <ScoreBox
                  label="Complétude du dossier"
                  value={alert.completenessScore ?? 0}
                  color="blue"
                />
              </div>
              <div className="mt-4">
                <ScoreBox
                  label="Risque fausse information"
                  value={alert.falseInfoScore ?? 0}
                  color="red"
                />
              </div>
            </div>

            <div className="rounded-3xl border bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-xl font-bold">Lecture du système</h3>
              <div className="space-y-3 text-sm text-slate-700">
                <div className="rounded-2xl bg-emerald-50 p-4">
                  <ShieldCheck className="mb-2 h-5 w-5 text-emerald-600" />
                  Accès authentifié et données mieux protégées pour le suivi du dossier.
                </div>
                <div className="rounded-2xl bg-amber-50 p-4">
                  <MapPin className="mb-2 h-5 w-5 text-amber-600" />
                  Zone de recherche : {alert.radius} m • distance :{" "}
                  {alert.distanceKm ? `${alert.distanceKm} km` : "indisponible"}
                </div>
                {alert.scoreExplanation ? (
                  <div className="rounded-2xl bg-violet-50 p-4">
                    <Sparkles className="mb-2 h-5 w-5 text-violet-600" />
                    <div><strong>Priorité :</strong> {alert.scoreExplanation.priority}</div>
                    <div className="mt-2"><strong>Risque :</strong> {alert.scoreExplanation.falseInfo}</div>
                    <div className="mt-2"><strong>Reconnaissance faciale :</strong> {alert.scoreExplanation.faceRecognition}</div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {activeTab === TABS.REPORTS ? (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-3xl border bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Eye className="h-5 w-5 text-slate-700" />
              <h2 className="text-2xl font-semibold text-gray-900">
                Répondre à l’alerte
              </h2>
            </div>

            {isOwnAlert ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 mt-0.5" />
                  <div>
                    <p className="font-semibold">Signalement bloqué</p>
                    <p className="mt-1">
                      Le créateur de l’alerte ne peut pas faire un signalement sur sa propre alerte.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmitReport} className="space-y-4">
                <div className="rounded-2xl bg-slate-50 border p-4 text-sm text-slate-700">
                  <p className="font-semibold text-slate-900">Conseil</p>
                  <p className="mt-1">
                    Donne un lieu précis, une heure proche de l’observation et une description claire.
                  </p>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Ce que vous avez vu
                  </label>
                  <TextArea
                    rows="4"
                    value={reportForm.description}
                    onChange={(e) =>
                      setReportForm((prev) => ({ ...prev, description: e.target.value }))
                    }
                    placeholder="Décrivez précisément la personne, sa direction, son comportement, avec qui elle était..."
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Lieu exact
                    </label>
                    <Input
                      value={reportForm.locationLabel}
                      onChange={(e) =>
                        setReportForm((prev) => ({ ...prev, locationLabel: e.target.value }))
                      }
                      placeholder="Ex: près de la gare, devant une pharmacie..."
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Date / heure
                    </label>
                    <Input
                      type="datetime-local"
                      value={reportForm.seenAt}
                      onChange={(e) =>
                        setReportForm((prev) => ({ ...prev, seenAt: e.target.value }))
                      }
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Latitude
                    </label>
                    <Input
                      value={reportForm.latitude}
                      onChange={(e) =>
                        setReportForm((prev) => ({ ...prev, latitude: e.target.value }))
                      }
                      placeholder="Latitude GPS"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Longitude
                    </label>
                    <Input
                      value={reportForm.longitude}
                      onChange={(e) =>
                        setReportForm((prev) => ({ ...prev, longitude: e.target.value }))
                      }
                      placeholder="Longitude GPS"
                    />
                  </div>
                </div>

                <div className="flex gap-3 flex-wrap">
                  <button
                    type="button"
                    onClick={detectReportLocation}
                    className="inline-flex items-center gap-2 rounded-xl border px-4 py-3 font-semibold hover:bg-slate-50"
                  >
                    <LocateFixed className="h-4 w-4" />
                    Utiliser mon GPS
                  </button>

                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-3 font-semibold hover:bg-slate-50">
                    <ImagePlus className="h-4 w-4" />
                    {reportPhoto ? "Changer la photo" : "Ajouter une photo"}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setReportPhoto(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                  </label>
                </div>

                {reportPhotoPreview ? (
                  <div className="relative w-fit">
                    <img
                      src={reportPhotoPreview}
                      alt="Aperçu signalement"
                      className="h-32 w-32 rounded-2xl border object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setReportPhoto(null);
                        setReportPhotoPreview("");
                      }}
                      className="absolute -top-2 -right-2 rounded-full bg-white border p-1 shadow"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : null}

                <div>
                  <p className="mb-2 text-sm font-semibold text-slate-700">
                    Position manuelle sur la carte
                  </p>
                  <MapPicker
                    value={reportForm}
                    onChange={(coords) =>
                      setReportForm((prev) => ({ ...prev, ...coords }))
                    }
                    height="220px"
                  />
                </div>

                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
                >
                  <Send className="h-4 w-4" />
                  Envoyer le signalement
                </button>
              </form>
            )}
          </div>

          <div className="rounded-3xl border bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="h-5 w-5 text-slate-700" />
              <h2 className="text-2xl font-semibold text-gray-900">
                Signalements reçus ({alert.reports?.length || 0})
              </h2>
            </div>

            <div className="rounded-2xl border bg-slate-50 p-4 space-y-4 mb-5">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  value={reportSearch}
                  onChange={(e) => setReportSearch(e.target.value)}
                  placeholder="Rechercher par auteur, lieu ou description..."
                  className="w-full rounded-xl border bg-white py-3 pl-10 pr-4"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <select
                  className="w-full rounded-xl border bg-white px-4 py-3"
                  value={reportStatusFilter}
                  onChange={(e) => setReportStatusFilter(e.target.value)}
                >
                  <option value="ALL">Tous les statuts</option>
                  <option value="VERIFIED">Vérifiés</option>
                  <option value="REVIEW">À revoir</option>
                </select>

                <select
                  className="w-full rounded-xl border bg-white px-4 py-3"
                  value={reportRiskFilter}
                  onChange={(e) => setReportRiskFilter(e.target.value)}
                >
                  <option value="ALL">Tous les niveaux de risque</option>
                  <option value="LOW">Risque faible</option>
                  <option value="MEDIUM">Risque moyen</option>
                  <option value="HIGH">Risque élevé</option>
                </select>
              </div>

              <div className="flex items-center justify-between gap-3 flex-wrap">
                <p className="text-sm text-gray-500">
                  {filteredReports.length} signalement(s) affiché(s)
                </p>

                <button
                  type="button"
                  onClick={resetReportFilters}
                  className="rounded-xl border px-4 py-2 text-sm font-semibold hover:bg-white"
                >
                  Réinitialiser
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {filteredReports.length > 0 ? (
                filteredReports.map((report) => (
                  <Link
                    key={report.id}
                    to={`/reports/${report.id}`}
                    className="block rounded-2xl border p-4 transition hover:shadow-md hover:border-blue-300"
                  >
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="min-w-[260px] flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-gray-900">
                            {report.user?.fullname || "Utilisateur"}
                          </p>
                          <RolePill role={report.user?.role} />
                        </div>

                        <p className="mt-1 text-sm text-gray-600">{report.locationLabel}</p>
                        <p className="mt-2 text-sm text-gray-700">{report.description}</p>
                        <p className="mt-2 text-xs text-gray-500">
                          {new Date(report.seenAt).toLocaleString()}
                        </p>
                      </div>

                      <div className="min-w-[190px] space-y-2 text-sm">
                        <MetricLine label="Match visage" value={`${report.faceMatchScore ?? 0}%`} color="text-purple-700" />
                        <MetricLine label="Confiance IA" value={`${report.aiConfidence ?? 0}%`} color="text-blue-700" />
                        <MetricLine label="Risque" value={`${report.falseInfoRisk ?? 0}%`} color="text-red-700" />
                        <p className={report.verified ? "text-green-600 font-semibold" : "text-orange-600 font-semibold"}>
                          {report.verified ? "Vérifié" : "À revoir"}
                        </p>
                        <div className="pt-2">
                          <span className="inline-flex rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white">
                            Voir le signalement
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <p className="text-gray-500">Aucun signalement ne correspond aux filtres.</p>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {activeTab === TABS.FORUM ? (
        <div className="rounded-3xl border bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <MessageCircle className="h-5 w-5 text-slate-700" />
            <h2 className="text-2xl font-semibold text-gray-900">Forum du cas</h2>
          </div>

          <div className="max-h-[520px] space-y-3 overflow-auto pr-1">
            {alert.messages && alert.messages.length > 0 ? (
              alert.messages.map((message) => (
                <div key={message.id} className="rounded-2xl border bg-slate-50 p-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-gray-900">
                      {message.user?.fullname || "Utilisateur"}
                    </p>
                    <RolePill role={message.user?.role} />
                  </div>
                  <p className="mt-2 text-gray-700">{message.content}</p>
                  {message.createdAt ? (
                    <p className="mt-2 text-xs text-gray-400">
                      {new Date(message.createdAt).toLocaleString()}
                    </p>
                  ) : null}
                </div>
              ))
            ) : (
              <p className="text-gray-500">Aucun message pour ce cas.</p>
            )}
          </div>

          <form onSubmit={handleSendMessage} className="mt-5 flex gap-3">
            <input
              value={forumMessage}
              onChange={(e) => setForumMessage(e.target.value)}
              placeholder="Écrire un message utile pour ce cas..."
              className="w-full rounded-xl border px-4 py-3"
            />
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white hover:bg-slate-800"
            >
              <Send className="h-4 w-4" />
              Envoyer
            </button>
          </form>
        </div>
      ) : null}

      {activeTab === TABS.HISTORY ? (
        <div className="rounded-3xl border bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <Clock3 className="h-5 w-5 text-slate-700" />
            <h2 className="text-2xl font-semibold text-gray-900">Historique du cas</h2>
          </div>

          <div className="space-y-4">
            {timeline.length > 0 ? (
              timeline.map((item, index) => (
                <div key={index} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border bg-slate-100">
                      <TimelineIcon type={item.type} />
                    </div>
                    {index !== timeline.length - 1 ? (
                      <div className="mt-2 w-px flex-1 bg-slate-200" />
                    ) : null}
                  </div>

                  <div className="flex-1 rounded-2xl border bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <h3 className="font-semibold text-gray-900">{item.title}</h3>
                      <span className="text-xs text-gray-500">
                        {item.date ? new Date(item.date).toLocaleString() : "Date inconnue"}
                      </span>
                    </div>

                    <p className="mt-2 text-sm text-gray-700">{item.description}</p>

                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-500">
                      {item.actor ? <span>Auteur : {item.actor}</span> : null}
                      {item.role ? <span>Rôle : {item.role}</span> : null}
                      {item.location ? <span>Lieu : {item.location}</span> : null}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500">Aucun historique disponible pour ce cas.</p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function TabButton({ active, icon: Icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
        active
          ? "bg-slate-900 text-white"
          : "border bg-white text-slate-700 hover:bg-slate-50"
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

function SmallMetric({ label, value }) {
  return (
    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
      {label} : {value}
    </span>
  );
}

function StatusBadge({ status }) {
  const label =
    status === "ACTIVE"
      ? "Active"
      : status === "RESOLVED"
      ? "Résolue"
      : status === "UNDER_REVIEW"
      ? "En revue"
      : status === "ARCHIVED"
      ? "Archivée"
      : status || "Inconnu";

  const style =
    status === "ACTIVE"
      ? "bg-red-100 text-red-700"
      : status === "RESOLVED"
      ? "bg-green-100 text-green-700"
      : status === "UNDER_REVIEW"
      ? "bg-amber-100 text-amber-700"
      : "bg-slate-100 text-slate-700";

  return <span className={`rounded-full px-3 py-1 text-sm font-semibold ${style}`}>{label}</span>;
}

function RolePill({ role }) {
  if (!role) return null;

  const normalized = String(role).toUpperCase();

  const style =
    normalized === "ADMIN"
      ? "bg-red-100 text-red-700"
      : normalized === "MODERATOR"
      ? "bg-amber-100 text-amber-700"
      : "bg-blue-100 text-blue-700";

  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${style}`}>
      {normalized}
    </span>
  );
}

function MetricLine({ label, value, color }) {
  return (
    <p className={color}>
      {label}: <span className="font-semibold">{value}</span>
    </p>
  );
}

function InfoItem({ label, value }) {
  return (
    <div className="rounded-xl border bg-gray-50 p-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 font-medium text-gray-900">{value}</p>
    </div>
  );
}

function ScoreBox({ label, value, color }) {
  const colorClass =
    color === "orange"
      ? "bg-orange-500"
      : color === "blue"
      ? "bg-blue-500"
      : "bg-red-500";

  return (
    <div className="rounded-xl border p-4">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-medium text-gray-700">{label}</p>
        <p className="font-bold text-gray-900">{value}%</p>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-gray-100">
        <div className={`h-full ${colorClass}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function TimelineIcon({ type }) {
  if (type === "alert_created") return <Siren className="h-4 w-4 text-red-600" />;
  if (type === "moderation") return <ShieldCheck className="h-4 w-4 text-emerald-600" />;
  if (type === "report") return <FileText className="h-4 w-4 text-blue-600" />;
  if (type === "message") return <MessageCircle className="h-4 w-4 text-violet-600" />;
  if (type === "resolved") return <CheckCircle2 className="h-4 w-4 text-green-600" />;
  return <Clock3 className="h-4 w-4 text-slate-600" />;
}