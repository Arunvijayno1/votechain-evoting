import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { getCandidates, getElections, applyAsCandidate } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function CandidateList() {
  const { user }  = useAuth();
  const [candidates, setCandidates] = useState([]);
  const [elections,  setElections]  = useState([]);
  const [showForm,   setShowForm]   = useState(false);
  const [form, setForm] = useState({ electionId: '', party: '', symbol: '🌟', statement: '' });

  useEffect(() => {
    getCandidates().then(r => setCandidates(r.data.candidates || [])).catch(() => toast.error('Failed to load candidates'));
    getElections().then(r => setElections(r.data.elections?.filter(e => e.status === 'active') || []));
  }, []);

  const handleApply = async (e) => {
    e.preventDefault();
    try {
      await applyAsCandidate(form);
      toast.success('Application submitted — awaiting admin approval');
      setShowForm(false);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to apply'); }
  };

  const statusColor = { approved: 'badge-green', pending: 'badge-amber', rejected: 'badge-red' };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700 }}>Candidates</h2>
        {user.role === 'candidate' && (
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>Apply for Election</button>
        )}
      </div>

      {showForm && user.role === 'candidate' && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-title" style={{ marginBottom: 14 }}>📝 Apply as Candidate</div>
          <form onSubmit={handleApply}>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Election</label>
                <select className="form-input" required value={form.electionId}
                  onChange={e => setForm({ ...form, electionId: e.target.value })}>
                  <option value="">— Select election —</option>
                  {elections.map(e => <option key={e._id} value={e._id}>{e.title}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Party Name</label>
                <input className="form-input" required value={form.party}
                  onChange={e => setForm({ ...form, party: e.target.value })} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Party Symbol (emoji)</label>
              <input className="form-input" value={form.symbol}
                onChange={e => setForm({ ...form, symbol: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Campaign Statement (max 500 chars)</label>
              <textarea className="form-input" rows={3} maxLength={500} value={form.statement}
                onChange={e => setForm({ ...form, statement: e.target.value })} />
            </div>
            <button className="btn btn-primary btn-sm" type="submit">Submit Application</button>
            <button className="btn btn-sm" style={{ marginLeft: 8 }} type="button" onClick={() => setShowForm(false)}>Cancel</button>
          </form>
        </div>
      )}

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Name</th><th>Party</th><th>Election</th><th>Status</th></tr></thead>
            <tbody>
              {candidates.map(c => (
                <tr key={c._id}>
                  <td><b>{c.userId?.name}</b><br /><span style={{ fontSize: 10, color: 'var(--text3)' }}>{c.userId?.email}</span></td>
                  <td>{c.symbol} {c.party}</td>
                  <td style={{ fontSize: 11 }}>{c.electionId?.title || '—'}</td>
                  <td><span className={`badge ${statusColor[c.approvalStatus]}`}>{c.approvalStatus}</span></td>
                </tr>
              ))}
              {candidates.length === 0 && (
                <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--text3)', padding: 24 }}>No candidates yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
