import { useEffect, useState } from "react";
import axios from "axios";

const API_URL = 'https://tunafinance-api.onrender.com';

function calculateScore(transactions) {
  if (transactions.length === 0) return 500;
  const net = transactions.reduce((sum, t) => sum + t.amount, 0);
  let score = 600 + Math.floor(net / 1000) * 10;
  if (score > 850) score = 850;
  if (score < 300) score = 300;
  return score;
}

export default function CreditScore() {
  const [transactions, setTransactions] = useState([]);
  const [score, setScore] = useState(500);

  useEffect(() => {
    axios.get(`${API_URL}/api/transactions`)
      .then(res => setTransactions(res.data))
      .catch(err => setTransactions([]));
  }, []);

  useEffect(() => {
    setScore(calculateScore(transactions));
  }, [transactions]);

  return (
    <section>
      <h1 className="text-2xl font-bold mb-4">Credit Score Rating</h1>
      <div className="bg-white rounded-lg shadow p-4 flex flex-col items-center">
        <div className="text-5xl font-bold mb-2">{score}</div>
        <div className="text-lg mb-4">
          {score >= 750 ? "Excellent" : score >= 650 ? "Good" : score >= 600 ? "Fair" : "Poor"}
        </div>
        <p className="text-gray-600">
          Your credit score is calculated based on your recent M-Pesa cash flow. Increase your net cash flow to improve your score!
        </p>
      </div>
    </section>
  );
}
