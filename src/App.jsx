import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import AppRoutes from './routes/AppRoutes';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';

function App() {
  // Initialize dark mode from localStorage or default to light
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  // Apply dark mode globally to the HTML document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  return (
    <div className="min-h-screen bg-clinical-50 dark:bg-gray-900 transition-colors duration-500 flex flex-col font-sans">
      
      <Navbar />
      
      <main className="grow">
        <AppRoutes />
      </main>

      <ToastContainer position="top-right" autoClose={3000} theme={darkMode ? "dark" : "light"} />
      
      {/* Floating Theme Toggle Button */}
      <button 
        onClick={() => setDarkMode(!darkMode)}
        className="fixed bottom-6 right-6 p-4 rounded-full bg-white dark:bg-gray-700 text-yellow-500 dark:text-yellow-400 shadow-[0_4px_20px_rgba(0,0,0,0.15)] border border-gray-200 dark:border-gray-600 hover:-translate-y-2 transition-transform duration-300 z-50 text-2xl flex items-center justify-center"
      >
        {darkMode ? '☀️' : '🌙'}
      </button>
    </div>
  );
}

export default App;