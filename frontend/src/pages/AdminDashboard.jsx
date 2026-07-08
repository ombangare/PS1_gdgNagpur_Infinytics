import React, { useState, useEffect } from 'react';
import apiClient from '../api';
import { toast } from 'react-toastify';
import logo from '../assets/logo.jpg';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'; // Added Import

const AdminDashboard = () => {
  const [resources, setResources] = useState({ beds: {}, inventory: [] });
  const [trendData, setTrendData] = useState([]); // Added State
  const [isLoading, setIsLoading] = useState(true);

  // Fetch live data from Flask
  const fetchResources = async () => {
    try {
      const response = await apiClient.get('/facility_resources');
      setResources(response.data);
      
      // Fetch trend data
      const trendRes = await apiClient.get('/health-trends');
      const formatted = Object.keys(trendRes.data.trends).map(k => ({ name: k, count: trendRes.data.trends[k] }));
      setTrendData(formatted);
    } catch (error) {
      console.error("Error fetching admin data:", error);
      toast.error("Failed to sync with facility database.");
    } finally {
      setIsLoading(false);
    }
  };

  // Sync every 10 seconds for real-time monitoring
  useEffect(() => {
    fetchResources();
    const interval = setInterval(fetchResources, 10000);
    return () => clearInterval(interval);
  }, []);

  // Calculate Bed Occupancy Percentage
  const totalBeds = resources.beds.total_beds || 0;
  const occupiedBeds = resources.beds.occupied_beds || 0;
  const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;
  const isBedCritical = occupancyRate >= 90;

  // Filter items that are hitting the alert threshold
  const criticalInventory = resources.inventory.filter(item => item.quantity <= item.alert_threshold);

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900"><div className="animate-spin h-10 w-10 border-4 border-clinical-500 border-t-transparent rounded-full"></div></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-500 p-6 md:p-10 font-sans">
      
      {/* HEADER SECTION */}
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4 animate-fade-in-down">
        <div className="flex items-center gap-4">
          <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
            <img src={logo} alt="Mediflow-AI Logo" className="h-10 w-auto object-contain" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-gray-800 dark:text-white tracking-tight">District Command Center</h1>
            <p className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mt-1">Smart Health Supply Chain</p>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-white dark:bg-gray-800 px-4 py-2 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <span className="relative flex h-3 w-3">
             <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
             <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </span>
          <span className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Live Sync Active</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* NEW: DISEASE TREND CHART */}
        <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
          <h2 className="text-xl font-extrabold text-gray-800 dark:text-white mb-6">Disease Outbreak Trends</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData}>
                <XAxis dataKey="name" stroke="#8884d8" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#4f46e5" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI EARLY WARNING ALERTS BANNER */}
        {criticalInventory.length > 0 || isBedCritical ? (
          <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-6 rounded-2xl shadow-sm animate-pulse flex items-start gap-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <h3 className="text-lg font-black text-red-800 dark:text-red-400 uppercase tracking-wider mb-1">AI Intervention Required</h3>
              <p className="text-sm text-red-700 dark:text-red-300 font-medium">
                {isBedCritical ? "Facility bed capacity has reached critical levels. Reroute incoming patients. " : ""}
                {criticalInventory.length > 0 ? `${criticalInventory.length} inventory items are below minimum safe thresholds.` : ""}
              </p>
            </div>
          </div>
        ) : null}

        {/* TOP METRICS GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in-up">
          <div className={`p-8 rounded-3xl shadow-sm border ${isBedCritical ? 'bg-red-500 border-red-600 text-white' : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700'}`}>
            <h2 className={`text-sm font-bold uppercase tracking-widest mb-6 ${isBedCritical ? 'text-red-100' : 'text-gray-500 dark:text-gray-400'}`}>Facility Bed Capacity</h2>
            <div className="flex items-end justify-between mb-4">
              <span className="text-6xl font-black">{occupancyRate}%</span>
              <span className={`text-sm font-bold pb-2 ${isBedCritical ? 'text-red-200' : 'text-gray-400'}`}>{occupiedBeds} / {totalBeds} Beds Full</span>
            </div>
            <div className={`h-3 w-full rounded-full overflow-hidden ${isBedCritical ? 'bg-red-400' : 'bg-gray-100 dark:bg-gray-700'}`}>
              <div className={`h-full rounded-full ${isBedCritical ? 'bg-white' : 'bg-clinical-500'}`} style={{ width: `${occupancyRate}%` }}></div>
            </div>
          </div>
          <div className="lg:col-span-2 grid grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col justify-center">
              <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-2">Total Inventory SKUs</h2>
              <p className="text-5xl font-black text-gray-800 dark:text-white">{resources.inventory.length}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col justify-center">
              <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-2">Critical Shortages</h2>
              <p className={`text-5xl font-black ${criticalInventory.length > 0 ? 'text-red-500' : 'text-green-500'}`}>{criticalInventory.length}</p>
            </div>
          </div>
        </div>

        {/* INVENTORY TABLE SECTION */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <div className="p-6 md:p-8 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
            <h2 className="text-xl font-extrabold text-gray-800 dark:text-white">Live Supply Chain Tracking</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-900/50">
                  <th className="p-4 md:p-6 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Medical Item</th>
                  <th className="p-4 md:p-6 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Current Stock</th>
                  <th className="p-4 md:p-6 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">AI Forecast: Burn Rate</th>
                  <th className="p-4 md:p-6 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Est. Days Left</th>
                  <th className="p-4 md:p-6 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">System Status</th>
                </tr>
              </thead>
              <tbody>
                {resources.inventory.map((item) => {
                  const isLow = item.quantity <= item.alert_threshold;
                  const isCriticalTime = item.days_remaining <= 7;
                  return (
                    <tr key={item.id} className="border-b border-gray-100 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="p-4 md:p-6 font-bold text-gray-800 dark:text-white">{item.item_name}</td>
                      <td className="p-4 md:p-6">
                        <span className={`text-lg font-black ${isLow ? 'text-red-500' : 'text-gray-800 dark:text-white'}`}>{item.quantity}</span>
                      </td>
                      <td className="p-4 md:p-6 text-sm font-medium text-gray-500">-{item.daily_burn} units/day</td>
                      <td className="p-4 md:p-6">
                        <span className={`text-lg font-black ${isCriticalTime ? 'text-orange-500' : 'text-clinical-500'}`}>{item.days_remaining} Days</span>
                      </td>
                      <td className="p-4 md:p-6">
                        {isLow || isCriticalTime ? (
                          <span className="px-3 py-1 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-xs font-black uppercase tracking-wider rounded-full inline-flex items-center gap-1">⚠️ Restock Needed</span>
                        ) : (
                          <span className="px-3 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs font-black uppercase tracking-wider rounded-full">Optimal</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;