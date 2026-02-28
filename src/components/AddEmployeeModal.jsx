import React, { useState, useEffect } from 'react';

const AddEmployeeModal = ({ isOpen, onClose, currentUser, onEmployeeCreated }) => {
    const isTeamLead = currentUser?.role === 'Team Lead';
    const isAdmin = currentUser?.role === 'Admin';
    const initialTeam = isTeamLead ? currentUser.team : '';

    const [formData, setFormData] = useState({
        id: '',
        name: '',
        email: '',
        role: '',
        team: initialTeam,
        password: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const departmentRoles = {
        'Website': ['Frontend Developer', 'Backend Developer', 'UI/UX Designer', 'WordPress Developer', 'Full Stack Developer'],
        'Branding': ['Graphic Designer', 'Video Editor', 'Copywriter', 'Content Creator', 'Social Media Manager'],
        'SEO': ['SEO Analyst', 'Link Builder', 'Content Strategist', 'SEO Specialist'],
        'Telecaller': ['Telecaller', 'Sales Executive', 'Support Agent'],
        'Campaign': ['Campaign Manager', 'Ads Specialist', 'Digital Marketer']
    };

    const teams = ['Branding', 'Website', 'SEO', 'Campaign', 'Telecaller'];
    const availableRoles = departmentRoles[formData.team] || [];

    // Fetch next ID when team changes
    useEffect(() => {
        if (isOpen && formData.team) {
            fetchNextId(formData.team);
        }
    }, [formData.team, isOpen]);

    const fetchNextId = async (teamName) => {
        try {
            const token = localStorage.getItem('access_token');
            const res = await fetch(`/api/employees/next-id?team=${teamName}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setFormData(prev => ({ ...prev, id: data.next_id }));
            }
        } catch (err) {
            console.error("Error fetching next ID:", err);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        // Reset role if team changes
        if (name === 'team') {
            setFormData(prev => ({ ...prev, role: '' }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const token = localStorage.getItem('access_token');
            const res = await fetch('/api/employees', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            const data = await res.json();
            if (res.ok) {
                alert("Employee created successfully!");
                onEmployeeCreated(data.employee);
                onClose();
                setFormData({ id: '', name: '', email: '', role: '', team: initialTeam, password: '' });
            } else {
                setError(data.message || "Failed to create employee");
            }
        } catch (err) {
            setError("Network error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
            <div style={{
                backgroundColor: 'white', padding: '30px', borderRadius: '12px',
                width: '400px', boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
            }}>
                <h2 style={{ marginTop: 0, color: '#007bff' }}>Add New Employee</h2>

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', fontSize: '12px', marginBottom: '5px' }}>Select Team</label>
                        <select
                            name="team" value={formData.team} onChange={handleChange} required
                            disabled={isTeamLead}
                            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', backgroundColor: isTeamLead ? '#f8f9fa' : 'white' }}
                        >
                            <option value="">Select Team</option>
                            {teams.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', fontSize: '12px', marginBottom: '5px' }}>Employee ID (Auto-generated)</label>
                        <input
                            type="text" name="id" value={formData.id} readOnly
                            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', backgroundColor: '#e9ecef', cursor: 'not-allowed' }}
                        />
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', fontSize: '12px', marginBottom: '5px' }}>Full Name</label>
                        <input
                            type="text" name="name" value={formData.name} onChange={handleChange} required
                            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                        />
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', fontSize: '12px', marginBottom: '5px' }}>Email Address</label>
                        <input
                            type="email" name="email" value={formData.email} onChange={handleChange} required
                            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                        />
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', fontSize: '12px', marginBottom: '5px' }}>Role</label>
                        <select
                            name="role" value={formData.role} onChange={handleChange} required
                            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                        >
                            <option value="">Select Role</option>
                            {availableRoles.map(r => <option key={r} value={r}>{r}</option>)}
                            <option value="Employee">General Employee</option>
                        </select>
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', fontSize: '12px', marginBottom: '5px' }}>Initial Password</label>
                        <input
                            type="password" name="password" value={formData.password} onChange={handleChange} required
                            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                        />
                    </div>

                    {error && <p style={{ color: 'red', fontSize: '12px' }}>{error}</p>}

                    <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                        <button
                            type="submit" disabled={loading}
                            style={{
                                flex: 1, padding: '10px', background: '#28a745',
                                color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer'
                            }}
                        >
                            {loading ? 'Creating...' : 'Create Employee'}
                        </button>
                        <button
                            type="button" onClick={onClose}
                            style={{
                                flex: 1, padding: '10px', background: '#6c757d',
                                color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer'
                            }}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddEmployeeModal;
