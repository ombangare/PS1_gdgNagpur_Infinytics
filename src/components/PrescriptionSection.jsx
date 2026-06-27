import React from 'react';
import { toast } from 'react-toastify';

const PrescriptionSection = ({ result }) => {
  if (!result || result.status !== 'Treated') return null;

  const handleDownloadPDF = () => {
    toast.info("Preparing Document...", { autoClose: 1500 });
    
    // Slight delay ensures the toast renders before the browser pauses the screen to open the PDF dialog
    setTimeout(() => {
      window.print();
    }, 500);
  };

  return (
    <div className="mt-8 animate-fade-in-up">
      <div 
        /* THIS ID IS CRITICAL: It matches the CSS we just added */
        id="prescription-print-area" 
        className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-[0_10px_40px_rgba(20,184,166,0.1)] dark:shadow-[0_10px_40px_rgba(0,0,0,0.4)] hover:shadow-[0_15px_50px_rgba(20,184,166,0.15)] transition-all duration-500 ease-out border border-clinical-100 dark:border-gray-700 mb-8 relative overflow-hidden"
      >
        
        {/* Breathing Glow - Automatically hidden during print because it lacks the ID */}
        <div className="absolute -inset-1 bg-linear-to-r from-clinical-400 to-blue-500 rounded-3xl blur opacity-0 hover:opacity-10 transition duration-1000 pointer-events-none no-print"></div>

        <div className="relative z-10 text-gray-800 dark:text-white">
          
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-extrabold flex items-center gap-3 text-gray-800 dark:text-white">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-clinical-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Active Prescription
            </h2>
            <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold uppercase tracking-wider rounded-full flex items-center gap-2">
               <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse no-print"></span>
               Verified
            </span>
          </div>

          {/* Notes Box */}
          <div className="p-5 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-200 dark:border-gray-700 mb-4">
            <p className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wider font-bold mb-2">Doctor's Notes & Medication</p>
            <p className="text-lg font-medium leading-relaxed whitespace-pre-wrap text-gray-800 dark:text-gray-200">
              {result.advice || "Take prescribed medication as directed. Ensure adequate rest and hydration."}
            </p>
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-bold">Prescribing Physician</p>
              <p className="font-bold signature-font text-gray-800 dark:text-white">{result.assigned_doctor || 'Mediflow Doctor'}</p>
            </div>
            
            {/* Download Button - Notice the "no-print" class! */}
            <button 
              onClick={handleDownloadPDF}
              className="no-print text-clinical-600 dark:text-clinical-400 hover:text-clinical-700 dark:hover:text-clinical-300 font-bold text-sm flex items-center gap-2 transition-colors bg-transparent border-none cursor-pointer p-2"
            >
              Download PDF
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </button>

          </div>
        </div>
      </div>
    </div>
  );
};

export default PrescriptionSection;