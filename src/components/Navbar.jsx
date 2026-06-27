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
      
      {/* UPGRADED NAVBAR LOGO: Larger height (h-10 to h-14) and w-auto */}
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