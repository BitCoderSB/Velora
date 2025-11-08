export default function ProbabilityCards({ data }) {
  if (!data) return <div className="text-slate-500">Cargando ejemplo…</div>;
  const rows = [
    { key: "t2m", label: "Muy caliente", p: data?.stats?.t2m?.p_over_threshold },
    { key: "prcp", label: "Muy húmedo", p: data?.stats?.prcp?.p_over_threshold },
    { key: "wind10m", label: "Muy ventoso", p: data?.stats?.wind10m?.p_over_threshold },
  ];
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {rows.map((r) => (
        <div key={r.key} className="border rounded-xl p-3 bg-white">
          <div className="text-sm text-slate-500">{r.label}</div>
          <div className="text-3xl font-semibold">{Math.round((r.p ?? 0) * 100)}%</div>
          <div className="text-xs text-slate-500 mt-1">Fuente: demo</div>
        </div>
      ))}
    </div>
  );
}
