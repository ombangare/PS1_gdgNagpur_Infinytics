import React from 'react';

const AssessmentResult = ({ result }) => {
  if (!result) return null;

  const isCritical = result.priority >= 100;

  return (
    <div className={`p-8 rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.08)] dark:shadow-[0_10px_40px_rgba(0,0,0,0.4)] transition-all duration-500 ease-out hover:-translate-y-2 border-l-4 mb-8 bg-white dark:bg-gray-800 relative overflow-hidden
      ${isCritical 
        ? 'border-l-red-500 border border-red-100 dark:border-gray-700' 
        : 'border-l-clinical-500 border border-clinical-50 dark:border-gray-700'
      }`}
    >
      <div className="flex items-center gap-3 mb-6">
        <div className={`p-2 rounded-lg ${isCritical ? 'bg-red-100 dark:bg-red-900/30' : 'bg-clinical-100 dark:bg-clinical-900/30'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${isCritical ? 'text-red-600 dark:text-red-400' : 'text-clinical-600 dark:text-clinical-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-2xl font-extrabold text-gray-800 dark:text-white">AI Assessment Complete</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-bold mb-1">Predicted Condition</p>
          <p className="font-bold text-xl text-gray-800 dark:text-white">{result.predicted_disease}</p>
        </div>
        
        <div className={`p-4 rounded-2xl border ${isCritical ? 'bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30' : 'bg-clinical-50 dark:bg-clinical-900/10 border-clinical-100 dark:border-clinical-900/30'}`}>
          <p className={`text-xs uppercase tracking-wider font-bold mb-1 ${isCritical ? 'text-red-500 dark:text-red-400' : 'text-clinical-600 dark:text-clinical-400'}`}>Priority Level</p>
          <p className={`font-bold text-xl ${isCritical ? 'text-red-700 dark:text-red-300' : 'text-clinical-700 dark:text-clinical-300'}`}>{result.priority}</p>
        </div>

        <div className="md:col-span-2 bg-gray-50 dark:bg-gray-900/50 p-5 rounded-2xl border border-gray-100 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-bold mb-2">Recommended Action</p>
          <p className="font-medium text-gray-800 dark:text-gray-200 text-lg">{result.advice}</p>
        </div>

        <div className="md:col-span-2">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-bold mb-1">Assigned Medical Professional</p>
          <p className="font-bold text-gray-800 dark:text-white text-lg flex items-center gap-2">
             <span className="w-2 h-2 rounded-full bg-green-500"></span>
             {result.assigned_doctor}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AssessmentResult;