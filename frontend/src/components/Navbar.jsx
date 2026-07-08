import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import ProfileDropdown from './ProfileDropdown';
import logo from '../assets/logo.jpg';

const Navbar = () => {
  const { patient, role, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/patient');
  };

  return (
    <nav className="bg-white dark:bg-gray-800 p-4 shadow-sm flex justify-between items-center transition-colors duration-500 border-b border-gray-200 dark:border-gray-700 z-10 relative">
      
      {/* LOGO */}
      <Link to="/" className="flex items-center">
        <div className="bg-white px-3 py-1.5 rounded-xl shadow-sm hover:shadow-md transition-shadow">
          <img 
            src={logo} 
            alt="Mediflow-AI Logo" 
            className="h-10 md:h-14 w-auto object-contain"
          />
        </div>
      </Link>
      
      <div className="flex items-center gap-6">
        {/* ADMIN COMMAND CENTER BUTTON (Only visible to admin role) */}
        {role === 'admin' && (
          <button 
            onClick={() => window.open('/admin', '_blank')}
            className="bg-clinical-500 text-white px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-clinical-500/20 hover:bg-clinical-600 transition-all active:scale-95"
          >
            Launch Admin Command Center
          </button>
        )}

        {role === 'doctor' && (
          <Link to="/doctor" className="font-bold text-sm uppercase tracking-wider text-gray-600 dark:text-gray-300 hover:text-clinical-600 dark:hover:text-clinical-400 transition-colors">
            Doctor Panel
          </Link>
        )}
        
        {patient && (
          <ProfileDropdown patient={patient} onLogout={handleLogout} />
        )}
      </div>
    </nav>
  );
};

export default Navbar;