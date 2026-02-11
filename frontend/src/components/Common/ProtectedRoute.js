// src/components/Common/ProtectedRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ role, children }) => {
  // Read consistent keys that match what we store during login
  const userType = localStorage.getItem('userType');
  const user = localStorage.getItem('user');

  // If no user data at all → redirect to login
  if (!userType || !user) {
    return <Navigate to="/login" replace />;
  }

  // If requested role doesn't match stored userType → redirect to home
  if (role && userType !== role) {
    return <Navigate to="/" replace />;
  }

  // All good → show the protected content
  return children;
};

export default ProtectedRoute;