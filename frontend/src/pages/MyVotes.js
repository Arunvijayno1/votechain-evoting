import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { getMyVotes } from '../services/api';

export default function MyVotes() {
  const [votes, setVotes]     = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyVotes().then(r => setVotes(r.data.votes || [])).catch(() => toast.error('Failed')).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-screen">Loading</div>;

  return (
    <div className="fade-in">
      <div className="section-title">My Vote History</div>
      {votes.length === 0 ? (
        <div className="card"><div className="empty-state"><div className="empty-icon">🗳</div><div>You haven't voted yet.</div></div></div>
      ) : votes.map(v => (
        <div key={v._id} className="card-gold" style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{v.electionId?.title || 'Election'}</div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>
                Voted for: <b style={{ color: 'var(--gold2)' }}>{v.candidateId?.userId?.name}</b>
                {v.candidateId?.party && <span style={{ color: 'var(--text3)' }}> — {v.candidateId.party}</span>}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{new Date(v.createdAt).toLocaleString()}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, alignItems: 'flex-end' }}>
              <span className="badge badge-green">✓ Recorded</span>
              {v.blockIndex !== undefined && <span className="badge badge-gold">Block #{v.blockIndex}</span>}
            </div>
          </div>
          <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 4 }}>Vote Hash (SHA-256)</div>
          <div className="hash-box">{v.voteHash}</div>
        </div>
      ))}
      <div style={{ fontSize: 11, color: 'var(--text3)', padding: '16px 0', lineHeight: 1.8 }}>
        🔐 Each hash is SHA-256(voterId:candidateId:electionId:timestamp). Raw vote data is never on the blockchain. Verify any hash in the Blockchain Explorer.
      </div>
    </div>
  );
}
