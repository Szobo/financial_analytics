import { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'https://tunafinance-api.onrender.com';

export default function TransactionDetails() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [testAmount, setTestAmount] = useState('');
  const [testPhone, setTestPhone] = useState('');
  const [testRef, setTestRef] = useState('');

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/transactions`);
      setTransactions(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch transactions');
      setLoading(false);
    }
  };

  const handleTestTransaction = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/api/simulate-payment`, {
        amount: testAmount,
        msisdn: testPhone,
        billRefNumber: testRef
      });
      fetchTransactions(); // Refresh the list
      setTestAmount('');
      setTestPhone('');
      setTestRef('');
    } catch (err) {
      setError('Failed to simulate transaction');
    }
  };

  if (loading) return <div className="text-center py-4">Loading transactions...</div>;
  if (error) return <div className="text-red-500 text-center py-4">{error}</div>;

  return (
    <div className="space-y-6">
      {/* Test Transaction Form */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Test Transaction</h2>
        <form onSubmit={handleTestTransaction} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Amount (KES)</label>
            <input
              type="number"
              value={testAmount}
              onChange={(e) => setTestAmount(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
              placeholder="Enter amount"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Phone Number</label>
            <input
              type="tel"
              value={testPhone}
              onChange={(e) => setTestPhone(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
              placeholder="254XXXXXXXXX"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Reference Number</label>
            <input
              type="text"
              value={testRef}
              onChange={(e) => setTestRef(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
              placeholder="Enter reference"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            Simulate Transaction
          </button>
        </form>
      </div>

      {/* Transactions List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold">Recent Transactions</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                    No transactions yet
                  </td>
                </tr>
              ) : (
                transactions.map((tx, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(tx.date).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      KES {tx.amount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {tx.msisdn}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {tx.billRefNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Completed
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 
