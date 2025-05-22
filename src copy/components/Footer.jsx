export default function Footer() {
  return (
    <footer className="bg-gray-100 mt-8 py-6">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center px-4">
        <div className="mb-2 md:mb-0">
          <span className="font-bold text-green-600">TunaFinance</span>
          <span className="ml-2 text-gray-500 text-sm">Empowering Kenyan small businesses with accessible financial tools for growth and stability</span>
        </div>
        <div className="flex space-x-4 text-sm text-gray-600">
          <a href="#">Dashboard</a>
          <a href="#">Cash Flow</a>
          <a href="#">Customers</a>
          <a href="#">Risk Alerts</a>
          <a href="#">Settings</a>
        </div>
        <div className="text-sm text-gray-500 mt-2 md:mt-0">
          &copy; 2025 TunaFinance. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
