import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { getAdminStats, getElections, getResults } from '../services/api';

export default function Analytics() {
  const [stats,     setStats]     = useState(null);
  const [elections, setElections] = useState([]);
  const [results,   setResults]   = useState({});
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([getAdminStats(), getElections()])
      .then(async ([s, e]) => {
        setStats(s.data.stats);
        const elecs = e.data.elections || [];
        setElections(elecs);
        // Load results for each election
        const res = {};
        await Promise.all(
          elecs.map(async el => {
            try {
              const r = await getResults(el._id);
              res[el._id] = r.data.results || [];
            } catch { res[el._id] = []; }
          })
        );
        setResults(res);
      })
      .catch(() => toast.error('Failed to load analytics'))
      .finally(() => setLoading(false));
  }, []);

  const exportCSV = () => {
    const rows = [['Election', 'Candidate', 'Party', 'Votes']];
    elections.forEach(e => {
      (results[e._id] || []).forEach(r => {
        rows.push([e.title, r.name, r.party, r.voteCount]);
      });
    });
    const csv  = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'election_results.csv'; a.click();
    toast.success('Results exported as CSV');
  };

  if (loading) return <div className="loading-screen">Loading analytics…</div>;

  const COLORS = ['var(--blue)', 'var(--green)', 'var(--purple)', 'var(--amber)', 'var(--red)'];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700 }}>Analytics</h2>
        <button className="btn btn-sm btn-primary" onClick={exportCSV}>📥 Export CSV</button>
      </div>

      {stats && (
        <div className="grid-4" style={{ marginBottom: 20 }}>
          <div className="stat stat-blue">
            <div className="stat-label">Total Votes</div>
            <div className="stat-value">{stats.totalVotes.toLocaleString()}</div>
          </div>
          <div className="stat stat-green">
            <div className="stat-label">Registered Voters</div>
            <div className="stat-value">{stats.totalVoters}</div>
          </div>
          <div className="stat stat-amber">
            <div className="stat-label">Candidates</div>
            <div className="stat-value">{stats.totalCandidates}</div>
          </div>
          <div className="stat stat-purple">
            <div className="stat-label">Blockchain Blocks</div>
            <div className="stat-value">{stats.blockchain?.totalBlocks}</div>
            <div className="stat-sub" style={{ color: stats.blockchain?.isValid ? 'var(--green)' : 'var(--red)' }}>
              {stats.blockchain?.isValid ? '✓ Valid' : '⚠ Invalid'}
            </div>
          </div>
        </div>
      )}

      {elections.map(e => {
        const res   = results[e._id] || [];
        const total = res.reduce((s, r) => s + r.voteCount, 0);
        if (res.length === 0) return null;
        return (
          <div key={e._id} className="card">
            <div className="card-header">
              <div className="card-title">📊 {e.title}</div>
              <span className="badge badge-blue">{total.toLocaleString()} votes</span>
            </div>
            {res.map((r, i) => {
              const pct = total > 0 ? Math.round(r.voteCount / total * 100) : 0;
              return (
                <div key={r.candidateId} className="vote-bar-wrap">
                  <div className="vote-bar-label">
                    <span>
                      <b>{r.name}</b>
                      {r.party && <span style={{ color: 'var(--text3)' }}> — {r.party}</span>}
                    </span>
                    <span style={{ color: COLORS[i % COLORS.length] }}>
                      {r.voteCount} ({pct}%)
                    </span>
                  </div>
                  <div className="vote-bar-bg">
                    <div className="vote-bar-fill"
                      style={{ width: `${pct}%`, background: COLORS[i % COLORS.length] }} />
                  </div>
                </div>
              );
            })}
            {res.length > 0 && (
              <div style={{ marginTop: 10, fontSize: 11, color: 'var(--text3)' }}>
                Leading: <b style={{ color: 'var(--text)' }}>{res[0].name}</b> with {Math.round(res[0].voteCount / total * 100)}% of votes
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
