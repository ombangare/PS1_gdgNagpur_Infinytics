import React, { useState } from 'react';

const SymptomInput = ({ onRunAssessment }) => {
  const [input, setInput] = useState('');

  const handleSubmit = () => {
    const symptomsArray = input.split(',').map(s => s.trim()).filter(s => s !== '');
    onRunAssessment(symptomsArray);
    setInput('');
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-[0_10px_40px_rgba(20,184,166,0.1)] dark:shadow-[0_10px_40px_rgba(0,0,0,0.4)] hover:shadow-[0_15px_50px_rgba(20,184,166,0.15)] dark:hover:shadow-[0_15px_50px_rgba(0,0,0,0.6)] transition-all duration-500 ease-out border border-clinical-100 dark:border-gray-700 mb-8 relative overflow-hidden group">
      
      {/* Decorative top glow */}
      <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-clinical-400 to-clinical-600"></div>

      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Describe Your Symptoms</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 font-medium">Please separate symptoms with commas (e.g., headache, fever, cough).</p>
      
      <textarea
        className="w-full p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-clinical-500 focus:border-clinical-500 mb-6 resize-none dark:text-white transition-all duration-300"
        rows="4"
        placeholder="Enter symptoms here..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
      ></textarea>
      
      <div className="flex justify-end">
        <button 
          onClick={handleSubmit}
          className="bg-clinical-600 hover:bg-clinical-500 text-white font-bold py-3 px-8 rounded-xl shadow-lg hover:shadow-clinical-500/30 transform hover:-translate-y-1 transition-all duration-300"
        >
          Run AI Assessment
        </button>
      </div>
    </div>
  );
};

export default SymptomInput;