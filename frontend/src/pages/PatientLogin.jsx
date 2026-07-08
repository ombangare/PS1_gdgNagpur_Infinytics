import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { addPatientSymptoms, retrieveExistingPatient } from '../api'; 
import { toast } from 'react-toastify';
import logo from '../assets/logo.jpg';
import AITriageChat from '../components/AITriageChat';

const PatientLogin = () => {
  const [isReturningUser, setIsReturningUser] = useState(false);
  const [returnPhone, setReturnPhone] = useState('');
  const [registrationStep, setRegistrationStep] = useState(1); 
  const [gender, setGender] = useState('Male');

  const [formData, setFormData] = useState({ 
    name: '', 
    countryCode: '+91', 
    phone: '', 
    email: '', 
    age: '', 
    weight: '', 
    height: '', 
    language: 'English'
  });
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [showDoctorLogin, setShowDoctorLogin] = useState(false);
  const [doctorPassword, setDoctorPassword] = useState('');

  const { loginPatient, loginDoctor } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRetrieveStatus = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      const data = await retrieveExistingPatient(returnPhone);
      loginPatient(data.patient); 
      navigate('/patient-dashboard');
      toast.success("Welcome back! Your session has been restored.");
    } catch (error) {
      toast.error(error.error || "No active record found for this number.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleProceedToChat = (e) => {
    e.preventDefault();
    setRegistrationStep(2);
  };

  const handleChatComplete = async (chatHistory) => {
    setIsProcessing(true);
    try {
      const userSymptoms = chatHistory
        .filter(msg => msg.role === 'user')
        .map(msg => msg.content)
        .join(". ");

      const finalPayload = { ...formData, gender, symptoms: userSymptoms };

      const aiResponse = await addPatientSymptoms(finalPayload);
      const completePatientData = { ...finalPayload, aiAssessment: aiResponse };
      
      loginPatient(completePatientData);
      navigate('/patient-dashboard');
      toast.success('Triage assessment complete. Entering portal.');
    } catch (error) {
      toast.error(error.message || 'Error connecting to the triage system.');
      setRegistrationStep(1);
    } finally {
      setIsProcessing(false);
    }
  };

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
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-500 p-4 pt-10 pb-10">
      
      <div className={`bg-white dark:bg-gray-800 p-8 md:p-10 rounded-3xl shadow-xl dark:shadow-[0_10px_40px_rgba(0,0,0,0.5)] transition-all duration-500 ease-out border border-gray-100 dark:border-gray-700 w-full relative overflow-hidden z-10 ${registrationStep === 2 && !isReturningUser ? 'max-w-3xl' : 'max-w-xl'}`}>
        
        <div className="absolute top-0 left-0 w-full h-2 bg-linear-to-r from-clinical-500 to-emerald-400"></div>

        {(registrationStep === 1 || isReturningUser) && (
          <>
            <div className="flex justify-center mb-6 animate-fade-in-down">
              <div className="bg-white px-8 py-4 rounded-2xl shadow-sm inline-block border border-gray-100 dark:border-gray-600">
                <img src={logo} alt="Mediflow-AI Logo" className="h-16 md:h-24 w-auto object-contain" />
              </div>
            </div>

            <div className="flex bg-gray-100 dark:bg-gray-900/50 p-1 rounded-xl mb-8 animate-fade-in-down">
              <button onClick={() => setIsReturningUser(false)} className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${!isReturningUser ? 'bg-white dark:bg-gray-700 shadow-sm text-clinical-600 dark:text-clinical-400' : 'text-gray-400'}`}>
                New Registration
              </button>
              <button onClick={() => setIsReturningUser(true)} className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${isReturningUser ? 'bg-white dark:bg-gray-700 shadow-sm text-clinical-600 dark:text-clinical-400' : 'text-gray-400'}`}>
                Check My Status
              </button>
            </div>
          </>
        )}

        {isReturningUser ? (
          <form onSubmit={handleRetrieveStatus} className="space-y-6 animate-fade-in-right">
            <div className="text-center mb-4">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">Welcome Back</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Enter your registered phone to restore your session.</p>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Registered Phone Number</label>
              <input type="tel" required value={returnPhone} onChange={(e) => setReturnPhone(e.target.value)} className="w-full px-4 py-4 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-clinical-500 text-gray-800 dark:text-white transition-colors" placeholder="e.g. 9876543210" />
            </div>
            <button type="submit" disabled={isProcessing} className="w-full bg-clinical-600 hover:bg-clinical-500 text-white font-bold py-4 rounded-xl shadow-lg transition-all flex justify-center items-center gap-2">
              {isProcessing ? 'Verifying...' : 'Restore My Dashboard'}
            </button>
          </form>
        ) : (
          registrationStep === 1 ? (
            <form onSubmit={handleProceedToChat} className="space-y-5 animate-fade-in-left">
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Preferred Language / पसंदीदा भाषा</label>
                <select name="language" value={formData.language} onChange={handleInputChange} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-clinical-500 text-gray-800 dark:text-white transition-colors outline-none cursor-pointer">
                  <option value="English">English</option>
                  <option value="Hindi">Hindi (हिंदी)</option>
                  <option value="Marathi">Marathi (मराठी)</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Full Name</label>
                  <input type="text" name="name" value={formData.name} onChange={handleInputChange} required className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-clinical-500 text-gray-800 dark:text-white transition-colors" placeholder="John Doe" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Phone Number</label>
                  <div className="flex gap-2">
                    <select name="countryCode" value={formData.countryCode} onChange={handleInputChange} className="w-1/3 px-2 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-clinical-500 text-gray-800 dark:text-white transition-colors outline-none cursor-pointer">
                      <option value="+91">+91 (IN)</option>
                      <option value="+1">+1 (US)</option>
                    </select>
                    <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} required className="w-2/3 px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-clinical-500 text-gray-800 dark:text-white transition-colors" placeholder="9876543210" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Age</label>
                  <input type="number" name="age" min="0" value={formData.age} onChange={handleInputChange} required className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-clinical-500 text-gray-800 dark:text-white transition-colors" placeholder="25" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Gender</label>
                  <select value={gender} onChange={(e) => setGender(e.target.value)} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-clinical-500 text-gray-800 dark:text-white transition-colors outline-none cursor-pointer">
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="flex gap-3 md:col-span-2">
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
              <div className="mt-8">
                <button type="submit" className="w-full font-bold py-4 px-4 rounded-xl shadow-lg transform transition-all duration-300 flex justify-center items-center gap-3 bg-clinical-600 hover:bg-clinical-500 text-white hover:shadow-clinical-500/30 hover:-translate-y-1">
                  Start AI Chat Triage 💬
                </button>
              </div>
            </form>
          ) : (
            <div className="animate-fade-in-right relative">
              {isProcessing && (
                <div className="absolute inset-0 bg-white/80 dark:bg-gray-800/80 z-10 flex flex-col items-center justify-center rounded-3xl backdrop-blur-sm">
                   <svg className="animate-spin h-10 w-10 text-clinical-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                   </svg>
                   <h3 className="text-xl font-bold text-gray-800 dark:text-white">Analyzing Symptoms...</h3>
                   <p className="text-sm text-gray-500">Calculating risk priority and updating database.</p>
                </div>
              )}
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">Triage Assessment</h2>
                <button onClick={() => setRegistrationStep(1)} className="text-xs font-bold text-gray-400 hover:text-clinical-500 uppercase">← Back</button>
              </div>
              <AITriageChat formData={formData} gender={gender} language={formData.language} onComplete={handleChatComplete} />
            </div>
          )
        )}

        {(registrationStep === 1 || isReturningUser) && (
          <div className="mt-8 border-t border-gray-100 dark:border-gray-700/50 pt-6 text-center animate-fade-in-up">
            {!showDoctorLogin ? (
              <button onClick={() => setShowDoctorLogin(true)} className="text-xs font-bold text-gray-400 hover:text-clinical-500 dark:hover:text-clinical-400 transition-colors tracking-widest uppercase">
                Authorized Personnel Entry
              </button>
            ) : (
              <form onSubmit={handleDoctorSubmit} className="flex flex-col items-center gap-3">
                <input type="password" value={doctorPassword} onChange={(e) => setDoctorPassword(e.target.value)} placeholder="Enter Access Code" autoFocus className="px-4 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-clinical-500 text-gray-800 dark:text-white transition-colors text-sm w-full max-w-62 text-center tracking-widest" />
                <div className="flex gap-2 w-full max-w-62.5">
                  <button type="button" onClick={() => setShowDoctorLogin(false)} className="flex-1 py-2 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-lg text-xs font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors uppercase tracking-wider">Cancel</button>
                  <button type="submit" className="flex-1 py-2 bg-gray-800 dark:bg-gray-700 text-white rounded-lg text-xs font-bold hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors shadow-md uppercase tracking-wider">Access</button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>

      {/* --- NEW HACKATHON DEMO LINK SECTION --- */}
      <div className="mt-8 text-center max-w-md animate-fade-in-up">
        <button 
          onClick={() => window.open('/admin', '_blank')}
          className="bg-transparent border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-500 px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all mb-3"
        >
          Launch District Admin View
        </button>
        <p className="text-xs text-gray-400 dark:text-gray-500 italic px-4">
          * Note: Provided for demo purposes only. This module will be separated into a secure intranet portal post-deployment.
        </p>
      </div>

    </div>
  );
};

export default PatientLogin;