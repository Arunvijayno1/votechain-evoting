import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getResults } from '../services/api';

function Countdown({ endTime }) {
  const [t, setT] = useState('');
  useEffect(() => {
    const fn = () => {
      const d = new Date(endTime) - new Date();
      if (d <= 0) { setT('Ended'); return; }
      const h = Math.floor(d/3600000), m = Math.floor((d%3600000)/60000), s = Math.floor((d%60000)/1000);
      setT(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`);
    };
    fn(); const id = setInterval(fn, 1000); return () => clearInterval(id);
  }, [endTime]);
  return <span style={{ fontFamily: 'monospace', color: 'var(--green)' }}>{t}</span>;
}

export default function Results() {
  const { id } = useParams();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try { const r = await getResults(id); setData(r.data); }
    catch { toast.error('Failed to load results'); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => {
    load();
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
  }, [load]);

  if (loading) return <div className="loading-screen">Loading results</div>;
  if (!data)   return <div className="empty-state">No data</div>;

  const { election, results, totalVotes, status } = data;
  const winner = status === 'closed' && results?.length ? results[0] : null;
  const COLORS = ['var(--white)', 'var(--green)', 'var(--amber)', 'var(--purple)', 'var(--red)'];

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 22 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--white)', marginBottom: 6 }}>{election?.title}</div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <span className={`badge ${status === 'active' ? 'badge-green' : 'badge-amber'}`}>
            {status === 'active' ? '● Live' : '◼ Closed'}
          </span>
          <span style={{ fontSize: 12, color: 'var(--text3)' }}>{totalVotes} total votes</span>
          {status === 'active' && (
            <span style={{ fontSize: 12, color: 'var(--text3)' }}>
              Closes in: <Countdown endTime={election?.endTime} />
            </span>
          )}
          {status === 'active' && (
            <span style={{ fontSize: 11, color: 'var(--text3)', marginLeft: 'auto' }}>Refreshes every 10s</span>
          )}
        </div>
      </div>

      {winner && (
        <div style={{ background: 'var(--green-bg)', border: '1px solid rgba(34,197,94,.25)', borderRadius: 12, padding: '18px 22px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 18 }}>
          <div style={{ fontSize: 40 }}>🏆</div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--green)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 4 }}>Winner</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--white)' }}>{winner.name}</div>
            <div style={{ fontSize: 13, color: 'var(--text2)' }}>{winner.party} · {winner.voteCount} votes · {winner.percentage}%</div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <div className="card-title">Results</div>
          <button className="btn btn-sm" onClick={load}>↻ Refresh</button>
        </div>
        {!results?.length ? (
          <div className="empty-state"><div>No votes cast yet</div></div>
        ) : results.map((r, i) => (
          <div key={r.candidateId} style={{ marginBottom: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <div>
                <span style={{ fontWeight: 600, color: 'var(--white)' }}>
                  {i === 0 && status === 'closed' ? '🏆 ' : ''}{r.name}
                </span>
                <span style={{ fontSize: 12, color: 'var(--text3)', marginLeft: 8 }}>{r.party}</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 700, color: COLORS[i % COLORS.length], fontSize: 16 }}>{r.percentage}%</div>
                <div style={{ fontSize: 11, color: 'var(--text3)' }}>{r.voteCount} votes</div>
              </div>
            </div>
            <div className="vote-bar-bg">
              <div className="vote-bar-fill" style={{ width: `${r.percentage}%`, background: COLORS[i % COLORS.length] }} />
            </div>
          </div>
        ))}
        <div style={{ paddingTop: 12, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text3)' }}>
          <span>Total votes: <b style={{ color: 'var(--text)' }}>{totalVotes}</b></span>
          <span>Status: <b style={{ color: status === 'active' ? 'var(--green)' : 'var(--amber)' }}>{status}</b></span>
        </div>
      </div>
    </div>
  );
}
