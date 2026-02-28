import React, { useState, useEffect } from 'react';

const Efficiency = () => {
  const [teamData, setTeamData] = useState([]);

  useEffect(() => {
    const teams = [
      { name: 'Branding Team', key: 'brandingTasks', type: 'creative' },
      { name: 'Website Team', key: 'websiteTasks', type: 'creative' },
      { name: 'SEO Team', key: 'seoTasks', type: 'creative' },
      { name: 'Campaign Team', key: 'campaignTasks', type: 'creative' },
      { name: 'Telecaller Team', key: 'telecallerTasks', type: 'calling' }
    ];

    const calculatedData = teams.map(team => {
      const tasks = JSON.parse(localStorage.getItem(team.key)) || [];
      const totalTasks = tasks.length;
      let efficiency = 0;
      let completedCount = 0;

      if (team.type === 'creative') {
        // --- CREATIVE TEAM LOGIC (Time Based) ---
        
        // 1. Total Minutes Assigned (Sum of ALL tasks, pending or done)
        const totalAssignedMinutes = tasks.reduce((sum, t) => {
          const taskMin = t.minutes ? Object.values(t.minutes).reduce((a, b) => a + parseInt(b||0), 0) : 0;
          return sum + taskMin;
        }, 0);

        // 2. Total Minutes Completed (Sum of minutes ONLY for Completed tasks)
        const completedMinutes = tasks
          .filter(t => t.status === 'Completed')
          .reduce((sum, t) => {
            const taskMin = t.minutes ? Object.values(t.minutes).reduce((a, b) => a + parseInt(b||0), 0) : 0;
            return sum + taskMin;
          }, 0);

        // 3. Calculate Efficiency: (Completed / Assigned) * 100
        if (totalAssignedMinutes > 0) {
          efficiency = Math.round((completedMinutes / totalAssignedMinutes) * 100);
        } else {
          // Fallback: If no minutes are entered, use Task Count
          completedCount = tasks.filter(t => t.status === 'Completed').length;
          efficiency = totalTasks === 0 ? 0 : Math.round((completedCount / totalTasks) * 100);
        }
        
        completedCount = tasks.filter(t => t.status === 'Completed').length;

      } else {
        // --- TELECALLER TEAM LOGIC (Call Volume Based) ---
        
        const totalCalls = tasks.reduce((sum, t) => sum + (parseInt(t.count?.Calls || 0)), 0);

        const completedCalls = tasks
          .filter(t => t.status === 'Call Completed' || t.status === 'Completed')
          .reduce((sum, t) => sum + (parseInt(t.count?.Calls || 0)), 0);

        efficiency = totalCalls === 0 ? 0 : Math.round((completedCalls / totalCalls) * 100);
        completedCount = tasks.filter(t => t.status === 'Call Completed' || t.status === 'Completed').length;
      }

      return {
        department: team.name,
        total: totalTasks,
        completed: completedCount,
        efficiency: efficiency
      };
    });

    setTeamData(calculatedData);
  }, []);

  // Helper for Color Coding
  const getColor = (score) => {
    if (score >= 90) return '#28a745'; // Excellent (Green)
    if (score >= 50) return '#ffc107'; // Good (Yellow)
    return '#dc3545'; // Needs Improvement (Red)
  };

  return (
    <div className="container">
      <h1 style={{ textAlign: 'center', color: '#007bff', marginBottom: '30px' }}>
        Team Efficiency Report
      </h1>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Department</th>
              <th>Total Tasks</th>
              <th>Completed Tasks</th>
              <th>Efficiency Score</th>
              <th>Performance Bar</th>
            </tr>
          </thead>
          <tbody>
            {teamData.map((team, index) => (
              <tr key={index}>
                <td style={{ fontWeight: 'bold', color: '#555' }}>{team.department}</td>
                
                <td>{team.total}</td>
                <td>{team.completed}</td>
                
                <td style={{ fontWeight: 'bold', fontSize: '16px', color: getColor(team.efficiency) }}>
                  {team.efficiency}%
                </td>
                
                <td style={{ width: '40%', verticalAlign: 'middle' }}>
                  <div style={{ 
                    backgroundColor: '#e9ecef', 
                    height: '12px', 
                    borderRadius: '6px', 
                    overflow: 'hidden',
                    width: '100%',
                    boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.1)'
                  }}>
                    <div style={{ 
                      width: `${Math.min(team.efficiency, 100)}%`, 
                      height: '100%', 
                      backgroundColor: getColor(team.efficiency),
                      transition: 'width 0.8s ease-in-out',
                      borderRadius: '6px'
                    }}></div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Efficiency;