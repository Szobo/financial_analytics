import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import Dashboard from "./components/Dashboard";
import Footer from "./components/Footer";
import CashFlow from "./pages/CashFlow";
import RiskAlerts from "./pages/RiskAlerts";
import CreditScore from "./pages/CreditScore";
import TransactionDetails from "./components/TransactionDetails";

export default function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <main className="flex-1 w-full max-w-6xl mx-auto px-2 py-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/cash-flow" element={<CashFlow />} />
            <Route path="/risk-alerts" element={<RiskAlerts />} />
            <Route path="/credit-score" element={<CreditScore />} />
            <Route path="/transactions" element={<TransactionDetails />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}
