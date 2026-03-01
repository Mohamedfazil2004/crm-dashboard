import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// NOTE: Replace with your actual logo path or URL
const logo = "https://placehold.co/45x45/007bff/ffffff?text=Logo";

const Navbar = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileDropdownOpen, setIsMobileDropdownOpen] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();

  // Close menus when route changes
  useEffect(() => {
    setIsDropdownOpen(false);
    setIsMobileMenuOpen(false);
    setIsMobileDropdownOpen(false);
  }, [location]);

  // Close mobile menu on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest('.navbar')) {
        setIsMobileMenuOpen(false);
        setIsMobileDropdownOpen(false);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

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

        {/* Hamburger Button (Mobile Only) */}
        <button
          className="hamburger-btn"
          onClick={(e) => {
            e.stopPropagation();
            setIsMobileMenuOpen(!isMobileMenuOpen);
          }}
          aria-label="Toggle navigation menu"
        >
          <span className={`hamburger-icon ${isMobileMenuOpen ? 'open' : ''}`}>
            <span></span>
            <span></span>
            <span></span>
          </span>
        </button>

        {/* Desktop Nav */}
        <nav className="desktop-nav">
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
            {(isAdmin || isTeamLead) && (
              <li
                className="dropdown"
                onMouseEnter={() => setIsDropdownOpen(true)}
                onMouseLeave={() => setIsDropdownOpen(false)}
              >
                <span className="dropbtn">Team Page ▾</span>

                <ul className={`dropdown-menu ${isDropdownOpen ? 'show' : ''}`}>
                  {(isAdmin || (isTeamLead && team === 'Branding')) && (
                    <li><Link to="/branding-team">Branding & Creatives</Link></li>
                  )}
                  {(isAdmin || (isTeamLead && team === 'Website')) && (
                    <li><Link to="/website-team">Website Team</Link></li>
                  )}
                  {(isAdmin || (isTeamLead && team === 'SEO')) && (
                    <li><Link to="/seo-team">SEO Team</Link></li>
                  )}
                  {(isAdmin || (isTeamLead && team === 'Campaign')) && (
                    <li><Link to="/campaign-team">Campaign Team</Link></li>
                  )}
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

            {/* Client Media Page */}
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

            {/* Employee Profile Link */}
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

        {/* Mobile Nav Overlay */}
        <nav className={`mobile-nav ${isMobileMenuOpen ? 'mobile-nav--open' : ''}`}>
          <ul className="mobile-nav-links">

            {isAdmin && (
              <li><Link to="/admin-dashboard">🏠 Admin Dashboard</Link></li>
            )}

            {(isAdmin || isManager) && (
              <li><Link to="/dashboard">📋 Client Request</Link></li>
            )}

            {(isAdmin || isManager) && (
              <li><Link to="/efficiency">📊 Efficiency Report</Link></li>
            )}

            {(isAdmin || isTeamLead) && (
              <li>
                <button
                  className="mobile-dropdown-toggle"
                  onClick={() => setIsMobileDropdownOpen(!isMobileDropdownOpen)}
                >
                  <span>👥 Team Page</span>
                  <span className={`arrow ${isMobileDropdownOpen ? 'up' : ''}`}>▾</span>
                </button>
                {isMobileDropdownOpen && (
                  <ul className="mobile-sub-menu">
                    {(isAdmin || (isTeamLead && team === 'Branding')) && (
                      <li><Link to="/branding-team">Branding & Creatives</Link></li>
                    )}
                    {(isAdmin || (isTeamLead && team === 'Website')) && (
                      <li><Link to="/website-team">Website Team</Link></li>
                    )}
                    {(isAdmin || (isTeamLead && team === 'SEO')) && (
                      <li><Link to="/seo-team">SEO Team</Link></li>
                    )}
                    {(isAdmin || (isTeamLead && team === 'Campaign')) && (
                      <li><Link to="/campaign-team">Campaign Team</Link></li>
                    )}
                    {(isAdmin || (isTeamLead && team === 'Telecaller')) && (
                      <li><Link to="/telecaller-team">Telecaller Team</Link></li>
                    )}
                  </ul>
                )}
              </li>
            )}

            {!isEmployee && (
              <li><Link to="/team-members">👤 Team Members</Link></li>
            )}

            {(isAdmin || isManager || isTeamLead) && (
              <li><Link to="/client-media">🖼️ Client Media</Link></li>
            )}

            {(isAdmin || isManager) && (
              <li><Link to="/client-page">📁 Client Page</Link></li>
            )}

            {(isAdmin || isManager) && (
              <li><Link to="/media-hub">🎬 Media Hub</Link></li>
            )}

            {isEmployee && (
              <li><Link to={`/employee-profile/${user.id}`}>👤 My Profile</Link></li>
            )}

            <li>
              <Link
                to="/login"
                className="mobile-logout-link"
                onClick={logout}
              >
                🚪 Logout
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;