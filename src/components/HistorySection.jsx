import React from 'react';

const HistorySection = ({ history }) => {
  if (!history || history.length === 0) return null;

  return (
    <div className="mt-12">
      <h2 className="text-xl font-extrabold text-gray-800 dark:text-white mb-6 flex items-center gap-2 px-2">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-clinical-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Assessment History
      </h2>
      
      <div className="grid grid-cols-1 gap-4">
        {history.map((item, index) => (
          // Antigravity applied to each individual history item
          <div 
            key={index} 
            className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm hover:shadow-[0_10px_30px_rgba(20,184,166,0.15)] dark:hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)] border border-gray-100 dark:border-gray-700 transform hover:-translate-y-1.5 transition-all duration-500 ease-out group"
          >
            <div className="flex justify-between items-start mb-3">
              <p className="font-bold text-gray-800 dark:text-white text-lg group-hover:text-clinical-600 dark:group-hover:text-clinical-400 transition-colors">{item.predicted_disease}</p>
              <span className={`text-xs px-3 py-1 rounded-full font-bold shadow-sm ${item.priority >= 100 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}>
                Priority: {item.priority}
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 font-medium mb-3">{item.advice}</p>
            <div className="flex justify-between items-center text-xs text-gray-400 dark:text-gray-500 border-t border-gray-50 dark:border-gray-700 pt-3">
               <span>Assigned to: {item.assigned_doctor || 'N/A'}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HistorySection;