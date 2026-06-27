import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { addPatientSymptoms, retrieveExistingPatient } from '../api'; // Added retrieveExistingPatient
import { toast } from 'react-toastify';
import logo from '../assets/logo.jpg';

const PatientLogin = () => {
  // New State for Session Recovery
  const [isReturningUser, setIsReturningUser] = useState(false);
  const [returnPhone, setReturnPhone] = useState('');

  // Patient Registration State
  const [formData, setFormData] = useState({ 
    name: '', 
    countryCode: '+91', 
    phone: '', 
    email: '', 
    age: '', 
    weight: '', 
    height: '', 
    symptoms: '' 
  });
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Doctor Auth State
  const [showDoctorLogin, setShowDoctorLogin] = useState(false);
  const [doctorPassword, setDoctorPassword] = useState('');

  const { loginPatient, loginDoctor } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // --- SESSION RECOVERY LOGIC ---
  const handleRetrieveStatus = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      const data = await retrieveExistingPatient(returnPhone);
      // Log them back in using existing data from the queue
      loginPatient(data.patient); 
      navigate('/patient-dashboard');
      toast.success("Welcome back! Your session has been restored.");
    } catch (error) {
      toast.error(error.error || "No active record found for this number.");
    } finally {
      setIsProcessing(false);
    }
  };

  // --- NEW PATIENT SUBMIT LOGIC ---
  const handlePatientSubmit = async (e) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      const aiResponse = await addPatientSymptoms(formData);
      const completePatientData = { ...formData, aiAssessment: aiResponse };
      loginPatient(completePatientData);
      
      navigate('/patient-dashboard');
      toast.success('Triage assessment complete. Entering portal.');
    } catch (error) {
      toast.error(error.message || 'Error connecting to the triage system.');
    } finally {
      setIsProcessing(false);
    }
  };

  // --- DOCTOR SUBMIT LOGIC ---
  const handleDoctorSubmit = (e) => {
    e.preventDefault();
    if (doctorPassword === 'mediflow123') {
      loginDoctor();
      navigate('/doctor');
      toast.success('Authorized access granted. Welcome, Doctor.');
    } else {
      toast.error('Invalid authorization code.');
      setDoctorPassword('');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-500 p-4 pt-20 pb-20">
      
      <div className="bg-white dark:bg-gray-800 p-8 md:p-10 rounded-3xl shadow-xl dark:shadow-[0_10px_40px_rgba(0,0,0,0.5)] transition-all duration-500 ease-out border border-gray-100 dark:border-gray-700 w-full max-w-xl relative overflow-hidden">
        
        <div className="absolute top-0 left-0 w-full h-2 bg-linear-to-r from-clinical-500 to-emerald-400"></div>

        {/* Logo Section */}
        <div className="flex justify-center mb-6">
          <div className="bg-white px-8 py-4 rounded-2xl shadow-sm inline-block border border-gray-100 dark:border-gray-600">
            <img 
              src={logo} 
              alt="Mediflow-AI Logo" 
              className="h-20 md:h-28 w-auto object-contain"
            />
          </div>
        </div>

        {/* Toggle Bar: New vs Returning */}
        <div className="flex bg-gray-100 dark:bg-gray-900/50 p-1 rounded-xl mb-8">
          <button 
            onClick={() => setIsReturningUser(false)}
            className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${!isReturningUser ? 'bg-white dark:bg-gray-700 shadow-sm text-clinical-600 dark:text-clinical-400' : 'text-gray-400'}`}
          >
            New Registration
          </button>
          <button 
            onClick={() => setIsReturningUser(true)}
            className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${isReturningUser ? 'bg-white dark:bg-gray-700 shadow-sm text-clinical-600 dark:text-clinical-400' : 'text-gray-400'}`}
          >
            Check My Status
          </button>
        </div>

        {isReturningUser ? (
          /* --- RETURNING USER FORM --- */
          <form onSubmit={handleRetrieveStatus} className="space-y-6 animate-fade-in-right">
            <div className="text-center mb-4">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">Welcome Back</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Enter your registered phone to restore your session.</p>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Registered Phone Number</label>
              <input 
                type="tel" 
                required 
                value={returnPhone}
                onChange={(e) => setReturnPhone(e.target.value)}
                className="w-full px-4 py-4 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-clinical-500 text-gray-800 dark:text-white transition-colors" 
                placeholder="e.g. 9876543210" 
              />
            </div>
            <button 
              type="submit" 
              disabled={isProcessing}
              className="w-full bg-clinical-600 hover:bg-clinical-500 text-white font-bold py-4 rounded-xl shadow-lg transition-all flex justify-center items-center gap-2"
            >
              {isProcessing ? 'Verifying...' : 'Restore My Dashboard'}
            </button>
          </form>
        ) : (
          /* --- NEW PATIENT FORM --- */
          <form onSubmit={handlePatientSubmit} className="space-y-5 animate-fade-in-left">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Full Name</label>
                <input type="text" name="name" value={formData.name} onChange={handleInputChange} required className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-clinical-500 text-gray-800 dark:text-white transition-colors" placeholder="John Doe" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Phone Number</label>
                <div className="flex gap-2">
                  <select name="countryCode" value={formData.countryCode} onChange={handleInputChange} className="w-1/3 px-2 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-clinical-500 text-gray-800 dark:text-white transition-colors outline-none">
                    <option value="+91">+91 (IN)</option>
                    <option value="+1">+1 (US)</option>
                    <option value="+44">+44 (UK)</option>
                    <option value="+61">+61 (AU)</option>
                  </select>
                  <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} required className="w-2/3 px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-clinical-500 text-gray-800 dark:text-white transition-colors" placeholder="9876543210" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Age</label>
                <input type="number" name="age" min="0" value={formData.age} onChange={handleInputChange} required className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-clinical-500 text-gray-800 dark:text-white transition-colors" placeholder="25" />
              </div>
              <div className="flex gap-3">
                <div className="w-1/2">
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Weight (kg)</label>
                  <input type="number" name="weight" min="0" value={formData.weight} onChange={handleInputChange} required className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-clinical-500 text-gray-800 dark:text-white transition-colors" placeholder="70" />
                </div>
                <div className="w-1/2">
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Height (cm)</label>
                  <input type="number" name="height" min="0" value={formData.height} onChange={handleInputChange} required className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-clinical-500 text-gray-800 dark:text-white transition-colors" placeholder="175" />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Email Address</label>
              <input type="email" name="email" value={formData.email} onChange={handleInputChange} required className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-clinical-500 text-gray-800 dark:text-white transition-colors" placeholder="patient@example.com" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Describe Symptoms</label>
              <textarea name="symptoms" value={formData.symptoms} onChange={handleInputChange} required rows="3" className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-clinical-500 text-gray-800 dark:text-white transition-colors resize-none" placeholder="e.g., severe headache, fever..."></textarea>
            </div>
            <div className="mt-8">
              <button 
                type="submit" 
                disabled={isProcessing}
                className={`w-full font-bold py-4 px-4 rounded-xl shadow-lg transform transition-all duration-300 flex justify-center items-center gap-3
                  ${isProcessing 
                    ? 'bg-gray-400 dark:bg-gray-700 cursor-not-allowed text-white' 
                    : 'bg-clinical-600 hover:bg-clinical-500 text-white hover:shadow-clinical-500/30 hover:-translate-y-1'}`}
              >
                {isProcessing ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing AI Triage...
                  </>
                ) : (
                  'Run AI Triage & Enter Portal'
                )}
              </button>
            </div>
          </form>
        )}

        {/* Doctor Login Section */}
        <div className="mt-8 border-t border-gray-100 dark:border-gray-700/50 pt-6 text-center">
          {!showDoctorLogin ? (
            <button 
              onClick={() => setShowDoctorLogin(true)} 
              className="text-xs font-bold text-gray-400 hover:text-clinical-500 dark:hover:text-clinical-400 transition-colors tracking-widest uppercase"
            >
              Authorized Personnel Entry
            </button>
          ) : (
            <form onSubmit={handleDoctorSubmit} className="flex flex-col items-center gap-3 animate-fade-in-up">
              <input
                type="password"
                value={doctorPassword}
                onChange={(e) => setDoctorPassword(e.target.value)}
                placeholder="Enter Access Code"
                autoFocus
                className="px-4 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-clinical-500 text-gray-800 dark:text-white transition-colors text-sm w-full max-w-62 text-center tracking-widest"
              />
              <div className="flex gap-2 w-full max-w-62.5">
                <button type="button" onClick={() => setShowDoctorLogin(false)} className="flex-1 py-2 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-lg text-xs font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors uppercase tracking-wider">
                  Cancel
                </button>
                <button type="submit" className="flex-1 py-2 bg-gray-800 dark:bg-gray-700 text-white rounded-lg text-xs font-bold hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors shadow-md uppercase tracking-wider">
                  Access
                </button>
              </div>
            </form>
          )}
        </div>

      </div>
    </div>
  );
};

export default PatientLogin;