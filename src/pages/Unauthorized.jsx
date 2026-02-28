import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Unauthorized = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    const handleGoHome = () => {
        if (!user) {
            navigate('/login');
        } else if (user.role === 'Admin' || user.role === 'Manager') {
            navigate('/dashboard');
        } else if (user.role === 'Team Lead') {
            const teamRoutes = {
                'Branding': '/branding-team',
                'Website': '/website-team',
                'SEO': '/seo-team',
                'Campaign': '/campaign-team',
                'Telecaller': '/telecaller-team'
            };
            navigate(teamRoutes[user.team] || '/dashboard');
        } else {
            navigate(`/employee-profile/${user.id}`);
        }
    };

    return (
        <div className="container" style={{
            textAlign: 'center',
            padding: '80px 20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '20px'
        }}>
            <div style={{ fontSize: '72px', marginBottom: '10px' }}>🔐</div>
            <h1 style={{ color: '#dc3545', margin: 0 }}>Access Denied</h1>
            <p style={{ color: '#666', fontSize: '18px', maxWidth: '500px' }}>
                Sorry, you do not have permission to access this page. Please contact your administrator if you believe this is an error.
            </p>
            <button
                onClick={handleGoHome}
                style={{
                    marginTop: '20px',
                    padding: '12px 30px',
                    backgroundColor: '#007bff',
                    fontSize: '16px'
                }}
            >
                Go to My Dashboard
            </button>
        </div>
    );
};

export default Unauthorized;
