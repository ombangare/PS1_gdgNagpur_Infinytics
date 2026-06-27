import React, { useState } from 'react';
import { callPatient, getPatientHistory } from '../api';
import HistoryTimeline from './HistoryTimeline';
import { toast } from 'react-toastify';

const PatientCard = ({ patient, index, onComplete }) => {
  const [isPrescribing, setIsPrescribing] = useState(false);
  const [prescriptionText, setPrescriptionText] = useState('');
  const [hasBeenCalled, setHasBeenCalled] = useState(patient.status === 'Called');
  
  // --- MEDICAL HISTORY STATES ---
  const [showHistory, setShowHistory] = useState(false);
  const [patientHistory, setPatientHistory] = useState([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  
  const isCritical = patient.priority >= 100;
  const conditionName = patient.disease || patient.condition || patient.predicted_disease || 'Pending Assessment';
  
  // Calculate wait time (15 mins per person ahead of them)
  const estimatedWait = index * 15;

  const handleComplete = () => {
    onComplete(patient.id, prescriptionText || "Follow standard care protocols.");
  };

  const handleCallPatient = async () => {
    try {
      await callPatient(patient.id);
      setHasBeenCalled(true);
      toast.success(`${patient.name} has been notified to enter the cabin.`);
    } catch (error) {
      toast.error('Failed to notify patient.');
    }
  };

  // --- TOGGLE HISTORY LOGIC ---
  const handleToggleHistory = async () => {
    if (!historyLoaded) {
      try {
        const data = await getPatientHistory(patient.id);
        setPatientHistory(data);
        setHistoryLoaded(true);
      } catch (error) {
        toast.error("Could not load patient history.");
      }
    }
    setShowHistory(!showHistory);
  };

  return (
    <div className={`p-6 rounded-2xl bg-white dark:bg-gray-800 flex flex-col justify-between transition-all duration-500 ease-out border-l-4 relative overflow-hidden shadow-sm
      ${isCritical 
        ? 'border-l-red-500 border-t border-r border-b border-red-100 dark:border-gray-700' 
        : 'border-l-clinical-500 border-t border-r border-b border-clinical-50 dark:border-gray-700'
      }`}
    >
      <div>
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-bold text-gray-800 dark:text-white capitalize">{patient.name}</h3>
          <div className="flex flex-col items-end gap-1">
            <span className={`px-3 py-1 text-xs font-black tracking-wide rounded-full shadow-sm ${isCritical ? 'bg-red-500 text-white' : 'bg-clinical-600 text-white'}`}>
              PRIORITY: {patient.priority}
            </span>
            <span className="text-[10px] font-bold text-gray-400 uppercase">Queue Pos: #{index + 1}</span>
          </div>
        </div>
        
        <div className="space-y-3 mb-4 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
          <p className="text-sm dark:text-gray-300 flex justify-between">
            <span className="text-gray-400 font-bold uppercase text-xs">AI Prediction</span>
            <span className={`font-bold ${isCritical ? 'text-red-500' : 'text-clinical-500'}`}>{conditionName}</span>
          </p>
          <p className="text-sm dark:text-gray-300 flex justify-between">
            <span className="text-gray-400 font-bold uppercase text-xs">Est. Wait</span>
            <span className="font-bold text-orange-500">{estimatedWait === 0 ? 'Next in Line' : `${estimatedWait} mins`}</span>
          </p>
        </div>

        {/* --- SYMPTOMS DISPLAY FOR DOCTOR --- */}
        <div className="mb-6 px-2">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Reported Symptoms</p>
            <p className="text-sm font-bold text-red-500 capitalize">
                {patient.symptoms && patient.symptoms.length > 0 
                    ? patient.symptoms.join(", ") 
                    : "No symptoms provided"}
            </p>
        </div>

        {/* --- DOCTOR HISTORY TOGGLE BUTTON --- */}
        <button 
          onClick={handleToggleHistory}
          className="w-full text-center py-2 mb-4 text-xs font-bold text-gray-500 hover:text-clinical-500 dark:text-gray-400 dark:hover:text-clinical-400 transition-colors uppercase tracking-widest border border-dashed border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          {showHistory ? 'Hide Medical History ▲' : 'View Medical History ▼'}
        </button>

        {/* --- HISTORY TIMELINE DROPDOWN --- */}
        {showHistory && (
          <div className="mb-6 max-h-60 overflow-y-auto pr-2 custom-scrollbar animate-fade-in-down">
            <HistoryTimeline history={patientHistory} />
          </div>
        )}
      </div>
      
      <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-700">
        {!isPrescribing ? (
          <div className="flex gap-2">
            <button 
              onClick={handleCallPatient}
              disabled={hasBeenCalled}
              className={`flex-1 py-3 rounded-xl font-bold text-xs shadow-sm transition-all duration-300 uppercase ${hasBeenCalled ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-500 cursor-not-allowed' : 'bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white'}`}
            >
              {hasBeenCalled ? 'Patient Called ✓' : 'Call In'}
            </button>
            <button 
              onClick={() => setIsPrescribing(true)}
              className={`flex-1 py-3 rounded-xl font-bold text-xs shadow-md transform hover:-translate-y-0.5 transition-all duration-300 text-white tracking-wider uppercase ${isCritical ? 'bg-red-500 hover:bg-red-600' : 'bg-clinical-600 hover:bg-clinical-500'}`}
            >
              Prescribe
            </button>
          </div>
        ) : (
          <div className="animate-fade-in-up flex flex-col gap-3">
            <textarea
              autoFocus
              className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm resize-none dark:text-white"
              rows="3"
              placeholder="Write prescription here..."
              value={prescriptionText}
              onChange={(e) => setPrescriptionText(e.target.value)}
            ></textarea>
            <div className="flex gap-2">
              <button onClick={() => setIsPrescribing(false)} className="flex-1 py-2 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg text-xs font-bold uppercase">Cancel</button>
              <button onClick={handleComplete} className="flex-1 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-xs font-bold uppercase">Send & Treat</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientCard;