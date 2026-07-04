import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueue } from '../hooks/useQueue';
import { AuthContext } from '../context/AuthContext';
import PatientCard from '../components/PatientCard';
import QueueStats from '../components/QueueStats';

const DoctorDashboard = () => {
  const { queue, isLoading, markPatientAsTreated } = useQueue();
  const { logout } = useContext(AuthContext); 
  const navigate = useNavigate();

  // --- 🆕 NEW STATE FOR MEDICAL HISTORY ---
  const [historyData, setHistoryData] = useState([]);
  const [expandedPatientId, setExpandedPatientId] = useState(null);

  const totalPatients = queue.length;
  const criticalPatients = queue.filter((p) => p.priority >= 100).length;
  const stablePatients = totalPatients - criticalPatients;

  // Handles securely logging the doctor out and returning to the portal
  const handleLogout = () => {
    logout();
    navigate('/patient');
  };

  // --- 🆕 NEW FIX: HANDLE CALL IN ---
  const handleCallIn = async (patientId) => {
    try {
        const response = await fetch(`http://127.0.0.1:5000/call_patient/${patientId}`, {
            method: 'POST'
        });
        if (response.ok) {
            // Force a quick reload so the Doctor sees the UI update instantly
            window.location.reload(); 
        }
    } catch (error) {
        console.error("Error calling patient:", error);
    }
  };

  // --- 🆕 NEW FIX: HANDLE VIEW HISTORY ---
  const handleViewHistory = async (patientId) => {
    // If it's already open, click it again to close it
    if (expandedPatientId === patientId) {
        setExpandedPatientId(null);
        return;
    }
    try {
        const response = await fetch(`http://127.0.0.1:5000/patient_history/${patientId}`);
        const data = await response.json();
        setHistoryData(data);
        setExpandedPatientId(patientId); // Opens the dropdown for this specific patient
    } catch (error) {
        console.error("Error fetching history:", error);
    }
  };

  return (
    <div className="container mx-auto p-6 md:p-10 max-w-7xl">
      
      {/* Header section wrapper */}
      <div className="flex items-center justify-between mb-8">
        
        {/* Left Side: Back Button & Title */}
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)} 
            className="flex items-center justify-center p-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md hover:-translate-x-1 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300 group"
            title="Go Back"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500 dark:text-gray-400 group-hover:text-clinical-500 dark:group-hover:text-clinical-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-800 dark:text-white tracking-tight">
            Active <span className="text-clinical-500">Queue</span>
          </h1>
        </div>

        {/* Right Side: Doctor Logout Button */}
        <button 
          onClick={handleLogout} 
          className="px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-bold rounded-lg border border-red-100 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors text-sm uppercase tracking-wider"
        >
          Log Out
        </button>

      </div>

      <QueueStats total={totalPatients} critical={criticalPatients} stable={stablePatients} />

      {isLoading ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-clinical-500"></div>
        </div>
      ) : queue.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-10 text-center border border-dashed border-gray-300 dark:border-gray-700 shadow-sm">
          <p className="text-xl text-gray-500 dark:text-gray-400 font-medium">No patients currently in the queue.</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">Enjoy your coffee break! ☕</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          {queue.map((patient, index) => (
            <PatientCard 
              key={patient.id} 
              patient={patient} 
              index={index} 
              onComplete={markPatientAsTreated} 
              
              /* 🆕 NEW PROPS PASSED TO THE CARD */
              onCallIn={() => handleCallIn(patient.id)}
              onViewHistory={() => handleViewHistory(patient.id)}
              isHistoryExpanded={expandedPatientId === patient.id}
              historyData={expandedPatientId === patient.id ? historyData : []}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default DoctorDashboard;