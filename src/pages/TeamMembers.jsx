import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AddEmployeeModal from '../components/AddEmployeeModal';

const TeamMembers = () => {
  const { user } = useAuth();
  const [allEmployees, setAllEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const res = await fetch('/api/employees', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          setAllEmployees(data);
        }
      } catch (err) {
        console.error("Error fetching employees:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchEmployees();
  }, []);

  if (!user || loading) return <div className="container">Loading directory...</div>;

  const role = user.role;
  const team = user.team;
  const showAll = role === 'Admin' || role === 'Manager';

  const teams = [
    { title: 'Branding & Creatives Team', key: 'Branding' },
    { title: 'Telecaller Team', key: 'Telecaller' },
    { title: 'Website Team', key: 'Website' },
    { title: 'SEO Team', key: 'SEO' },
    { title: 'Campaign Team', key: 'Campaign' }
  ];

  const isTeamLead = role === 'Team Lead';

  const refreshEmployees = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch('/api/employees', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setAllEmployees(data);
      }
    } catch (err) {
      console.error("Error refreshing employees:", err);
    }
  };


  const isAuthorizedCreator = role === 'Team Lead' || role === 'Admin';

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 style={{ color: '#007bff', margin: 0 }}>Team Members Directory</h1>
        {isAuthorizedCreator && (
          <button
            onClick={() => setIsModalOpen(true)}
            style={{
              padding: '10px 20px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            ➕ Add Member
          </button>
        )}
      </div>

      {teams.map(t => {
        const isAuthorized = showAll || (role === 'Team Lead' && team === t.key);
        if (!isAuthorized) return null;

        // Use all available members in the team, including Team Leads
        const members = allEmployees.filter(emp => emp.team === t.key);
        if (members.length === 0) return null;

        return (
          <div className="team-section" key={t.key} style={{ marginBottom: '40px' }}>
            <h2 style={{ color: '#2c3e50', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>{t.title}</h2>
            <TeamTable members={members} />
          </div>
        );
      })}

      <AddEmployeeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        currentUser={user}
        onEmployeeCreated={(newEmp) => {
          console.log("New employee created:", newEmp);
          refreshEmployees();
        }}
      />
    </div>
  );
};

// Reusable Table Component
const TeamTable = ({ members }) => (
  <table className="employee-table" style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
    <thead>
      <tr style={{ textAlign: 'center', backgroundColor: '#f8f9fa' }}>
        <th style={{ padding: '12px' }}>ID</th>
        <th style={{ padding: '12px' }}>Name</th>
        <th style={{ padding: '12px' }}>Role</th>
        <th style={{ padding: '12px' }}>Email</th>
      </tr>
    </thead>
    <tbody>
      {members.map(m => (
        <tr key={m.id} style={{ borderBottom: '1px solid #eee' }}>
          <td style={{ padding: '12px', textAlign: 'center' }}>
            <Link to={`/employee-profile/${m.id}`} style={{ color: '#007bff' }}>{m.id}</Link>
          </td>
          <td style={{ padding: '12px', textAlign: 'center' }}>{m.name}</td>
          <td style={{ padding: '12px', textAlign: 'center' }}>{m.role}</td>
          <td style={{ padding: '12px', textAlign: 'center' }}>{m.email}</td>
        </tr>
      ))}
    </tbody>
  </table>
);

export default TeamMembers;