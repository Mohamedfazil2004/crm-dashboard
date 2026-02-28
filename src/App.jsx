import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ChatProvider } from './context/ChatContext';

// COMPONENTS
import Navbar from './components/Navbar';

// PAGES
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import WebsiteTeam from './pages/WebsiteTeam';
import BrandingTeam from './pages/BrandingTeam';
import SeoTeam from './pages/SeoTeam';
import CampaignTeam from './pages/CampaignTeam';
import TelecallerTeam from './pages/TelecallerTeam';
import Efficiency from './pages/Efficiency';
import TeamMembers from './pages/TeamMembers';
import ClientPage from './pages/ClientPage';
import ClientDetail from './pages/ClientDetail';
import Login from './pages/Login';
import EmployeeProfile from './pages/EmployeeProfile';
import Unauthorized from './pages/Unauthorized';
import MediaDashboard from './pages/MediaDashboard';
import ClientMediaPage from './pages/ClientMediaPage';
import ClientMediaDetail from './pages/ClientMediaDetail';

// --- 1. LAYOUT COMPONENT ---
const Layout = ({ children }) => {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';
  return (
    <>
      {!isLoginPage && <Navbar />}
      <div className="main-content">
        {children}
      </div>
    </>
  );
};

// --- 2. PROTECTED ROUTE COMPONENT ---
const ProtectedRoute = ({ children, allowedRoles, requiredTeam }) => {
  const { user, token } = useAuth();
  const location = useLocation();

  if (!user || !token) {
    return <Navigate to="/login" replace />;
  }

  // Determine user's home / authorized landing page
  const getUserHome = () => {
    if (user.role === 'Admin') return '/admin-dashboard';
    if (user.role === 'Manager') return '/dashboard';
    if (user.role === 'Team Lead') {
      const teamRoutes = {
        'Branding': '/branding-team',
        'Website': '/website-team',
        'SEO': '/seo-team',
        'Campaign': '/campaign-team',
        'Telecaller': '/telecaller-team'
      };
      return teamRoutes[user.team] || '/login';
    }
    // Default to employee profile for any other role (Video Editor, etc.)
    return `/employee-profile/${user.id}`;
  };

  const userHome = getUserHome();

  // 1. Employee restriction: Can ONLY see their own profile
  const isManagement = ['Admin', 'Manager', 'Team Lead'].includes(user.role);
  if (!isManagement) {
    const isViewingOwnProfile = location.pathname === `/employee-profile/${user.id}`;
    if (!isViewingOwnProfile) {
      return <Navigate to={`/employee-profile/${user.id}`} replace />;
    }
  }

  // 2. Role Check for management paths
  if (allowedRoles) {
    const hasAccess = allowedRoles.includes(user.role) || (allowedRoles.includes('Employee') && !isManagement);
    if (!hasAccess) {
      return <Navigate to={userHome} replace />;
    }
  }

  // 3. Team Check for Team Leads (Strict enforcement)
  if (user.role === 'Team Lead' && requiredTeam && user.team !== requiredTeam) {
    return <Navigate to={userHome} replace />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <ChatProvider>
        <Router>
          <Layout>
            <Routes>

              {/* Public Route */}
              <Route path="/login" element={<Login />} />

              {/* --- DASHBOARD / CLIENT REQUEST (Admin, Manager) --- */}
              <Route path="/" element={
                <ProtectedRoute allowedRoles={['Admin', 'Manager']}><Navigate to="/dashboard" /></ProtectedRoute>
              } />
              <Route path="/dashboard" element={
                <ProtectedRoute allowedRoles={['Manager', 'Admin']}><Dashboard /></ProtectedRoute>
              } />
              <Route path="/admin-dashboard" element={
                <ProtectedRoute allowedRoles={['Admin']}><AdminDashboard /></ProtectedRoute>
              } />

              {/* --- EFFICIENCY & CLIENT PAGE (Admin, Manager) --- */}
              <Route path="/efficiency" element={
                <ProtectedRoute allowedRoles={['Admin', 'Manager']}><Efficiency /></ProtectedRoute>
              } />
              <Route path="/client-page" element={
                <ProtectedRoute allowedRoles={['Admin', 'Manager']}><ClientPage /></ProtectedRoute>
              } />
              <Route path="/clients/:slug" element={
                <ProtectedRoute allowedRoles={['Admin', 'Manager']}><ClientDetail /></ProtectedRoute>
              } />

              {/* --- TEAM MEMBERS (Admin, Manager, Team Lead) --- */}
              <Route path="/team-members" element={
                <ProtectedRoute allowedRoles={['Admin', 'Manager', 'Team Lead']}><TeamMembers /></ProtectedRoute>
              } />

              {/* --- TEAM DASHBOARDS (Admin, Specific Team Lead) --- */}
              <Route path="/branding-team" element={
                <ProtectedRoute allowedRoles={['Admin', 'Team Lead']} requiredTeam="Branding"><BrandingTeam /></ProtectedRoute>
              } />
              <Route path="/website-team" element={
                <ProtectedRoute allowedRoles={['Admin', 'Team Lead']} requiredTeam="Website"><WebsiteTeam /></ProtectedRoute>
              } />
              <Route path="/seo-team" element={
                <ProtectedRoute allowedRoles={['Admin', 'Team Lead']} requiredTeam="SEO"><SeoTeam /></ProtectedRoute>
              } />
              <Route path="/campaign-team" element={
                <ProtectedRoute allowedRoles={['Admin', 'Team Lead']} requiredTeam="Campaign"><CampaignTeam /></ProtectedRoute>
              } />
              <Route path="/telecaller-team" element={
                <ProtectedRoute allowedRoles={['Admin', 'Team Lead']} requiredTeam="Telecaller"><TelecallerTeam /></ProtectedRoute>
              } />

              {/* --- MEDIA PRODUCTION HUB (Admin, Manager, Team Lead) --- */}
              <Route path="/media-hub" element={
                <ProtectedRoute allowedRoles={['Admin', 'Manager']}><MediaDashboard /></ProtectedRoute>
              } />

              {/* --- CLIENT MEDIA PAGE (Team Lead, Admin, Manager) --- */}
              <Route path="/client-media" element={
                <ProtectedRoute allowedRoles={['Admin', 'Manager', 'Team Lead']}><ClientMediaPage /></ProtectedRoute>
              } />
              <Route path="/client-media/:clientName" element={
                <ProtectedRoute allowedRoles={['Admin', 'Manager', 'Team Lead']}><ClientMediaDetail /></ProtectedRoute>
              } />

              {/* --- EMPLOYEE PROFILE (All Authenticated) --- */}
              <Route path="/employee-profile/:id" element={
                <ProtectedRoute allowedRoles={['Admin', 'Manager', 'Team Lead', 'Employee']}><EmployeeProfile /></ProtectedRoute>
              } />

              {/* --- UNAUTHORIZED / ACCESS DENIED --- */}
              <Route path="/unauthorized" element={<Unauthorized />} />

              {/* --- FALLBACK --- */}
              <Route path="*" element={<Navigate to="/login" replace />} />

            </Routes>
          </Layout>
        </Router>
      </ChatProvider>
    </AuthProvider>
  );
}

export default App;