import { useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// Sample float data for each timeframe
const floatDataSets = {
  Daily: {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    data: [12000, 11000, 9500, 8700, 9800, 10300, 11500],
  },
  Weekly: {
    labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
    data: [12000, 9500, 9800, 11500],
  },
  Monthly: {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    data: [12000, 11000, 9500, 8700, 9800, 10300, 11500, 12000, 11000, 9500, 8700, 9800],
  },
  Yearly: {
    labels: ["2021", "2022", "2023", "2024"],
    data: [9000, 11000, 10500, 11500],
  },
};

const chartOptions = {
  responsive: true,
  plugins: {
    legend: { display: true, position: "top" },
    title: { display: false },
    tooltip: { callbacks: { label: ctx => `KSh ${ctx.parsed.y}` } },
  },
  scales: {
    y: {
      beginAtZero: false,
      title: { display: true, text: "KSh" },
      ticks: { callback: value => `KSh ${value}` },
    },
    x: {
      title: { display: true, text: "Day" },
    },
  },
};

export default function FloatTrendLine() {
  const [activeTab, setActiveTab] = useState("Daily");
  const tabs = ["Daily", "Weekly", "Monthly", "Yearly"];
  const { labels, data } = floatDataSets[activeTab];

  const chartData = {
    labels,
    datasets: [
      {
        label: "Float (KSh)",
        data,
        borderColor: "#0e7490",
        backgroundColor: "rgba(14,116,144,0.1)",
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: "#0e7490",
      },
    ],
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 mt-8">
      {/* Tabs for timeframes */}
      <div className="flex flex-wrap gap-2 mb-4">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-full text-sm font-semibold focus:outline-none transition
              ${activeTab === tab
                ? "bg-blue-600 text-white shadow"
                : "bg-gray-100 text-gray-700 hover:bg-blue-100"}`}
          >
            {tab}
          </button>
        ))}
      </div>
      {/* Float Trend Line Chart */}
      <h2 className="text-lg font-semibold mb-2">Float Trend ({activeTab})</h2>
      <div className="h-64 w-full">
        <Line data={chartData} options={chartOptions} />
      </div>
      {/* Responsive note */}
      <div className="text-xs text-gray-400 mt-2 text-center md:text-right">
        Float = Available cash (KES) per {activeTab.toLowerCase()}
      </div>
    </div>
  );
}
