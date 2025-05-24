import { useEffect, useState } from "react";
import axios from "axios";

const API_URL = 'https://tunafinance-api.onrender.com';

export default function RiskAlerts() {
  const [transactions, setTransactions] = useState([]);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    axios.get(`${API_URL}/api/transactions`)
      .then(res => setTransactions(res.data))
      .catch(err => setTransactions([]));
  }, []);

  useEffect(() => {
    // Simple rule-based alerts
    let newAlerts = [];
    if (transactions.length > 0) {
      const last = transactions[transactions.length - 1];
      if (last.amount < 0) {
        newAlerts.push("Recent transaction was an expense. Monitor your spending.");
      }
      const total = transactions.reduce((sum, t) => sum + t.amount, 0);
      if (total < 0) {
        newAlerts.push("Warning: Your net cash flow is negative.");
      }
      if (transactions.length > 5 && transactions.slice(-5).every(t => t.amount < 0)) {
        newAlerts.push("Alert: 5 consecutive expenses detected.");
      }
    }
    setAlerts(newAlerts);
  }, [transactions]);

  return (
    <section>
      <h1 className="text-2xl font-bold mb-4">Risk Alerts</h1>
      <div className="bg-white rounded-lg shadow p-4">
        {alerts.length === 0 ? (
          <p className="text-green-600">No risk alerts at this time.</p>
        ) : (
          <ul className="list-disc pl-5">
            {alerts.map((a, i) => (
              <li key={i} className="text-red-600">{a}</li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
