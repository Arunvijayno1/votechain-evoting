import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';

// Pages
import Login          from './pages/Login';
import Register       from './pages/Register';
import Dashboard      from './pages/Dashboard';
import Elections      from './pages/Elections';
import CandidateList  from './pages/CandidateList';
import Vote           from './pages/Vote';
import FaceRegister   from './pages/FaceRegister';
import BlockchainExplorer from './pages/BlockchainExplorer';
import Results        from './pages/Results';
import AdminCandidates from './pages/AdminCandidates';
import MyVotes        from './pages/MyVotes';
import Analytics      from './pages/Analytics';

// Protected route wrapper
const PrivateRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen">Authenticating…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/login"    element={<Login />} />
    <Route path="/register" element={<Register />} />

    <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
      <Route index element={<Navigate to="/dashboard" replace />} />
      <Route path="dashboard"   element={<Dashboard />} />
      <Route path="elections"   element={<Elections />} />
      <Route path="candidates"  element={<CandidateList />} />
      <Route path="results/:id" element={<Results />} />
      <Route path="blockchain"  element={<BlockchainExplorer />} />

      {/* Voter-only */}
      <Route path="vote"        element={<PrivateRoute roles={['voter']}><Vote /></PrivateRoute>} />
      <Route path="my-votes"    element={<PrivateRoute roles={['voter']}><MyVotes /></PrivateRoute>} />
      <Route path="face-register" element={<PrivateRoute roles={['voter']}><FaceRegister /></PrivateRoute>} />

      {/* Admin-only */}
      <Route path="admin/candidates" element={<PrivateRoute roles={['admin']}><AdminCandidates /></PrivateRoute>} />
      <Route path="analytics"        element={<PrivateRoute roles={['admin']}><Analytics /></PrivateRoute>} />
    </Route>

    <Route path="*" element={<Navigate to="/dashboard" replace />} />
  </Routes>
);

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <ToastContainer
          position="bottom-right"
          theme="dark"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
        />
      </BrowserRouter>
    </AuthProvider>
  );
}
