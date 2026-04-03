import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { getAdminStats, getElections, getMyVotes, getVoterProfile, getResults } from '../services/api';

function Countdown({ endTime }) {
  const [t, setT] = useState('');
  useEffect(() => {
    const fn = () => {
      const d = new Date(endTime) - new Date();
      if (d <= 0) { setT('Ended'); return; }
      const h = Math.floor(d / 3600000), m = Math.floor((d % 3600000) / 60000), s = Math.floor((d % 60000) / 1000);
      setT(h > 0 ? `${h}h ${m}m ${s}s` : `${m}m ${s}s`);
    };
    fn(); const id = setInterval(fn, 1000); return () => clearInterval(id);
  }, [endTime]);
  return <span style={{ fontFamily: 'monospace', color: 'var(--green)', fontSize: 12 }}>{t}</span>;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats,    setStats]    = useState(null);
  const [elections,setElections]= useState([]);
  const [myVotes,  setMyVotes]  = useState([]);
  const [voter,    setVoter]    = useState(null);
  const [results,  setResults]  = useState({});
  const [loading,  setLoading]  = useState(true);

  const load = useCallback(async () => {
    try {
      const [er] = await Promise.all([getElections()]);
      const elecs = er.data.elections || [];
      setElections(elecs);
      if (user.role === 'admin') {
        const s = await getAdminStats(); setStats(s.data.stats);
        const res = {};
        await Promise.all(elecs.map(async e => { try { const r = await getResults(e._id); res[e._id] = r.data; } catch {} }));
        setResults(res);
      }
      if (user.role === 'voter') {
        const [vr, mv] = await Promise.all([getVoterProfile(), getMyVotes()]);
        setVoter(vr.data.voter); setMyVotes(mv.data.votes || []);
      }
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  }, [user.role]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="loading-screen">Loading</div>;

  const active = elections.filter(e => e.status === 'active');
  const closed = elections.filter(e => e.status === 'closed');
  const COLORS = ['var(--white)', 'var(--green)', 'var(--amber)', 'var(--purple)', 'var(--red)'];

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--white)' }}>
          Hello, {user.name}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* Admin */}
      {user.role === 'admin' && stats && (<>
        <div className="grid-4" style={{ marginBottom: 20 }}>
          <div className="stat"><div className="stat-label">Active elections</div><div className="stat-value">{active.length}</div></div>
          <div className="stat stat-green"><div className="stat-label">Total votes</div><div className="stat-value">{stats.totalVotes.toLocaleString()}</div></div>
          <div className="stat"><div className="stat-label">Voters</div><div className="stat-value">{stats.totalVoters}</div></div>
          <div className="stat"><div className="stat-label">Blocks</div><div className="stat-value" style={{ color: stats.blockchain?.isValid ? 'var(--green)' : 'var(--red)' }}>{stats.blockchain?.totalBlocks}</div><div className="stat-sub">{stats.blockchain?.isValid ? 'Chain valid' : '⚠ Tampered'}</div></div>
        </div>

        {stats.pendingCandidates > 0 && (
          <div style={{ background: 'var(--amber-bg)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 10, padding: '12px 16px', marginBottom: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--amber)', fontSize: 13 }}>
              {stats.pendingCandidates} candidate{stats.pendingCandidates > 1 ? 's' : ''} awaiting approval
            </span>
            <Link to="/admin/candidates" className="btn btn-sm" style={{ color: 'var(--amber)', borderColor: 'rgba(245,158,11,0.3)' }}>Review →</Link>
          </div>
        )}

        {elections.map(e => {
          const r = results[e._id]; if (!r || !r.results?.length) return null;
          return (
            <div key={e._id} className="card" style={{ marginBottom: 14 }}>
              <div className="card-header">
                <div>
                  <div className="card-title">{e.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{r.totalVotes} votes · {e.status === 'active' ? <><Countdown endTime={e.endTime} /></> : 'Closed'}</div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span className={`badge ${e.status === 'active' ? 'badge-green' : 'badge-amber'}`}>{e.status}</span>
                  <Link to={`/results/${e._id}`} className="btn btn-sm">Results →</Link>
                </div>
              </div>
              {r.results.slice(0, 4).map((c, i) => (
                <div key={c.candidateId} className="vote-bar-wrap">
                  <div className="vote-bar-label">
                    <span style={{ fontWeight: i === 0 && e.status === 'closed' ? 600 : 400 }}>
                      {i === 0 && e.status === 'closed' ? '🏆 ' : ''}{c.name}
                      <span style={{ color: 'var(--text3)', fontWeight: 400 }}> — {c.party}</span>
                    </span>
                    <span style={{ color: COLORS[i % COLORS.length] }}>{c.voteCount} ({c.percentage}%)</span>
                  </div>
                  <div className="vote-bar-bg">
                    <div className="vote-bar-fill" style={{ width: `${c.percentage}%`, background: COLORS[i % COLORS.length] }} />
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </>)}

      {/* Voter */}
      {user.role === 'voter' && (<>
        <div className="grid-3" style={{ marginBottom: 20 }}>
          <div className="stat stat-green">
            <div className="stat-label">Face status</div>
            <div className="stat-value" style={{ fontSize: 16, marginTop: 4 }}>{voter?.faceRegistered ? 'Registered ✓' : 'Not set up'}</div>
            <div className="stat-sub">{voter?.faceRegistered ? 'Ready to vote' : 'Setup required'}</div>
          </div>
          <div className="stat"><div className="stat-label">Votes cast</div><div className="stat-value">{myVotes.length}</div></div>
          <div className="stat"><div className="stat-label">Open elections</div><div className="stat-value">{active.length}</div></div>
        </div>

        {!voter?.faceRegistered && (
          <div style={{ background: 'var(--red-bg)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 10, padding: '14px 18px', marginBottom: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ color: 'var(--red)', fontWeight: 600, marginBottom: 2 }}>Face registration required</div>
              <div style={{ fontSize: 11, color: 'var(--text3)' }}>You must register your face before casting any votes.</div>
            </div>
            <Link to="/face-register" className="btn btn-sm">Set up now →</Link>
          </div>
        )}

        {active.map(e => {
          const voted = myVotes.some(v => (v.electionId?._id || v.electionId) === e._id);
          return (
            <div key={e._id} className="card-inset" style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--white)', marginBottom: 3 }}>{e.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)' }}>Closes in: <Countdown endTime={e.endTime} /></div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {voted
                    ? <span className="badge badge-green">✓ Voted</span>
                    : <Link to="/vote" className="btn btn-primary btn-sm">Vote now →</Link>
                  }
                  <Link to={`/results/${e._id}`} className="btn btn-sm">Results</Link>
                </div>
              </div>
            </div>
          );
        })}

        {active.length === 0 && (
          <div className="empty-state">
            <div style={{ fontSize: 32, marginBottom: 10, opacity: .3 }}>□</div>
            <div>No active elections right now.</div>
          </div>
        )}

        {closed.length > 0 && (
          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '.6px', fontWeight: 600 }}>Past Elections</div>
            {closed.map(e => (
              <div key={e._id} className="card-inset" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ fontWeight: 500 }}>{e.title}</div>
                <Link to={`/results/${e._id}`} className="btn btn-sm">Results →</Link>
              </div>
            ))}
          </div>
        )}
      </>)}

      {/* Candidate */}
      {user.role === 'candidate' && (<>
        <div className="grid-3" style={{ marginBottom: 20 }}>
          <div className="stat"><div className="stat-label">Active elections</div><div className="stat-value">{active.length}</div></div>
          <div className="stat"><div className="stat-label">Closed</div><div className="stat-value">{closed.length}</div></div>
          <div className="stat"><div className="stat-label">Total</div><div className="stat-value">{elections.length}</div></div>
        </div>
        {active.map(e => (
          <div key={e._id} className="card-inset" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div>
              <div style={{ fontWeight: 600, marginBottom: 3 }}>{e.title}</div>
              <div style={{ fontSize: 11, color: 'var(--text3)' }}>Closes: <Countdown endTime={e.endTime} /></div>
            </div>
            <Link to={`/results/${e._id}`} className="btn btn-sm">Live results →</Link>
          </div>
        ))}
      </>)}
    </div>
  );
}
