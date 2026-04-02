import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getResults } from '../services/api';

function Countdown({ endTime, onEnd }) {
  const [timeLeft, setTimeLeft] = useState('');
  useEffect(() => {
    const calc = () => {
      const diff = new Date(endTime) - new Date();
      if (diff <= 0) { setTimeLeft('Election Ended'); onEnd && onEnd(); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`);
    };
    calc();
    const t = setInterval(calc, 1000);
    return () => clearInterval(t);
  }, [endTime, onEnd]);
  return <span style={{ fontFamily: 'monospace', fontSize: 20, color: 'var(--gold)', letterSpacing: 2 }}>{timeLeft}</span>;
}

export default function Results() {
  const { id }  = useParams();
  const [data,  setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const r = await getResults(id);
      setData(r.data);
    } catch { toast.error('Failed to load results'); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => {
    load();
    // Auto-refresh every 10s for live results
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
  }, [load]);

  if (loading) return <div className="loading-screen">Loading results</div>;
  if (!data)   return <div className="empty-state"><div className="empty-icon">◉</div><div>No results found</div></div>;

  const { election, results, totalVotes, status } = data;
  const winner = status === 'closed' && results?.length > 0 ? results[0] : null;
  const COLORS = ['var(--gold)', 'var(--green)', 'var(--amber)', 'var(--purple)', 'var(--red)'];

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>{election?.title}</div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <span className={`badge ${status === 'active' ? 'badge-green' : 'badge-amber'}`}>
            {status === 'active' ? '● LIVE' : '◼ CLOSED'}
          </span>
          <span style={{ fontSize: 12, color: 'var(--text3)' }}>{totalVotes} total votes</span>
          {status === 'active' && (
            <span style={{ fontSize: 12, color: 'var(--text3)' }}>
              Closes in: <Countdown endTime={election?.endTime} onEnd={load} />
            </span>
          )}
          {status === 'active' && (
            <span style={{ fontSize: 11, color: 'var(--text3)', marginLeft: 'auto' }}>
              Auto-refreshing every 10s ↻
            </span>
          )}
        </div>
      </div>

      {/* Winner banner */}
      {winner && (
        <div style={{ background: 'var(--gold-bg2)', border: '1px solid var(--gold)', borderRadius: 12, padding: '20px 24px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ fontSize: 48 }}>🏆</div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--gold-dim)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Election Winner</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--gold2)' }}>{winner.name}</div>
            <div style={{ fontSize: 13, color: 'var(--text2)' }}>{winner.party} · {winner.voteCount} votes · {winner.percentage}%</div>
          </div>
        </div>
      )}

      {/* Results bars */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">◉ Vote Count</div>
          <button className="btn btn-sm" onClick={load}>↻ Refresh</button>
        </div>

        {results?.length === 0 ? (
          <div className="empty-state"><div className="empty-icon">🗳</div><div>No votes cast yet</div></div>
        ) : (
          results.map((r, i) => (
            <div key={r.candidateId} style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {i === 0 && status === 'closed' && <span style={{ fontSize: 18 }}>🏆</span>}
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{r.symbol} {r.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text3)' }}>{r.party}</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, color: COLORS[i % COLORS.length], fontSize: 18 }}>{r.percentage}%</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)' }}>{r.voteCount} votes</div>
                </div>
              </div>
              <div className="vote-bar-bg" style={{ height: 12, borderRadius: 6 }}>
                <div className="vote-bar-fill" style={{ width: `${r.percentage}%`, background: COLORS[i % COLORS.length], borderRadius: 6 }} />
              </div>
            </div>
          ))
        )}

        <div style={{ marginTop: 16, padding: '12px 0', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text3)' }}>
          <span>Total votes cast: <b style={{ color: 'var(--text)' }}>{totalVotes}</b></span>
          <span>Election: <b style={{ color: status === 'active' ? 'var(--green)' : 'var(--amber)' }}>{status}</b></span>
        </div>
      </div>
    </div>
  );
}
