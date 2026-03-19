import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { getMyVotes } from '../services/api';

export default function MyVotes() {
  const [votes,   setVotes]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyVotes()
      .then(r => setVotes(r.data.votes || []))
      .catch(() => toast.error('Failed to load votes'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-screen">Loading…</div>;

  return (
    <div>
      <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>My Voting History</h2>

      {votes.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="icon">🗳</div>
            <div>You haven't voted in any election yet.</div>
          </div>
        </div>
      ) : (
        votes.map(v => (
          <div key={v._id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>
                  {v.electionId?.title || 'Unknown Election'}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>
                  Voted for: <b style={{ color: 'var(--text2)' }}>{v.candidateId?.userId?.name || '—'}</b>
                  {v.candidateId?.party && ` — ${v.candidateId.party}`}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2 }}>
                  {new Date(v.createdAt).toLocaleString()}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                <span className="badge badge-green">✓ Verified</span>
                {v.blockIndex !== undefined && (
                  <span className="badge badge-blue">Block #{v.blockIndex}</span>
                )}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 4 }}>
                Vote Hash (SHA-256) — stored on blockchain:
              </div>
              <div className="hash-box">{v.voteHash}</div>
            </div>
          </div>
        ))
      )}

      <div className="card" style={{ marginTop: 4 }}>
        <div style={{ fontSize: 11, color: 'var(--text3)', lineHeight: 1.9 }}>
          <b style={{ color: 'var(--text2)' }}>🔐 About your vote hashes:</b><br />
          Each hash is a SHA-256 digest of your voter ID, candidate ID, election ID, and timestamp.
          The raw vote data is <b style={{ color: 'var(--red)' }}>never stored on the blockchain</b> — only the hash.
          You can verify your vote by cross-referencing this hash in the Blockchain Explorer.
        </div>
      </div>
    </div>
  );
}
