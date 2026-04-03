import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate     = useNavigate();
  const [form, setF]      = useState({ name: '', email: '', password: '', confirm: '', role: 'voter' });
  const [loading, setLoad] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) return toast.error('Passwords do not match');
    if (form.password.length < 6)      return toast.error('Password must be at least 6 characters');
    setLoad(true);
    try {
      await register({ name: form.name, email: form.email, password: form.password, role: form.role });
      toast.success('Account created');
      navigate(form.role === 'voter' ? '/face-register' : '/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally { setLoad(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-card fade-in">
        <div className="auth-brand">
          <div className="auth-icon">✓</div>
          <div className="auth-name">VoteChain</div>
        </div>
        <div className="auth-title">Create account</div>
        <div className="auth-sub">Join the platform</div>

        <form onSubmit={submit}>
          <div className="form-group">
            <label className="form-label">Full name</label>
            <input className="form-input" required value={form.name}
              onChange={e => setF({ ...form, name: e.target.value })} placeholder="Your name" />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" required value={form.email}
              onChange={e => setF({ ...form, email: e.target.value })} placeholder="you@example.com" />
          </div>
          <div className="grid-2" style={{ gap: 10 }}>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="form-input" type="password" required minLength={6} value={form.password}
                onChange={e => setF({ ...form, password: e.target.value })} placeholder="Min 6 chars" />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm</label>
              <input className="form-input" type="password" required value={form.confirm}
                onChange={e => setF({ ...form, confirm: e.target.value })} placeholder="Repeat" />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Role</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {['voter', 'candidate'].map(r => (
                <button type="button" key={r} onClick={() => setF({ ...form, role: r })}
                  style={{ flex: 1, padding: '10px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: form.role === r ? 600 : 400,
                    border: `1px solid ${form.role === r ? 'var(--border3)' : 'var(--border2)'}`,
                    background: form.role === r ? 'var(--bg4)' : 'var(--bg3)',
                    color: form.role === r ? 'var(--white)' : 'var(--text2)', transition: 'all .1s' }}>
                  {r === 'voter' ? '🗳 Voter' : '👤 Candidate'}
                </button>
              ))}
            </div>
          </div>
          <button className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Creating…' : 'Create account →'}
          </button>
        </form>

        {form.role === 'voter' && (
          <div style={{ marginTop: 14, padding: '10px 12px', background: 'var(--bg3)', borderRadius: 8, fontSize: 11, color: 'var(--text3)', border: '1px solid var(--border2)' }}>
            After registration you'll be taken to face setup. This is required before voting.
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: 18, fontSize: 12, color: 'var(--text3)' }}>
          Have an account?{' '}
          <Link to="/login" style={{ color: 'var(--text2)', textDecoration: 'underline' }}>Sign in</Link>
        </div>
      </div>
    </div>
  );
}
