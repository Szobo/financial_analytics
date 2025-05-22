import { useEffect, useState } from "react";
import axios from "axios";
import { Bar, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const timeframes = ["Daily", "Weekly", "Monthly", "Yearly"];

function groupTransactions(transactions, timeframe) {
  const now = new Date();
  let groups = [];
  if (timeframe === "Daily") {
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const label = d.toLocaleDateString("en-KE", { weekday: "short" });
      const dayTrans = transactions.filter(
        t => new Date(t.date).toDateString() === d.toDateString()
      );
      groups.push({
        label,
        total: dayTrans.reduce((sum, t) => sum + t.amount, 0),
        tx: dayTrans,
      });
    }
  } else if (timeframe === "Weekly") {
    for (let i = 3; i >= 0; i--) {
      const start = new Date(now);
      start.setDate(now.getDate() - i * 7);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      const label = `Wk ${4 - i}`;
      const weekTrans = transactions.filter(t => {
        const td = new Date(t.date);
        return td >= start && td <= end;
      });
      groups.push({
        label,
        total: weekTrans.reduce((sum, t) => sum + t.amount, 0),
        tx: weekTrans,
      });
    }
  } else if (timeframe === "Monthly") {
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleDateString("en-KE", { month: "short" });
      const monthTrans = transactions.filter(t => {
        const td = new Date(t.date);
        return td.getMonth() === d.getMonth() && td.getFullYear() === d.getFullYear();
      });
      groups.push({
        label,
        total: monthTrans.reduce((sum, t) => sum + t.amount, 0),
        tx: monthTrans,
      });
    }
  } else if (timeframe === "Yearly") {
    for (let i = 2; i >= 0; i--) {
      const year = now.getFullYear() - i;
      const label = year.toString();
      const yearTrans = transactions.filter(t => new Date(t.date).getFullYear() === year);
      groups.push({
        label,
        total: yearTrans.reduce((sum, t) => sum + t.amount, 0),
        tx: yearTrans,
      });
    }
  }
  return groups;
}

export default function CashFlow() {
  const [transactions, setTransactions] = useState([]);
  const [tab, setTab] = useState("Daily");

  useEffect(() => {
    axios.get("http://localhost:3000/api/transactions")
      .then(res => setTransactions(res.data))
      .catch(() => setTransactions([]));
  }, []);

  const grouped = groupTransactions(transactions, tab);

  // Net Cash Flow chart data
  const chartData = {
    labels: grouped.map(g => g.label),
    datasets: [
      {
        label: `${tab} Net Cash Flow (KSh)`,
        data: grouped.map(g => g.total),
        backgroundColor: "#3b82f6",
        borderColor: "#2563eb",
        borderWidth: 2,
        fill: true,
        tension: 0.4,
      },
    ],
  };

  // Float Trend chart data (running sum)
  let runningFloat = 0;
  const floatTrend = grouped.map(g => {
    runningFloat += g.total;
    return runningFloat;
  });

  // Rule-based alert logic
  const currentFloat = floatTrend.length > 0 ? floatTrend[floatTrend.length - 1] : 0;
  let floatAlert = null;
  if (currentFloat < 0) {
    floatAlert = (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        <strong>Alert:</strong> Your available cash (float) is negative. Consider reducing expenses or increasing income to avoid cash flow problems.
      </div>
    );
  } else if (currentFloat < 1000) {
    floatAlert = (
      <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
        <strong>Warning:</strong> Your float is low. Monitor your spending and try to boost your income.
      </div>
    );
  }

  // Split float trend for coloring
  const floatPositive = floatTrend.map(v => (v >= 0 ? v : null));
  const floatNegative = floatTrend.map(v => (v < 0 ? v : null));

  const floatTrendData = {
    labels: grouped.map(g => g.label),
    datasets: [
      {
        label: `${tab} Float (KSh) - Safe`,
        data: floatPositive,
        borderColor: "#16a34a",
        backgroundColor: "rgba(22,163,74,0.1)",
        tension: 0.4,
        spanGaps: true,
      },
      {
        label: `${tab} Float (KSh) - Danger`,
        data: floatNegative,
        borderColor: "#dc2626",
        backgroundColor: "rgba(220,38,38,0.1)",
        tension: 0.4,
        spanGaps: true,
      },
    ],
  };

  // Transaction history for selected tab
  const txHistory = grouped.flatMap(g => g.tx);

  return (
    <section>
      <h1 className="text-2xl font-bold mb-4">Cash Flow Management</h1>

      {/* Rule-based float alert */}
      {floatAlert}

      {/* Tabs for timeframes */}
      <div className="flex space-x-2 mb-4">
        {timeframes.map(tf => (
          <button
            key={tf}
            className={`px-4 py-2 rounded ${tab === tf ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"}`}
            onClick={() => setTab(tf)}
          >
            {tf}
          </button>
        ))}
      </div>

      {/* Net Cash Flow Chart */}
      <div className="bg-white rounded-lg shadow p-4 mb-8">
        <h2 className="text-lg font-bold mb-2">{tab} Net Cash Flow</h2>
        <Bar
          data={chartData}
          options={{
            responsive: true,
            plugins: { legend: { position: "top" } },
            scales: { y: { beginAtZero: true } },
          }}
        />
        {chartData.datasets[0].data.every(v => v === 0) && (
          <div className="text-center text-gray-400 mt-4">No data to display</div>
        )}
      </div>

      {/* Float Trend Chart */}
      <div className="bg-white rounded-lg shadow p-4 mb-8">
        <h2 className="text-lg font-bold mb-2">{tab} Float Trend</h2>
        <Line
          data={floatTrendData}
          options={{
            responsive: true,
            plugins: { legend: { position: "top" } },
            scales: { y: { beginAtZero: true } },
          }}
        />
        {floatTrendData.datasets[0].data.every(v => v === 0) && (
          <div className="text-center text-gray-400 mt-4">No data to display</div>
        )}
      </div>

      {/* Transaction History */}
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-lg font-bold mb-2">Transaction History ({tab})</h2>
        <table className="min-w-full bg-white rounded shadow">
          <thead>
            <tr>
              <th className="px-2 py-1">Date</th>
              <th className="px-2 py-1">Amount</th>
              <th className="px-2 py-1">MSISDN</th>
              <th className="px-2 py-1">Bill Ref</th>
            </tr>
          </thead>
          <tbody>
            {txHistory.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center text-gray-400 py-2">No transactions yet</td>
              </tr>
            ) : (
              txHistory.map((t, i) => (
                <tr key={i}>
                  <td className="px-2 py-1">{new Date(t.date).toLocaleString()}</td>
                  <td className="px-2 py-1">KSh {t.amount}</td>
                  <td className="px-2 py-1">{t.msisdn}</td>
                  <td className="px-2 py-1">{t.billRefNumber}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}