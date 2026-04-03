import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login          from './pages/Login';
import Register       from './pages/Register';
import Dashboard      from './pages/Dashboard';
import Elections      from './pages/Elections';
import CandidateList  from './pages/CandidateList';
import Vote           from './pages/Vote';
import FaceRegister   from './pages/FaceRegister';
import BlockchainPage from './pages/BlockchainPage';
import Results        from './pages/Results';
import AdminCandidates from './pages/AdminCandidates';
import MyVotes        from './pages/MyVotes';
import Analytics      from './pages/Analytics';

const Guard = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login"    element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={<Guard><Layout /></Guard>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard"   element={<Dashboard />} />
        <Route path="elections"   element={<Elections />} />
        <Route path="candidates"  element={<CandidateList />} />
        <Route path="results/:id" element={<Results />} />
        <Route path="blockchain"  element={<BlockchainPage />} />
        <Route path="vote"         element={<Guard roles={['voter']}><Vote /></Guard>} />
        <Route path="my-votes"     element={<Guard roles={['voter']}><MyVotes /></Guard>} />
        <Route path="face-register" element={<Guard roles={['voter']}><FaceRegister /></Guard>} />
        <Route path="admin/candidates" element={<Guard roles={['admin']}><AdminCandidates /></Guard>} />
        <Route path="analytics"    element={<Guard roles={['admin']}><Analytics /></Guard>} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <ToastContainer position="bottom-right" theme="dark" autoClose={3500} hideProgressBar newestOnTop />
      </BrowserRouter>
    </AuthProvider>
  );
}
