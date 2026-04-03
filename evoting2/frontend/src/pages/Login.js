import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const [form, setF]      = useState({ email: '', password: '' });
  const [loading, setLoad] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoad(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome, ${user.name}`);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid credentials');
    } finally { setLoad(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-card fade-in">
        <div className="auth-brand">
          <div className="auth-icon">✓</div>
          <div className="auth-name">VoteChain</div>
        </div>
        <div className="auth-title">Sign in</div>
        <div className="auth-sub">Access your secure voting account</div>

        <form onSubmit={submit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" required autoFocus
              value={form.email} onChange={e => setF({ ...form, email: e.target.value })}
              placeholder="you@example.com" />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-input" type="password" required
              value={form.password} onChange={e => setF({ ...form, password: e.target.value })}
              placeholder="••••••••" />
          </div>
          <button className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in →'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: 'var(--text3)' }}>
          No account?{' '}
          <Link to="/register" style={{ color: 'var(--text2)', textDecoration: 'underline' }}>Register</Link>
        </div>

        <div style={{ marginTop: 22, padding: '12px 14px', background: 'var(--bg3)', borderRadius: 8, fontSize: 11, color: 'var(--text3)', border: '1px solid var(--border2)', lineHeight: 1.9 }}>
          <div style={{ color: 'var(--text2)', fontWeight: 600, marginBottom: 4 }}>Demo accounts</div>
          <div>admin@vote.com / admin123</div>
          <div>voter@vote.com / voter123</div>
          <div>candidate@vote.com / cand123</div>
        </div>
      </div>
    </div>
  );
}
