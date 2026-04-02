import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const [form, setForm]       = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome, ${user.name}`);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid credentials');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-card fade-in">
        <div className="auth-logo">
          <div className="auth-icon">⊡</div>
          <div className="auth-title">VOTECHAIN</div>
          <div className="auth-sub">Secure Blockchain E-Voting Platform</div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input className="form-input" type="email" required autoFocus
              value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
              placeholder="your@email.com" />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-input" type="password" required
              value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••" />
          </div>
          <button className="btn btn-gold btn-lg" style={{ width: '100%', marginTop: 4 }} type="submit" disabled={loading}>
            {loading ? 'Authenticating…' : 'Sign In →'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 22, fontSize: 12, color: 'var(--text3)' }}>
          New voter?{' '}
          <Link to="/register" style={{ color: 'var(--gold)', textDecoration: 'none', fontWeight: 600 }}>
            Register Account
          </Link>
        </div>

        <div style={{ marginTop: 24, padding: 14, background: 'var(--bg3)', borderRadius: 8, fontSize: 11, color: 'var(--text3)', border: '1px solid var(--border)' }}>
          <div style={{ color: 'var(--gold-dim)', fontWeight: 600, marginBottom: 6 }}>Demo Credentials</div>
          <div>Admin: admin@vote.com / admin123</div>
          <div>Voter: voter@vote.com / voter123</div>
        </div>
      </div>
    </div>
  );
}
