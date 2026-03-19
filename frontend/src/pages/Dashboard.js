import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { getAdminStats, getElections, getMyVotes, getVoterProfile } from '../services/api';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats,     setStats]     = useState(null);
  const [elections, setElections] = useState([]);
  const [myVotes,   setMyVotes]   = useState([]);
  const [voterInfo, setVoterInfo] = useState(null);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [elecRes] = await Promise.all([getElections()]);
        setElections(elecRes.data.elections || []);

        if (user.role === 'admin') {
          const s = await getAdminStats();
          setStats(s.data.stats);
        }
        if (user.role === 'voter') {
          const [vr, mv] = await Promise.all([getVoterProfile(), getMyVotes()]);
          setVoterInfo(vr.data.voter);
          setMyVotes(mv.data.votes || []);
        }
      } catch (err) {
        toast.error('Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    })();
  }, [user.role]);

  if (loading) return <div className="loading-screen">Loading dashboard…</div>;

  const activeElections = elections.filter(e => e.status === 'active');

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>
          Welcome back, {user.name} 👋
        </h2>
        <div style={{ color: 'var(--text3)', fontSize: 12 }}>
          Role: <span className={`badge badge-${user.role === 'admin' ? 'red' : user.role === 'candidate' ? 'purple' : 'blue'}`}>{user.role}</span>
        </div>
      </div>

      {/* ── Admin Stats ─────────────────────────── */}
      {user.role === 'admin' && stats && (
        <>
          <div className="grid-4" style={{ marginBottom: 20 }}>
            <div className="stat stat-blue">
              <div className="stat-label">Active Elections</div>
              <div className="stat-value">{activeElections.length}</div>
              <div className="stat-sub">Total: {stats.totalElections}</div>
            </div>
            <div className="stat stat-green">
              <div className="stat-label">Total Votes</div>
              <div className="stat-value">{stats.totalVotes.toLocaleString()}</div>
              <div className="stat-sub">Blockchain verified</div>
            </div>
            <div className="stat stat-amber">
              <div className="stat-label">Voters</div>
              <div className="stat-value">{stats.totalVoters}</div>
              <div className="stat-sub">Registered</div>
            </div>
            <div className="stat stat-purple">
              <div className="stat-label">Blockchain</div>
              <div className="stat-value">{stats.blockchain.totalBlocks}</div>
              <div className="stat-sub">
                {stats.blockchain.isValid
                  ? <span style={{ color: 'var(--green)' }}>✓ Valid</span>
                  : <span style={{ color: 'var(--red)' }}>⚠ Invalid</span>}
              </div>
            </div>
          </div>
          {stats.pendingCandidates > 0 && (
            <div style={{ background: 'rgba(210,153,34,.1)', border: '1px solid var(--amber)', borderRadius: 8, padding: '10px 16px', marginBottom: 16, fontSize: 12, color: 'var(--amber)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>⚠ {stats.pendingCandidates} candidate(s) awaiting approval</span>
              <Link to="/admin/candidates" className="btn btn-sm" style={{ color: 'var(--amber)', borderColor: 'var(--amber)' }}>Review</Link>
            </div>
          )}
        </>
      )}

      {/* ── Voter Stats ─────────────────────────── */}
      {user.role === 'voter' && (
        <div className="grid-3" style={{ marginBottom: 20 }}>
          <div className="stat stat-green">
            <div className="stat-label">Face Verified</div>
            <div className="stat-value">{voterInfo?.faceRegistered ? '✓' : '✗'}</div>
            <div className="stat-sub">{voterInfo?.faceRegistered ? 'Ready to vote' : 'Register face first'}</div>
          </div>
          <div className="stat stat-blue">
            <div className="stat-label">Votes Cast</div>
            <div className="stat-value">{myVotes.length}</div>
            <div className="stat-sub">This cycle</div>
          </div>
          <div className="stat stat-amber">
            <div className="stat-label">Active Elections</div>
            <div className="stat-value">{activeElections.length}</div>
            <div className="stat-sub">Open for voting</div>
          </div>
        </div>
      )}

      {/* ── Active Elections ─────────────────────── */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">🗳 Active Elections</div>
          <Link to="/elections" className="btn btn-sm">View All</Link>
        </div>
        {activeElections.length === 0 ? (
          <div className="empty-state"><div className="icon">🗳</div><div>No active elections</div></div>
        ) : (
          activeElections.map(e => (
            <div key={e._id} style={{ background: 'var(--bg3)', borderRadius: 8, padding: 14, marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{e.title}</div>
                <span className="badge badge-green">● LIVE</span>
              </div>
              <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 10 }}>
                Ends: {new Date(e.endTime).toLocaleDateString()}
              </div>
              {user.role === 'voter' && (
                <Link to="/vote" className="btn btn-sm btn-primary">Cast Vote →</Link>
              )}
              {user.role === 'admin' && (
                <Link to={`/results/${e._id}`} className="btn btn-sm">View Results</Link>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
