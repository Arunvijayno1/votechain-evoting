// Results.js
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getResults, getElection } from '../services/api';

export function Results() {
  const { id } = useParams();
  const [results,  setResults]  = useState([]);
  const [election, setElection] = useState(null);

  useEffect(() => {
    Promise.all([getResults(id), getElection(id)])
      .then(([r, e]) => { setResults(r.data.results || []); setElection(e.data.election); })
      .catch(() => toast.error('Failed to load results'));
  }, [id]);

  const total = results.reduce((sum, r) => sum + r.voteCount, 0);
  const COLORS = ['var(--blue)', 'var(--green)', 'var(--purple)', 'var(--amber)', 'var(--red)'];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700 }}>{election?.title || 'Results'}</h2>
        <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>Total votes: {total.toLocaleString()}</div>
      </div>
      <div className="card">
        {results.length === 0 ? (
          <div className="empty-state"><div className="icon">📊</div><div>No votes cast yet</div></div>
        ) : (
          results.map((r, i) => {
            const pct = total > 0 ? Math.round(r.voteCount / total * 100) : 0;
            return (
              <div key={r.candidateId} className="vote-bar-wrap">
                <div className="vote-bar-label">
                  <span><b>{r.name}</b> — {r.party}</span>
                  <span style={{ color: COLORS[i % COLORS.length] }}>{r.voteCount} votes ({pct}%)</span>
                </div>
                <div className="vote-bar-bg">
                  <div className="vote-bar-fill" style={{ width: `${pct}%`, background: COLORS[i % COLORS.length] }} />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
export default Results;
