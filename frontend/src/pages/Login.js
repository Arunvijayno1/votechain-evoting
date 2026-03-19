import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.name}!`);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">🗳</div>
          <div className="auth-title">VoteChain</div>
          <div className="auth-sub">Secure Blockchain E-Voting</div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" required
              value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
              placeholder="you@example.com" />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-input" type="password" required
              value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••" />
          </div>
          <button className="btn btn-primary" style={{ width: '100%' }} type="submit" disabled={loading}>
            {loading ? 'Authenticating…' : 'Sign In'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: 'var(--text3)' }}>
          No account? <Link to="/register" style={{ color: 'var(--blue)' }}>Register</Link>
        </div>

        {/* Demo credentials hint */}
        <div style={{ marginTop: 20, padding: 12, background: 'var(--bg3)', borderRadius: 8, fontSize: 10, color: 'var(--text3)' }}>
          <b style={{ color: 'var(--text2)' }}>Demo credentials:</b><br />
          Admin: admin@vote.com / admin123<br />
          Voter: voter@vote.com / voter123<br />
          Candidate: candidate@vote.com / cand123
        </div>
      </div>
    </div>
  );
}
