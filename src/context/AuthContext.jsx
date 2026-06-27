import React, { createContext, useState } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [patient, setPatient] = useState(() => {
    const storedPatient = localStorage.getItem('patientSession');
    return storedPatient ? JSON.parse(storedPatient) : null;
  });
  
  const [role, setRole] = useState(() => {
    return localStorage.getItem('role') || null;
  });

  const loginPatient = (patientData) => {
    localStorage.setItem('patientSession', JSON.stringify(patientData));
    localStorage.setItem('role', 'patient'); // <-- CRITICAL FIX: Save role to storage!
    setPatient(patientData);
    setRole('patient');
  };

  const loginDoctor = () => {
    localStorage.setItem('role', 'doctor');
    setRole('doctor');
  };

  const logout = () => {
    localStorage.removeItem('patientSession');
    localStorage.removeItem('role');
    setPatient(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ patient, role, loginPatient, loginDoctor, logout, isLoggedIn: !!patient || !!role }}>
      {children}
    </AuthContext.Provider>
  );
};