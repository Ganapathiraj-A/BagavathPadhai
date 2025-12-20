import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';

const ProtectedRoute = ({ children }) => {
    const { isAdmin, loading } = useAdminAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                backgroundColor: '#ffffff'
            }}>
                <div className="spinner">Verifying access...</div>
            </div>
        );
    }

    if (!isAdmin) {
        // Redirect to admin-login, saving the current location for post-login redirect
        return <Navigate to="/admin-login" state={{ from: location }} replace />;
    }

    return children;
};

export default ProtectedRoute;
