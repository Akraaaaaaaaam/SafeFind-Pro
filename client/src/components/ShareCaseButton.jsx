import { Share2, Copy, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function ShareCaseButton({ alertId, alertName }) {
  const [copied, setCopied] = useState(false);

  const caseUrl = `${window.location.origin}/alerts/${alertId}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(caseUrl);
      setCopied(true);
      toast.success("Lien du cas copié.");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error(error);
      toast.error("Impossible de copier le lien.");
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Cas SafeFind Pro - ${alertName}`,
          text: `Consultez ce cas sur SafeFind Pro : ${alertName}`,
          url: caseUrl,
        });
      } else {
        await handleCopy();
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <button
        type="button"
        onClick={handleShare}
        className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
      >
        <Share2 className="h-4 w-4" />
        Partager
      </button>

      <button
        type="button"
        onClick={handleCopy}
        className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold hover:bg-slate-50"
      >
        {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
        {copied ? "Copié" : "Copier le lien"}
      </button>
    </div>
  );
}