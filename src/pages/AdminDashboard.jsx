import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        totalClients: 0,
        totalTasks: 0,
        activeEmployees: 0,
        teamStats: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAdminStats = async () => {
            try {
                const token = localStorage.getItem('access_token');

                // Fetch clients
                const clientRes = await fetch('/api/clients', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const clients = await clientRes.json();

                // Fetch employees
                const empRes = await fetch('/api/employees', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const employees = await empRes.json();

                // Fetch tasks (we'll need an endpoint for this or aggregate from teams)
                // For now, let's use a placeholder or check if /api/tasks exists
                const taskRes = await fetch('/api/employees', { // Placeholder, we should really have an admin tasks endpoint
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                const teams = ['Branding', 'Website', 'SEO', 'Campaign', 'Telecaller'];
                const teamCounts = teams.map(t => ({
                    name: t,
                    count: employees.filter(e => e.team === t).length
                }));

                setStats({
                    totalClients: clients.length,
                    totalTasks: 0, // Placeholder
                    activeEmployees: employees.length,
                    teamStats: teamCounts
                });
            } catch (err) {
                console.error("Error fetching admin stats:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchAdminStats();
    }, []);

    if (loading) return <div className="container">Loading Dashboard...</div>;

    return (
        <div className="container">
            <h1 style={{ color: '#007bff', marginBottom: '30px' }}>Admin Control Center</h1>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '40px' }}>
                <StatCard title="Total Clients" value={stats.totalClients} color="#007bff" link="/client-page" />
                <StatCard title="Total Employees" value={stats.activeEmployees} color="#28a745" link="/team-members" />
                <StatCard title="Overall Efficiency" value="84%" color="#ffc107" link="/efficiency" />
            </div>

            <h2 style={{ marginBottom: '20px' }}>Team Distribution</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                {stats.teamStats.map(team => (
                    <div key={team.name} style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                        <h3 style={{ margin: '0 0 10px 0' }}>{team.name} Team</h3>
                        <p style={{ fontSize: '14px', color: '#666' }}>Members: <strong>{team.count}</strong></p>
                        <Link to={`/${team.name.toLowerCase()}-team`} style={{ color: '#007bff', textDecoration: 'none', fontSize: '13px', fontWeight: 'bold' }}>
                            View Team Dashboard →
                        </Link>
                    </div>
                ))}
            </div>
        </div>
    );
};

const StatCard = ({ title, value, color, link }) => (
    <Link to={link} style={{ textDecoration: 'none', color: 'inherit' }}>
        <div style={{ background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', borderTop: `5px solid ${color}` }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#999', textTransform: 'uppercase', fontSize: '12px' }}>{title}</h4>
            <span style={{ fontSize: '32px', fontWeight: 'bold' }}>{value}</span>
        </div>
    </Link>
);

export default AdminDashboard;
