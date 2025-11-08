import ProximityGlow from "@components/ui/ProximityGlow.jsx";
import { useEffect, useRef, useState } from "react";
import { useAppStore } from "@store/useAppStore.js";

const API = "https://nominatim.openstreetmap.org/search";

export default function SearchBar() {
  const setCoords = useAppStore(s => s.setCoords);
  const [q, setQ] = useState("");
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const abortRef = useRef(null);
  const tRef = useRef(null);

  useEffect(() => {
    if (!q || q.trim().length < 3) { setItems([]); return; }
    clearTimeout(tRef.current);
    tRef.current = setTimeout(async () => {
      abortRef.current?.abort();
      abortRef.current = new AbortController();
      const url = `${API}?format=json&accept-language=es&limit=6&q=${encodeURIComponent(q)}`;
      try {
        const res = await fetch(url, { signal: abortRef.current.signal, headers: { "User-Agent": "Skylikely-Demo" }});
        if (!res.ok) return;
        const data = await res.json();
        setItems(data.map(d => ({ label: d.display_name, lat: +d.lat, lon: +d.lon })));
        setOpen(true);
      } catch { /* ignorar */ }
    }, 250);
    return () => clearTimeout(tRef.current);
  }, [q]);

  const choose = (it) => {
    setQ(it.label);
    setItems([]);
    setOpen(false);
    setCoords(it.lat, it.lon);
  };

  return (
    <div className="relative">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <ProximityGlow className="rounded-lg">
          <input
            value={q}
            onChange={(e)=>setQ(e.target.value)}
            placeholder="Buscar lugar (tipo Google Maps)…"
            className="w-full bg-black/60 backdrop-blur-sm border border-white/20 text-white rounded-lg pl-10 pr-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            onFocus={()=> items.length && setOpen(true)}
            onBlur={()=> setTimeout(()=>setOpen(false), 150)}
          />
        </ProximityGlow>
      </div>
      {open && items.length > 0 && (
        <div className="absolute z-20 mt-1 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg">
          {items.map((it, i) => (
            <button
              key={i}
              onClick={()=>choose(it)}
              className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 first:rounded-t-lg last:rounded-b-lg"
            >
              <div className="font-medium text-slate-900 dark:text-slate-100 truncate">{it.label.split(',')[0]}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 truncate">{it.label}</div>
            </button>
          ))}
        </div>
      )}
      <div className="text-xs text-slate-500 mt-1">
        Búsqueda por <a className="underline hover:text-slate-700" href="https://nominatim.openstreetmap.org" target="_blank">Nominatim</a>
      </div>
    </div>
  );
}
