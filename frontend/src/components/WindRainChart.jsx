export default function Downloads({ data }) {
  if (!data) return null;

  const downloadJSON = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement("a"), { href: url, download: "resultado.json" });
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  };

  return (
    <div className="flex items-center gap-2">
      <button onClick={downloadJSON} className="px-3 py-2 rounded-lg border hover:bg-slate-50 text-sm">
        Descargar JSON
      </button>
      <div className="text-xs text-slate-500">Mismo formato que /public/data/samples/…</div>
    </div>
  );
}
