const memory = new Map();

export async function fetchLocal(path) {
  if (memory.has(path)) return memory.get(path);
  const res = await fetch(path);
  if (!res.ok) throw new Error(`No disponible: ${path}`);
  const json = await res.json();
  memory.set(path, json);
  return json;
}

export const fetchSample = (path) => fetchLocal(path);
