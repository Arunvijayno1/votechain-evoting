import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { getCandidates, approveCandidate } from '../services/api';

export default function AdminCandidates() {
  const [candidates, setCandidates] = useState([]);
  const [filter,     setFilter]     = useState('all');

  const load = () =>
    getCandidates()
      .then(r => setCandidates(r.data.candidates || []))
      .catch(() => toast.error('Failed to load candidates'));

  useEffect(() => { load(); }, []);

  const handle = async (id, status) => {
    try {
      await approveCandidate(id, status);
      toast.success(`Candidate ${status}`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    }
  };

  const statusColor = { approved: 'badge-green', pending: 'badge-amber', rejected: 'badge-red' };
  const filtered = filter === 'all' ? candidates : candidates.filter(c => c.approvalStatus === filter);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700 }}>Candidate Approvals</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          {['all', 'pending', 'approved', 'rejected'].map(f => (
            <button key={f} className={`btn btn-sm${filter === f ? ' btn-primary' : ''}`}
              onClick={() => setFilter(f)}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th><th>Party</th><th>Election</th>
                <th>Statement</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c._id}>
                  <td>
                    <b>{c.userId?.name}</b>
                    <br />
                    <span style={{ fontSize: 10, color: 'var(--text3)' }}>{c.userId?.email}</span>
                  </td>
                  <td>{c.symbol} {c.party}</td>
                  <td style={{ fontSize: 11 }}>{c.electionId?.title || '—'}</td>
                  <td style={{ fontSize: 11, maxWidth: 180, color: 'var(--text2)' }}>
                    {c.statement ? c.statement.slice(0, 60) + (c.statement.length > 60 ? '…' : '') : '—'}
                  </td>
                  <td>
                    <span className={`badge ${statusColor[c.approvalStatus]}`}>
                      {c.approvalStatus}
                    </span>
                  </td>
                  <td>
                    {c.approvalStatus === 'pending' && (
                      <>
                        <button className="btn btn-sm btn-green"
                          style={{ marginRight: 6 }}
                          onClick={() => handle(c._id, 'approved')}>
                          ✓ Approve
                        </button>
                        <button className="btn btn-sm btn-red"
                          onClick={() => handle(c._id, 'rejected')}>
                          ✗ Reject
                        </button>
                      </>
                    )}
                    {c.approvalStatus !== 'pending' && (
                      <span style={{ fontSize: 11, color: 'var(--text3)' }}>—</span>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text3)', padding: 24 }}>
                    No candidates
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
