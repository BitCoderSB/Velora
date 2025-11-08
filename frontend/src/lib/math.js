export function pExceed(values, thr) {
  if (!values?.length) return 0;
  const n = values.length;
  const k = values.filter((v) => v > thr).length;
  return k / n;
}

export function percentile(values, p) {
  if (!values?.length) return null;
  const a = [...values].sort((x, y) => x - y);
  const i = (p / 100) * (a.length - 1);
  const lo = Math.floor(i), hi = Math.ceil(i);
  if (lo === hi) return a[lo];
  return a[lo] + (a[hi] - a[lo]) * (i - lo);
}
