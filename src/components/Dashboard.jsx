import { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import axios from "axios";
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

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const API_URL = 'https://tunafinance-api.onrender.com';

export default function Dashboard() {
  const [transactions, setTransactions] = useState([]);
  const [insight, setInsight] = useState("Loading...");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API_URL}/api/transactions`)
      .then(res => {
        setTransactions(res.data);
        setLoading(false);
      })
      .catch(() => {
        setTransactions([]);
        setLoading(false);
      });
  }, []);

  // Calculate income, expenses, float
  const income = transactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
  const expenses = transactions.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const float = income - expenses;

  // Financial Health Indicator
  let health = "Good", badgeColor = "bg-green-100 text-green-700";
  if (float < 1000) {
    health = "Critical";
    badgeColor = "bg-red-100 text-red-700";
  } else if (float < 2000) {
    health = "Warning";
    badgeColor = "bg-yellow-100 text-yellow-700";
  }

  // Business Trend (Income vs Expenses, last 7 days, always positive)
  const last7 = Array(7).fill(0).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d;
  });
  const trendLabels = last7.map(d => d.toLocaleDateString("en-KE", { weekday: "short" }));
  const incomeData = last7.map(d => {
    return transactions
      .filter(t => t.amount > 0 && new Date(t.date).toDateString() === d.toDateString())
      .reduce((sum, t) => sum + t.amount, 0);
  });
  const expenseData = last7.map(d => {
    return transactions
      .filter(t => t.amount < 0 && new Date(t.date).toDateString() === d.toDateString())
      .reduce((sum, t) => sum + Math.abs(t.amount), 0); // Always positive
  });

  const trendChartData = {
    labels: trendLabels,
    datasets: [
      {
        label: "Income (KSh)",
        data: incomeData,
        borderColor: "#16a34a",
        backgroundColor: "rgba(22,163,74,0.1)",
        tension: 0.4,
      },
      {
        label: "Expenses (KSh)",
        data: expenseData,
        borderColor: "#dc2626",
        backgroundColor: "rgba(220,38,38,0.1)",
        tension: 0.4,
      },
    ],
  };

  // Insight of the Day (simple rule-based, or you can call OpenAI API here)
  useEffect(() => {
    if (transactions.length === 0) {
      setInsight("No transactions yet. Insights will appear here.");
      return;
    }
    if (expenses > income) {
      setInsight("You spent more than you earned recently. Review your expenses!");
    } else if (float < 1000) {
      setInsight("Your float is running low. Consider reducing expenses.");
    } else {
      setInsight("Your income is higher than your expenses. Keep it up!");
    }
  }, [transactions, income, expenses, float]);

  // Recent Transactions
  const recentTx = transactions.slice(-3).reverse();

  return (
    <section>
      <h1 className="text-2xl font-bold mb-4">Business Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-4 flex flex-col">
          <div className="font-semibold text-lg mb-1">Income</div>
          <div className="text-2xl font-bold text-green-700 mb-1">KSh {income}</div>
          <div className="text-xs text-gray-500">This month</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 flex flex-col">
          <div className="font-semibold text-lg mb-1">Expenses</div>
          <div className="text-2xl font-bold text-red-700 mb-1">KSh {expenses}</div>
          <div className="text-xs text-gray-500">This month</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 flex flex-col">
          <div className="font-semibold text-lg mb-1">Available Float</div>
          <div className="text-2xl font-bold text-blue-700 mb-1">KSh {float}</div>
          <div className="text-xs text-gray-500">Current</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 flex flex-col items-center justify-center">
          <div className={`px-2 py-1 rounded-full text-sm font-semibold mb-1 ${badgeColor}`}>{health}</div>
          <div className="text-xs text-gray-500">Financial Health</div>
        </div>
      </div>

      {/* Insight of the Day */}
      <div className="bg-white rounded-lg shadow p-4 mb-8">
        <h2 className="text-lg font-bold mb-2">Insight of the Day</h2>
        <p className="text-gray-700">{insight}</p>
      </div>

      {/* Business Trend */}
      <div className="bg-white rounded-lg shadow p-4 mb-8">
        <h2 className="text-lg font-bold mb-2">Business Trends (Last 7 Days)</h2>
        <Line
          data={trendChartData}
          options={{
            responsive: true,
            plugins: { legend: { position: "top" } },
            scales: { y: { beginAtZero: true } },
          }}
        />
        {incomeData.every(v => v === 0) && expenseData.every(v => v === 0) && (
          <div className="text-center text-gray-400 mt-4">No data to display</div>
        )}
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-lg font-bold mb-2">Recent Transactions</h2>
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
            {recentTx.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center text-gray-400 py-2">No transactions yet</td>
              </tr>
            ) : (
              recentTx.map((t, i) => (
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
