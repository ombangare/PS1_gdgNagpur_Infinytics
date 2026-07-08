import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import PatientLogin from '../pages/PatientLogin';
import PatientDashboard from '../pages/PatientDashboard';
import DoctorDashboard from '../pages/DoctorDashboard';
import AdminDashboard from '../pages/AdminDashboard'; // 1. NEW IMPORT ADDED HERE
import { useAuth } from '../hooks/useAuth';

const AppRoutes = () => {
  const { isLoggedIn, role } = useAuth();

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/patient" />} />
      <Route path="/patient" element={<PatientLogin />} />
      <Route
        path="/patient-dashboard"
        element={isLoggedIn && role === 'patient' ? <PatientDashboard /> : <Navigate to="/patient" />}
      />
      <Route
        path="/doctor"
        element={isLoggedIn && role === 'doctor' ? <DoctorDashboard /> : <Navigate to="/patient" />}
      />
      
      {/* 2. NEW ADMIN ROUTE ADDED HERE (Must be above the '*' route!) */}
      <Route path="/admin" element={<AdminDashboard />} />

      <Route path="*" element={<Navigate to="/patient" />} />
    </Routes>
  );
};

export default AppRoutes;