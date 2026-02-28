import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// NOTE: Replace with your actual logo path or URL
const logo = "https://placehold.co/45x45/007bff/ffffff?text=Logo";

const Navbar = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();

  // Close dropdown when route changes
  useEffect(() => {
    setIsDropdownOpen(false);
  }, [location]);

  if (!user) return null;

  const role = user.role;
  const team = user.team;

  // Helpers
  const isAdmin = role === 'Admin';
  const isManager = role === 'Manager';
  const isTeamLead = role === 'Team Lead';
  const isEmployee = !isAdmin && !isManager && !isTeamLead;

  return (
    <header className="navbar">
      <div className="nav-container">
        <div className="logo">
          <img src={logo} alt="Reach Skyline Logo" style={{ borderRadius: '4px', height: '40px', width: 'auto' }} />
          <h2>Reach Skyline</h2>
          <span style={{ fontSize: '12px', marginLeft: '10px', color: '#ccc' }}>({role})</span>
        </div>

        <nav>
          <ul className="nav-links">

            {/* 1. Admin Dashboard (Admin Only) */}
            {isAdmin && (
              <li><Link to="/admin-dashboard">Admin Dashboard</Link></li>
            )}

            {/* 2. Client Request (Admin & Manager) */}
            {(isAdmin || isManager) && (
              <li><Link to="/dashboard">Client Request</Link></li>
            )}

            {/* 2. Efficiency Report (Admin & Manager) */}
            {(isAdmin || isManager) && (
              <li><Link to="/efficiency">Efficiency Report</Link></li>
            )}

            {/* 3. Team Page Dropdown (Admin & Team Lead) */}
            {/* Manager CANNOT see Team Pages */}
            {(isAdmin || isTeamLead) && (
              <li
                className="dropdown"
                onMouseEnter={() => setIsDropdownOpen(true)}
                onMouseLeave={() => setIsDropdownOpen(false)}
              >
                {/* Admin sees generic "Team Page", Team Lead checks strictly */}
                <span className="dropbtn">Team Page ▾</span>

                <ul className={`dropdown-menu ${isDropdownOpen ? 'show' : ''}`}>
                  {/* Branding */}
                  {(isAdmin || (isTeamLead && team === 'Branding')) && (
                    <li><Link to="/branding-team">Branding & Creatives</Link></li>
                  )}

                  {/* Website */}
                  {(isAdmin || (isTeamLead && team === 'Website')) && (
                    <li><Link to="/website-team">Website Team</Link></li>
                  )}

                  {/* SEO */}
                  {(isAdmin || (isTeamLead && team === 'SEO')) && (
                    <li><Link to="/seo-team">SEO Team</Link></li>
                  )}

                  {/* Campaign */}
                  {(isAdmin || (isTeamLead && team === 'Campaign')) && (
                    <li><Link to="/campaign-team">Campaign Team</Link></li>
                  )}

                  {/* Telecaller */}
                  {(isAdmin || (isTeamLead && team === 'Telecaller')) && (
                    <li><Link to="/telecaller-team">TELECALLER TEAM</Link></li>
                  )}
                </ul>
              </li>
            )}

            {/* 4. Team Members (Admin, Manager, Team Lead) */}
            {!isEmployee && (
              <li><Link to="/team-members">Team Members</Link></li>
            )}

            {/* Client Media Page (Admin, Manager, Team Lead) */}
            {(isAdmin || isManager || isTeamLead) && (
              <li><Link to="/client-media">Client Media</Link></li>
            )}

            {/* 5. Client Page (Admin, Manager) */}
            {(isAdmin || isManager) && (
              <li><Link to="/client-page">Client Page</Link></li>
            )}

            {/* 6. Media Production Hub (Admin, Manager) */}
            {(isAdmin || isManager) && (
              <li><Link to="/media-hub">Media Hub</Link></li>
            )}

            {/* Employee Profile Link (For Employees) */}
            {isEmployee && (
              <li><Link to={`/employee-profile/${user.id}`}>My Profile</Link></li>
            )}

            {/* Logout Button */}
            <li>
              <Link
                to="/login"
                className="login-link"
                onClick={logout}
              >
                Logout
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;