import React from 'react';

const QueueStats = ({ total, critical, stable }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {/* Total Patients Panel */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-[0_8px_30px_rgba(20,184,166,0.1)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] hover:shadow-[0_15px_40px_rgba(20,184,166,0.2)] dark:hover:shadow-[0_15px_40px_rgba(0,0,0,0.6)] hover:-translate-y-2 transition-all duration-500 ease-out border border-clinical-100 dark:border-gray-700 flex flex-col items-center relative overflow-hidden group">
        <div className="absolute top-0 w-full h-1 bg-clinical-500 group-hover:h-2 transition-all duration-300"></div>
        <span className="text-gray-500 dark:text-gray-400 text-sm uppercase tracking-wider font-bold mt-2">Total Patients</span>
        <span className="text-5xl font-extrabold text-clinical-600 dark:text-clinical-400 mt-3">{total}</span>
      </div>

      {/* Critical Queue Panel */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-[0_8px_30px_rgba(239,68,68,0.1)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] hover:shadow-[0_15px_40px_rgba(239,68,68,0.25)] dark:hover:shadow-[0_15px_40px_rgba(0,0,0,0.6)] hover:-translate-y-2 transition-all duration-500 ease-out border border-red-100 dark:border-gray-700 flex flex-col items-center relative overflow-hidden group">
        <div className="absolute top-0 w-full h-1 bg-red-500 group-hover:h-2 transition-all duration-300"></div>
        <span className="text-red-500 dark:text-red-400 text-sm uppercase tracking-wider font-bold mt-2">Critical Priority</span>
        <span className="text-5xl font-extrabold text-red-600 dark:text-red-500 mt-3">{critical}</span>
      </div>

      {/* Stable Patients Panel */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-[0_8px_30px_rgba(16,185,129,0.1)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] hover:shadow-[0_15px_40px_rgba(16,185,129,0.2)] dark:hover:shadow-[0_15px_40px_rgba(0,0,0,0.6)] hover:-translate-y-2 transition-all duration-500 ease-out border border-emerald-100 dark:border-gray-700 flex flex-col items-center relative overflow-hidden group">
        <div className="absolute top-0 w-full h-1 bg-emerald-500 group-hover:h-2 transition-all duration-300"></div>
        <span className="text-emerald-600 dark:text-emerald-400 text-sm uppercase tracking-wider font-bold mt-2">Stable Condition</span>
        <span className="text-5xl font-extrabold text-emerald-600 dark:text-emerald-500 mt-3">{stable}</span>
      </div>
    </div>
  );
};

export default QueueStats;