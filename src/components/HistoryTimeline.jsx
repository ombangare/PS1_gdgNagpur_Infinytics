import React from 'react';

const HistoryTimeline = ({ history }) => {
  if (!history || history.length === 0) {
    return (
      <div className="p-6 text-center border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl bg-gray-50 dark:bg-gray-800/50">
        <p className="text-gray-500 dark:text-gray-400 font-medium">No past medical records found.</p>
        <p className="text-xs text-gray-400 mt-2">Any external records you add, or treatments received at this clinic, will appear here.</p>
      </div>
    );
  }

  return (
    <div className="relative border-l-2 border-clinical-200 dark:border-clinical-900/50 ml-3 md:ml-4 space-y-8 mt-6">
      {history.map((record, index) => {
        const isExternal = record.source === 'External Doctor';

        return (
          <div key={record.id || index} className="relative pl-6 md:pl-8 animate-fade-in-up" style={{ animationDelay: `${index * 100}ms` }}>
            
            {/* Timeline Dot - Different color for external vs clinic */}
            <div className={`absolute w-4 h-4 rounded-full -left-2.25 top-1 shadow-[0_0_0_4px_white] dark:shadow-[0_0_0_4px_#1f2937] ${isExternal ? 'bg-orange-400' : 'bg-clinical-500'}`}></div>
            
            <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-extrabold text-gray-800 dark:text-white text-lg flex items-center gap-2">
                    {record.condition}
                    {isExternal && (
                      <span className="bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400 text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-md font-bold">External</span>
                    )}
                  </h3>
                </div>
                <span className="text-xs font-bold bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 px-3 py-1 rounded-full uppercase tracking-wider">
                  {record.date}
                </span>
              </div>
              <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mt-3">
                <span className="font-bold text-gray-400 dark:text-gray-500 uppercase text-xs tracking-wider mr-2">Treatment / Advice:</span>
                {record.advice}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default HistoryTimeline;