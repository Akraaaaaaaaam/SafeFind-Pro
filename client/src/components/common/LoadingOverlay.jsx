export default function LoadingOverlay({
  open,
  title = "Traitement en cours...",
  subtitle = "Veuillez patienter et ne pas fermer la page.",
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-sm flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-gray-100 p-8 text-center">
        <div className="mx-auto mb-5 h-16 w-16 rounded-full border-4 border-orange-200 border-t-orange-600 animate-spin" />
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
        <p className="mt-2 text-sm text-gray-600">{subtitle}</p>

        <div className="mt-6 space-y-2 text-left">
          <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
            <div className="h-full w-2/3 bg-gradient-to-r from-orange-500 to-red-500 animate-pulse rounded-full" />
          </div>
          <p className="text-xs text-gray-500">
            Analyse, enregistrement et synchronisation en cours...
          </p>
        </div>
      </div>
    </div>
  );
}