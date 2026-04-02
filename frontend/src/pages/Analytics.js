import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { getAdminStats, getElections, getResults } from '../services/api';

export default function Analytics() {
  const [stats, setStats]     = useState(null);
  const [elections, setElec]  = useState([]);
  const [results, setRes]     = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getAdminStats(), getElections()])
      .then(async ([s, e]) => {
        setStats(s.data.stats);
        const elecs = e.data.elections || [];
        setElec(elecs);
        const res = {};
        await Promise.all(elecs.map(async el => {
          try { const r = await getResults(el._id); res[el._id] = r.data; } catch {}
        }));
        setRes(res);
      })
      .catch(() => toast.error('Failed to load analytics'))
      .finally(() => setLoading(false));
  }, []);

  const exportCSV = () => {
    const rows = [['Election','Candidate','Party','Votes','Percentage']];
    elections.forEach(e => {
      (results[e._id]?.results || []).forEach(r => {
        rows.push([e.title, r.name, r.party, r.voteCount, r.percentage + '%']);
      });
    });
    const csv  = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a    = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: 'election_results.csv' });
    a.click();
    toast.success('Exported as CSV');
  };

  if (loading) return <div className="loading-screen">Loading analytics</div>;

  const COLORS = ['var(--gold)','var(--green)','var(--amber)','var(--purple)','var(--red)'];

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div className="section-title" style={{ margin: 0 }}>Analytics</div>
        <button className="btn btn-gold" onClick={exportCSV}>↓ Export CSV</button>
      </div>

      {stats && (
        <div className="grid-4" style={{ marginBottom: 24 }}>
          <div className="stat stat-gold"><div className="stat-label">Total Votes</div><div className="stat-value">{stats.totalVotes.toLocaleString()}</div></div>
          <div className="stat stat-green"><div className="stat-label">Registered Voters</div><div className="stat-value">{stats.totalVoters}</div></div>
          <div className="stat"><div className="stat-label">Candidates</div><div className="stat-value">{stats.totalCandidates}</div></div>
          <div className="stat"><div className="stat-label">Blockchain</div><div className="stat-value" style={{color:'var(--gold)'}}>{stats.blockchain?.totalBlocks}</div><div className="stat-sub" style={{color: stats.blockchain?.isValid ? 'var(--green)' : 'var(--red)'}}>{stats.blockchain?.isValid ? '✓ Valid' : '⚠ Invalid'}</div></div>
        </div>
      )}

      {elections.map(e => {
        const res   = results[e._id];
        if (!res)   return null;
        const total = res.totalVotes || 0;
        return (
          <div key={e._id} className="card" style={{ marginBottom: 18 }}>
            <div className="card-header">
              <div className="card-title">◉ {e.title}</div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span className={`badge ${e.status === 'active' ? 'badge-green' : 'badge-amber'}`}>{e.status}</span>
                <span style={{ fontSize: 12, color: 'var(--text3)' }}>{total} votes</span>
              </div>
            </div>
            {(res.results || []).length === 0 ? (
              <div style={{ color: 'var(--text3)', fontSize: 12, padding: '10px 0' }}>No votes cast yet</div>
            ) : (
              (res.results || []).map((r, i) => (
                <div key={r.candidateId} className="vote-bar-wrap">
                  <div className="vote-bar-label">
                    <span><b>{r.name}</b> <span style={{ color: 'var(--text3)' }}>— {r.party}</span></span>
                    <span style={{ color: COLORS[i % COLORS.length], fontWeight: 700 }}>{r.voteCount} ({r.percentage}%)</span>
                  </div>
                  <div className="vote-bar-bg"><div className="vote-bar-fill" style={{ width: `${r.percentage}%`, background: COLORS[i % COLORS.length] }} /></div>
                </div>
              ))
            )}
          </div>
        );
      })}
    </div>
  );
}
