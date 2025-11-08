import dayjs from "dayjs";

export function dateISOToDoy(dateISO) {
  const d = dayjs(dateISO);
  const start = dayjs(`${d.year()}-01-01`);
  return d.diff(start, "day") + 1; // 1..366
}

export function doyToDateISO(doy, year = 2024) {
  return dayjs(`${year}-01-01`).add(doy - 1, "day").format("YYYY-MM-DD");
}
