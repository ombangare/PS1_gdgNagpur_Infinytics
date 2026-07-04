import React, { useState } from 'react';

const ProfileDropdown = ({ patient, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 focus:outline-none p-1 rounded-md hover:bg-gray-100 transition"
      >
        <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
          {patient.name.charAt(0).toUpperCase()}
        </div>
        <span className="font-medium text-gray-700 hidden sm:block">{patient.name}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg py-1 z-50">
          <div className="px-4 py-3 text-sm text-gray-700 border-b border-gray-100">
            <p className="font-bold truncate">{patient.name}</p>
            <p className="text-xs text-gray-500 truncate">{patient.phone}</p>
          </div>
          <button
            onClick={onLogout}
            className="w-full text-left block px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors font-medium"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
};

export default ProfileDropdown;