import { Line } from "react-chartjs-2";
import { Chart as ChartJS, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend } from "chart.js";
ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend);

export default function TimeSeriesChart({ data }) {
  if (!data) return <div className="text-slate-500 text-sm">Sin datos para graficar.</div>;
  const labels = ["P10","P50","P90"];
  const t2m = data?.stats?.t2m || {};
  const chartData = { labels, datasets: [{ label: "Temperatura (°C)", data: [t2m.p10,t2m.p50,t2m.p90] }] };
  const options = { responsive: true, plugins: { legend: { display: true } } };
  return <Line data={chartData} options={options} />;
}
