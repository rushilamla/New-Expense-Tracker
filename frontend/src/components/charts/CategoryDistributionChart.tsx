import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
} from "chart.js";
import { Bar, Pie } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

const palette = ["#0d6efd", "#20c997", "#ffc107", "#fd7e14", "#6610f2", "#dc3545", "#6f42c1", "#198754"];

type Props = {
  labels: string[];
  amounts: number[];
  mode: "bar" | "pie";
};

export default function CategoryDistributionChart({ labels, amounts, mode }: Props) {
  const backgroundColor = labels.map((_, i) => palette[i % palette.length]);

  const data = {
    labels,
    datasets: [
      {
        label: "Expenses",
        data: amounts,
        backgroundColor,
        borderWidth: 0,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top" as const },
      tooltip: {
        callbacks: {
          label: (ctx: any) => {
            const v = ctx.parsed?.y ?? ctx.parsed;
            const value = typeof v === "number" ? v : Number(v);
            return ` ₹${value.toFixed(2)}`;
          },
        },
      },
    },
  };

  return (
    <div style={{ height: 320 }}>
      {mode === "pie" ? <Pie data={data} options={options} /> : <Bar data={data} options={options} />}
    </div>
  );
}

