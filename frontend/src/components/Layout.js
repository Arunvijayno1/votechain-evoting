import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const MENUS = {
  admin: [
    { section: 'Overview', items: [
      { to: '/dashboard',          icon: '📊', label: 'Dashboard' },
      { to: '/analytics',          icon: '📈', label: 'Analytics' },
    ]},
    { section: 'Manage', items: [
      { to: '/elections',          icon: '🗳',  label: 'Elections' },
      { to: '/admin/candidates',   icon: '👤',  label: 'Candidates', badge: true },
      { to: '/candidates',         icon: '📋',  label: 'All Candidates' },
    ]},
    { section: 'Security', items: [
      { to: '/blockchain',         icon: '⛓',  label: 'Blockchain' },
    ]},
  ],
  voter: [
    { section: 'Voting', items: [
      { to: '/dashboard',          icon: '📊', label: 'Dashboard' },
      { to: '/vote',               icon: '🗳',  label: 'Cast Vote' },
      { to: '/my-votes',           icon: '✅',  label: 'My Votes' },
    ]},
    { section: 'Profile', items: [
      { to: '/face-register',      icon: '🤳',  label: 'Face Register' },
    ]},
    { section: 'Results', items: [
      { to: '/elections',          icon: '📋',  label: 'Elections' },
      { to: '/blockchain',         icon: '⛓',  label: 'Blockchain' },
    ]},
  ],
  candidate: [
    { section: 'Campaign', items: [
      { to: '/dashboard',          icon: '📊', label: 'Dashboard' },
      { to: '/elections',          icon: '📋',  label: 'Elections' },
      { to: '/candidates',         icon: '👤',  label: 'Candidates' },
      { to: '/blockchain',         icon: '⛓',  label: 'Blockchain' },
    ]},
  ],
};

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const menus = MENUS[user?.role] || MENUS.voter;

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="app-layout">
      {/* ── Sidebar ─────────────────────────────────────── */}
      <aside className="sidebar">
        <div className="brand">
          <div style={{ fontSize: 22, marginBottom: 4 }}>🗳</div>
          <div className="brand-name">VOTECHAIN</div>
          <div className="brand-sub">Secure · Verified · Immutable</div>
        </div>

        <div className="role-chip">
          <div className="role-dot" />
          <span>{user?.name}</span>
          <span className="badge badge-blue" style={{ marginLeft: 'auto', fontSize: 9 }}>
            {user?.role}
          </span>
        </div>

        <nav style={{ flex: 1, paddingTop: 8 }}>
          {menus.map(section => (
            <div key={section.section}>
              <div className="nav-section-label">{section.section}</div>
              {section.items.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
                >
                  <span className="nav-icon">{item.icon}</span>
                  {item.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 4 }}>Signed in as</div>
          <div style={{ fontSize: 11, marginBottom: 10, color: 'var(--text2)' }}>{user?.email}</div>
          <button className="btn btn-sm btn-red" style={{ width: '100%' }} onClick={handleLogout}>
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main ─────────────────────────────────────────── */}
      <div className="main-content">
        <div className="topbar">
          <div style={{ flex: 1, fontWeight: 700, fontSize: 14 }}>VoteChain Admin Panel</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text2)' }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--green)', display: 'inline-block', animation: 'pulse 2s infinite' }} />
            Blockchain Synced
          </div>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginLeft: 12 }}>🔒 JWT Active</div>
        </div>
        <div className="page-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
