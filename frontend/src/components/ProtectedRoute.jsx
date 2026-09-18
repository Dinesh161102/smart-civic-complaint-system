import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getStoredToken, getStoredUser, isTokenValid, clearAuth } from '../services/api';

export default function ProtectedRoute({ children, allowedRoles = null }) {
  const token = getStoredToken();
  const user = getStoredUser();
  const location = useLocation();

  // 1. Strict Authentication & Token Expiry Check
  if (!token || !isTokenValid(token) || !user) {
    clearAuth();
    const redirectTo = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirectTo=${redirectTo}`} replace />;
  }

  // 2. Strict Role-Based Access Control (RBAC)
  if (allowedRoles && Array.isArray(allowedRoles) && allowedRoles.length > 0) {
    const userRole = (user?.role || '').trim().toLowerCase();
    const normalizedAllowed = allowedRoles.map((r) => r.trim().toLowerCase());

    const isAuthorized = normalizedAllowed.some((allowed) => {
      if (allowed === userRole) return true;
      if (allowed.includes('officer') && userRole.includes('officer')) return true;
      if (allowed.includes('crew') && userRole.includes('crew')) return true;
      if (allowed.includes('citizen') && userRole.includes('citizen')) return true;
      return false;
    });

    if (!isAuthorized) {
      // Redirect unauthorized user to their respective authorized home route
      if (userRole.includes('officer')) {
        return <Navigate to="/officer" replace />;
      }
      if (userRole.includes('crew')) {
        return <Navigate to="/crew" replace />;
      }
      return <Navigate to="/my-complaints" replace />;
    }
  }

  return children;
}
