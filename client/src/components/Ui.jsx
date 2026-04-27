export function Card({ className = '', children }) {
  return <div className={`rounded-3xl border bg-white p-6 shadow-sm ${className}`}>{children}</div>;
}

export function SectionTitle({ title, subtitle }) {
  return (
    <div>
      <h1 className="text-3xl font-bold">{title}</h1>
      {subtitle ? <p className="text-gray-600">{subtitle}</p> : null}
    </div>
  );
}

export function Field({ label, error, children }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      {children}
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </label>
  );
}

export function Input(props) {
  return <input {...props} className={`w-full rounded-xl border px-4 py-3 outline-none focus:border-orange-400 ${props.className || ''}`} />;
}

export function TextArea(props) {
  return <textarea {...props} className={`w-full rounded-xl border px-4 py-3 outline-none focus:border-orange-400 ${props.className || ''}`} />;
}
