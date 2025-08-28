import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const PublicRoute = ({ children }) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (token) {
    return <Navigate to="/" replace />;
  }
  return children ? children : <Outlet />;
};

export default PublicRoute;
