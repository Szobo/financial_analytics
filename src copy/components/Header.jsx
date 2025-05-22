import { Link } from "react-router-dom";

export default function Header() {
  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
        <div className="flex items-center space-x-2">
          <span className="bg-gray-200 rounded p-2 text-2xl font-bold text-green-600">TunaFinance</span>
        </div>
        <nav className="hidden md:flex space-x-6">
          <Link to="/" className="text-gray-700 hover:text-green-600 font-medium">Dashboard</Link>
          <Link to="/cash-flow" className="text-gray-700 hover:text-green-600 font-medium">Cash Flow</Link>
          <Link to="/transactions" className="text-gray-700 hover:text-green-600 font-medium">Transactions</Link>
          <Link to="/risk-alerts" className="text-gray-700 hover:text-green-600 font-medium">Risk Alerts</Link>
          <Link to="/credit-score" className="text-gray-700 hover:text-green-600 font-medium">Credit Score</Link>
        </nav>
        <div className="space-x-2">
          <button className="border border-green-600 text-green-600 px-4 py-1 rounded hover:bg-green-50">Log In</button>
          <button className="bg-green-600 text-white px-4 py-1 rounded hover:bg-green-700">Sign Up</button>
        </div>
      </div>
    </header>
  );
}
