import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { getAdminStats, getElections, getMyVotes, getVoterProfile, getResults } from '../services/api';

function Countdown({ endTime }) {
  const [timeLeft, setTimeLeft] = useState('');
  useEffect(() => {
    const calc = () => {
      const diff = new Date(endTime) - new Date();
      if (diff <= 0) { setTimeLeft('Ended'); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(d > 0 ? `${d}d ${h}h ${m}m` : `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`);
    };
    calc();
    const t = setInterval(calc, 1000);
    return () => clearInterval(t);
  }, [endTime]);
  return <span style={{ fontFamily: 'monospace', color: 'var(--gold)' }}>{timeLeft}</span>;
}

export default function Dashboard() {
  const { user }  = useAuth();
  const [stats,     setStats]     = useState(null);
  const [elections, setElections] = useState([]);
  const [myVotes,   setMyVotes]   = useState([]);
  const [voterInfo, setVoterInfo] = useState(null);
  const [liveResults, setLiveResults] = useState({});
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [elecRes] = await Promise.all([getElections()]);
        const elecs = elecRes.data.elections || [];
        setElections(elecs);

        if (user.role === 'admin') {
          const s = await getAdminStats();
          setStats(s.data.stats);
          // Load results for each election
          const res = {};
          await Promise.all(elecs.map(async e => {
            try { const r = await getResults(e._id); res[e._id] = r.data; } catch {}
          }));
          setLiveResults(res);
        }
        if (user.role === 'voter') {
          const [vr, mv] = await Promise.all([getVoterProfile(), getMyVotes()]);
          setVoterInfo(vr.data.voter);
          setMyVotes(mv.data.votes || []);
        }
      } catch { toast.error('Failed to load dashboard'); }
      finally { setLoading(false); }
    })();
  }, [user.role]);

  if (loading) return <div className="loading-screen">Loading dashboard</div>;

  const active  = elections.filter(e => e.status === 'active');
  const closed  = elections.filter(e => e.status === 'closed');
  const COLORS  = ['var(--gold)', 'var(--green)', 'var(--amber)', 'var(--purple)', 'var(--red)'];

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>
          Welcome back, <span style={{ color: 'var(--gold2)' }}>{user.name}</span>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text3)' }}>{new Date().toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}</div>
      </div>

      {/* ── Admin ── */}
      {user.role === 'admin' && stats && (
        <>
          <div className="grid-4" style={{ marginBottom: 24 }}>
            <div className="stat stat-gold"><div className="stat-label">Active Elections</div><div className="stat-value">{active.length}</div><div className="stat-sub">Total: {stats.totalElections}</div></div>
            <div className="stat stat-green"><div className="stat-label">Total Votes</div><div className="stat-value">{stats.totalVotes.toLocaleString()}</div><div className="stat-sub">Blockchain verified</div></div>
            <div className="stat"><div className="stat-label">Registered Voters</div><div className="stat-value">{stats.totalVoters}</div><div className="stat-sub">Face verified accounts</div></div>
            <div className="stat"><div className="stat-label">Blockchain Blocks</div><div className="stat-value" style={{color:'var(--gold)'}}>{stats.blockchain?.totalBlocks}</div><div className="stat-sub" style={{color: stats.blockchain?.isValid ? 'var(--green)' : 'var(--red)'}}>{stats.blockchain?.isValid ? '✓ Chain Valid' : '⚠ Tampered!'}</div></div>
          </div>

          {stats.pendingCandidates > 0 && (
            <div style={{ background: 'var(--amber-bg)', border: '1px solid var(--amber)', borderRadius: 10, padding: '12px 18px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--amber)', fontSize: 13 }}>⚠ {stats.pendingCandidates} candidate(s) pending approval</span>
              <Link to="/admin/candidates" className="btn btn-sm" style={{ color: 'var(--amber)', borderColor: 'var(--amber)' }}>Review →</Link>
            </div>
          )}

          {/* Live results for all elections */}
          {elections.map(e => {
            const res = liveResults[e._id];
            if (!res || !res.results?.length) return null;
            const total = res.totalVotes || 0;
            return (
              <div key={e._id} className="card" style={{ marginBottom: 16 }}>
                <div className="card-header">
                  <div className="card-title">
                    ◉ {e.title}
                    <span className={`badge ${e.status === 'active' ? 'badge-green' : 'badge-amber'}`} style={{ marginLeft: 8 }}>{e.status.toUpperCase()}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: 'var(--text3)' }}>{total} votes</span>
                    {e.status === 'active' && <span style={{ fontSize: 11, color: 'var(--text2)' }}>Ends: <Countdown endTime={e.endTime} /></span>}
                    <Link to={`/results/${e._id}`} className="btn btn-sm">Full Results →</Link>
                  </div>
                </div>
                {res.results.slice(0,4).map((r, i) => (
                  <div key={r.candidateId} className="vote-bar-wrap">
                    <div className="vote-bar-label">
                      <span style={{ fontWeight: 600 }}>{i === 0 && e.status === 'closed' ? '🏆 ' : ''}{r.name} <span style={{ color: 'var(--text3)', fontWeight: 400 }}>— {r.party}</span></span>
                      <span style={{ color: COLORS[i % COLORS.length], fontWeight: 700 }}>{r.voteCount} ({r.percentage}%)</span>
                    </div>
                    <div className="vote-bar-bg"><div className="vote-bar-fill" style={{ width: `${r.percentage}%`, background: COLORS[i % COLORS.length] }} /></div>
                  </div>
                ))}
              </div>
            );
          })}
        </>
      )}

      {/* ── Voter ── */}
      {user.role === 'voter' && (
        <>
          <div className="grid-3" style={{ marginBottom: 24 }}>
            <div className="stat stat-green"><div className="stat-label">Face Status</div><div className="stat-value" style={{ fontSize: 20 }}>{voterInfo?.faceRegistered ? 'Registered ✓' : 'Not Registered'}</div><div className="stat-sub">{voterInfo?.faceRegistered ? 'Ready to vote' : 'Complete face setup first'}</div></div>
            <div className="stat stat-gold"><div className="stat-label">Votes Cast</div><div className="stat-value">{myVotes.length}</div><div className="stat-sub">Elections participated</div></div>
            <div className="stat"><div className="stat-label">Active Elections</div><div className="stat-value">{active.length}</div><div className="stat-sub">Open for voting</div></div>
          </div>

          {!voterInfo?.faceRegistered && (
            <div style={{ background: 'var(--red-bg)', border: '1px solid var(--red)', borderRadius: 10, padding: '14px 18px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ color: 'var(--red)', fontWeight: 700, marginBottom: 2 }}>Face Registration Required</div>
                <div style={{ fontSize: 11, color: 'var(--text3)' }}>You must register your face before you can cast a vote.</div>
              </div>
              <Link to="/face-register" className="btn btn-gold">Register Face →</Link>
            </div>
          )}

          {active.map(e => (
            <div key={e._id} className="card-gold" style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)', marginBottom: 4 }}>{e.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)' }}>Closes in: <Countdown endTime={e.endTime} /></div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {myVotes.some(v => v.electionId?._id === e._id || v.electionId === e._id)
                    ? <span className="badge badge-green">✓ Voted</span>
                    : <Link to="/vote" className="btn btn-gold">Vote Now →</Link>
                  }
                  <Link to={`/results/${e._id}`} className="btn btn-sm">Results</Link>
                </div>
              </div>
            </div>
          ))}

          {closed.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <div className="section-title" style={{ fontSize: 14, marginBottom: 14 }}>Completed Elections</div>
              {closed.map(e => (
                <div key={e._id} className="card" style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: 600 }}>{e.title}</div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span className="badge badge-amber">Closed</span>
                      <Link to={`/results/${e._id}`} className="btn btn-sm">View Results →</Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Candidate ── */}
      {user.role === 'candidate' && (
        <>
          <div className="grid-3" style={{ marginBottom: 24 }}>
            <div className="stat stat-gold"><div className="stat-label">Active Elections</div><div className="stat-value">{active.length}</div></div>
            <div className="stat stat-green"><div className="stat-label">Closed Elections</div><div className="stat-value">{closed.length}</div></div>
            <div className="stat"><div className="stat-label">Total Elections</div><div className="stat-value">{elections.length}</div></div>
          </div>
          {active.map(e => (
            <div key={e._id} className="card-gold" style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{e.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>Closes: <Countdown endTime={e.endTime} /></div>
                </div>
                <Link to={`/results/${e._id}`} className="btn btn-gold">Live Results →</Link>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
