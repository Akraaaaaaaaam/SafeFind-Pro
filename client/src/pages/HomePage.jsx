import {
  BellRing,
  Brain,
  Clock3,
  Database,
  Lock,
  MapPin,
  Radar,
  ShieldCheck,
  Users,
  Workflow,
  ArrowRight,
  Search,
  BarChart3,
  Siren,
  CheckCircle2,
  Sparkles,
  Eye,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card } from '../components/Ui';

const stats = [
  { label: 'Temps réel', value: '24/7', icon: BellRing },
  { label: 'Temps moyen cible', value: '< 15 min', icon: Clock3 },
  { label: 'Fiabilité visée', value: '98%', icon: ShieldCheck },
  { label: 'Collaboration', value: 'Communauté + admin', icon: Users },
];

const steps = [
  {
    title: 'Créer un compte géolocalisé',
    desc: 'Recevez les alertes proches grâce au GPS automatique ou à une position saisie manuellement.',
    icon: MapPin,
  },
  {
    title: 'Déclarer une disparition',
    desc: 'Le dossier est rempli étape par étape avec photo, lieu, heure, description et signes distinctifs.',
    icon: Radar,
  },
  {
    title: 'Diffuser intelligemment',
    desc: 'Le système priorise les cas selon l’âge, le temps écoulé, la complétude du dossier et la zone.',
    icon: Workflow,
  },
  {
    title: 'Collaborer jusqu’à résolution',
    desc: 'Signalements, forum, modération et suivi centralisé permettent une meilleure coordination.',
    icon: Users,
  },
];

const features = [
  {
    title: 'IA image + texte',
    desc: 'Analyse de cohérence, comparaison d’images et aide à la validation des signalements.',
    icon: Brain,
  },
  {
    title: 'Backend robuste',
    desc: 'PostgreSQL + Prisma pour gérer les dossiers, utilisateurs, notifications, rôles et historique.',
    icon: Database,
  },
  {
    title: 'Stockage sécurisé',
    desc: 'Photos en local ou via cloud selon votre configuration et vos besoins de déploiement.',
    icon: Lock,
  },
  {
    title: 'Modération avancée',
    desc: 'Rôles admin/modérateur, validation, archivage, badges et supervision globale des cas.',
    icon: ShieldCheck,
  },
];

const quickActions = [
  {
    title: 'Créer une alerte',
    desc: 'Déclarer rapidement une disparition avec une interface guidée et restaurable.',
    icon: Siren,
    to: '/alerts',
    variant: 'primary',
  },
  {
    title: 'Explorer la carte',
    desc: 'Voir les alertes proches, les zones sensibles et la situation en temps réel.',
    icon: MapPin,
    to: '/map',
    variant: 'secondary',
  },
  {
    title: 'Consulter les dossiers',
    desc: 'Rechercher un cas précis et accéder à son historique, ses signalements et son forum.',
    icon: Search,
    to: '/alerts',
    variant: 'secondary',
  },
  {
    title: 'Voir les statistiques',
    desc: 'Analyser les tendances, les zones, les horaires et les indicateurs de l’application.',
    icon: BarChart3,
    to: '/analytics',
    variant: 'secondary',
  },
];

const emergencyTips = [
  'Ajouter une photo récente, nette et exploitable',
  'Indiquer le dernier lieu exact et l’heure approximative',
  'Décrire précisément vêtements, accessoires et signes distinctifs',
  'Diffuser rapidement le dossier aux personnes proches de la zone',
];

const trustPoints = [
  {
    title: 'Signalement structuré',
    desc: 'Les témoins remplissent un formulaire en étapes pour réduire les oublis.',
    icon: Eye,
  },
  {
    title: 'Validation assistée',
    desc: 'L’IA aide à l’analyse, mais la décision reste contrôlée humainement.',
    icon: Sparkles,
  },
  {
    title: 'Suivi centralisé',
    desc: 'Messages, signalements et historique restent rassemblés dans le même dossier.',
    icon: CheckCircle2,
  },
];

export default function HomePage() {
  return (
    <div className="space-y-14">
      <section className="relative overflow-hidden rounded-[36px] border bg-gradient-to-br from-[#fff4ea] via-white to-[#fff7f0] px-6 py-16 shadow-sm">
        <div className="absolute inset-0 opacity-40">
          <div className="absolute -left-20 top-10 h-52 w-52 rounded-full bg-orange-200 blur-3xl" />
          <div className="absolute right-0 top-0 h-56 w-56 rounded-full bg-red-200 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-44 w-44 rounded-full bg-amber-100 blur-3xl" />
        </div>

        <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div>
            <div className="mb-6 inline-flex rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-600">
              Plateforme professionnelle pour retrouver plus vite une personne disparue
            </div>

            <h1 className="text-5xl font-extrabold leading-tight text-slate-900 md:text-6xl">
              SafeFind <span className="text-orange-600">Pro</span>
            </h1>

            <p className="mt-5 max-w-3xl text-lg leading-8 text-gray-700">
              Une application intelligente de gestion d’alertes avec carte réelle,
              géolocalisation, notifications en temps réel, IA d’assistance,
              signalements structurés, forum collaboratif et suivi complet du dossier.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                to="/alerts"
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-red-500 to-orange-500 px-6 py-4 font-semibold text-white shadow-lg transition hover:scale-[1.01]"
              >
                Créer une alerte
                <ArrowRight className="h-4 w-4" />
              </Link>

              <Link
                to="/map"
                className="inline-flex items-center gap-2 rounded-2xl border bg-white px-6 py-4 font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
              >
                Voir la carte live
                <MapPin className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {trustPoints.map(({ title, desc, icon: Icon }) => (
                <div key={title} className="rounded-2xl border bg-white/80 p-4 shadow-sm backdrop-blur">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-slate-900">{title}</h3>
                  <p className="mt-2 text-sm text-gray-600">{desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-3xl border bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-600">
                  <Siren className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-sm text-gray-500">Déclenchement</div>
                  <div className="font-bold text-slate-900">Alerte créée en quelques étapes</div>
                </div>
              </div>
              <p className="mt-4 text-sm leading-6 text-gray-600">
                Le dossier est saisi de manière guidée avec restauration du brouillon et validation progressive.
              </p>
            </div>

            <div className="rounded-3xl border bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
                  <Brain className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-sm text-gray-500">Assistance</div>
                  <div className="font-bold text-slate-900">Analyse IA image + texte</div>
                </div>
              </div>
              <p className="mt-4 text-sm leading-6 text-gray-600">
                L’intelligence artificielle aide à détecter les incohérences et à comparer les signalements visuels.
              </p>
            </div>

            <div className="rounded-3xl border bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
                  <BellRing className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-sm text-gray-500">Coordination</div>
                  <div className="font-bold text-slate-900">Suivi en temps réel</div>
                </div>
              </div>
              <p className="mt-4 text-sm leading-6 text-gray-600">
                Les alertes, signalements et notifications se synchronisent automatiquement entre utilisateurs.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <Card key={label} className="h-full">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-r from-red-500 to-pink-500 text-white">
              <Icon className="h-6 w-6" />
            </div>
            <div className="text-4xl font-bold text-slate-900">{value}</div>
            <div className="mt-2 text-gray-500">{label}</div>
          </Card>
        ))}
      </section>

      <section>
        <div className="mx-auto mb-8 max-w-3xl text-center">
          <h2 className="text-4xl font-bold text-slate-900">Comment l’application fonctionne</h2>
          <p className="mt-3 text-gray-600">
            Un flux simple, rapide et coordonné pour créer, diffuser, suivre et résoudre un cas.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {steps.map(({ title, desc, icon: Icon }, i) => (
            <Card key={title} className="h-full">
              <div className="mb-5 flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                  <Icon className="h-6 w-6" />
                </div>
                <div className="text-3xl font-extrabold text-slate-200">0{i + 1}</div>
              </div>

              <h3 className="text-xl font-bold text-slate-900">{title}</h3>
              <p className="mt-3 text-gray-600">{desc}</p>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <div className="mx-auto mb-8 max-w-3xl text-center">
          <h2 className="text-4xl font-bold text-slate-900">Accès rapide</h2>
          <p className="mt-3 text-gray-600">
            Entrez directement dans les parties les plus utiles de l’application.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {quickActions.map(({ title, desc, icon: Icon, to, variant }) => (
            <Link key={title} to={to}>
              <Card
                className={`h-full transition hover:-translate-y-1 hover:shadow-lg ${
                  variant === 'primary' ? 'border-red-200 bg-red-50/60' : ''
                }`}
              >
                <div
                  className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl text-white ${
                    variant === 'primary'
                      ? 'bg-gradient-to-r from-red-500 to-orange-500'
                      : 'bg-gradient-to-r from-orange-500 to-red-500'
                  }`}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">{title}</h3>
                <p className="mt-2 text-gray-600">{desc}</p>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="h-full">
          <h2 className="text-2xl font-bold text-slate-900">Traitement détaillé d’un dossier</h2>
          <ol className="mt-5 space-y-3 list-decimal pl-6 text-gray-700">
            <li>Le parent ou responsable renseigne le dossier et choisit la position sur la carte.</li>
            <li>Le backend valide les données et calcule les premiers indicateurs de priorité et de fiabilité.</li>
            <li>Les alertes proches sont diffusées aux utilisateurs concernés et visibles sur la carte temps réel.</li>
            <li>Les témoins ajoutent des signalements avec photo, texte, heure et position GPS.</li>
            <li>Les modérateurs et administrateurs suivent le cas, l’analysent puis peuvent le clôturer.</li>
            <li>Les statistiques synthétisent lieux, heures, tendances et indicateurs de performance.</li>
          </ol>
        </Card>

        <Card className="h-full bg-emerald-50/60">
          <h2 className="text-2xl font-bold text-slate-900">Réagir vite en situation d’urgence</h2>
          <div className="mt-5 space-y-3">
            {emergencyTips.map((tip) => (
              <div key={tip} className="flex items-start gap-3 rounded-xl border bg-white p-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" />
                <p className="text-gray-700">{tip}</p>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section>
        <div className="mx-auto mb-8 max-w-3xl text-center">
          <h2 className="text-4xl font-bold text-slate-900">Briques pro intégrées</h2>
          <p className="mt-3 text-gray-600">
            Une architecture pensée pour un vrai projet applicatif complet et évolutif.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {features.map(({ title, desc, icon: Icon }) => (
            <Card key={title} className="h-full">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-r from-violet-500 to-blue-500 text-white">
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">{title}</h3>
              <p className="mt-2 text-gray-600">{desc}</p>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}