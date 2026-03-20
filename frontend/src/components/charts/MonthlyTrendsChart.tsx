import {
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

type Props = {
  labels: string[];
  amounts: number[];
};

export default function MonthlyTrendsChart({ labels, amounts }: Props) {
  const data = {
    labels,
    datasets: [
      {
        label: "Monthly Expenses",
        data: amounts,
        borderColor: "#0d6efd",
        backgroundColor: "rgba(13,110,253,0.15)",
        fill: true,
        tension: 0.25,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: "top" as const } },
  };

  return (
    <div style={{ height: 320 }}>
      <Line data={data} options={options} />
    </div>
  );
}

