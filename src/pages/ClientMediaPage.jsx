import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const ClientMediaPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchClients();
    }, []);

    const fetchClients = async () => {
        try {
            const token = localStorage.getItem('access_token');
            const res = await fetch('/api/clients?all=true', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setClients(data);
            }
        } catch (err) {
            console.error("Error fetching clients:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleViewPreview = (client) => {
        // Navigate to the detail page for this client
        navigate(`/client-media/${encodeURIComponent(client.clientName)}`);
    };

    return (
        <div className="container" style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
            <h1 style={{ color: '#2c3e50', marginBottom: '30px' }}>Client Media Overview</h1>

            <div className="card" style={{ padding: '0', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ background: '#f8f9fa' }}>
                        <tr>
                            <th style={{ padding: '15px', borderBottom: '2px solid #eee', color: '#666' }}>Client ID</th>
                            <th style={{ padding: '15px', borderBottom: '2px solid #eee', color: '#666' }}>Client Name</th>
                            <th style={{ padding: '15px', borderBottom: '2px solid #eee', color: '#666' }}>Media</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="3" style={{ padding: '20px', textAlign: 'center' }}>Loading clients...</td></tr>
                        ) : clients.length === 0 ? (
                            <tr><td colSpan="3" style={{ padding: '20px', textAlign: 'center' }}>No clients found.</td></tr>
                        ) : (
                            clients.map(client => (
                                <tr key={client.id} style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={{ padding: '15px' }}>{client.clientID}</td>
                                    <td style={{ padding: '15px', fontWeight: 'bold' }}>{client.clientName}</td>
                                    <td style={{ padding: '15px' }}>
                                        <button
                                            onClick={() => handleViewPreview(client)}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                cursor: 'pointer',
                                                fontSize: '14px',
                                                fontWeight: 'bold',
                                                color: '#666',
                                                transition: 'color 0.2s',
                                                textDecoration: 'underline'
                                            }}
                                            onMouseEnter={(e) => e.target.style.color = '#007bff'}
                                            onMouseLeave={(e) => e.target.style.color = '#666'}
                                        >
                                            View Preview
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ClientMediaPage;
