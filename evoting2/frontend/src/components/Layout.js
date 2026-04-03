import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const MENUS = {
  admin: [
    { section: 'Overview', items: [
      { to: '/dashboard',        icon: '▦', label: 'Dashboard' },
      { to: '/analytics',        icon: '↗', label: 'Analytics' },
    ]},
    { section: 'Manage', items: [
      { to: '/elections',        icon: '□', label: 'Elections' },
      { to: '/admin/candidates', icon: '◎', label: 'Approvals', badge: true },
      { to: '/candidates',       icon: '≡', label: 'All Candidates' },
    ]},
    { section: 'System', items: [
      { to: '/blockchain',       icon: '⬡', label: 'Blockchain' },
    ]},
  ],
  voter: [
    { section: 'Voting', items: [
      { to: '/dashboard',    icon: '▦', label: 'Dashboard' },
      { to: '/vote',         icon: '□', label: 'Cast Vote' },
      { to: '/my-votes',     icon: '✓', label: 'My Votes' },
    ]},
    { section: 'Profile', items: [
      { to: '/face-register', icon: '◎', label: 'Face Register' },
    ]},
    { section: 'Info', items: [
      { to: '/elections',    icon: '≡', label: 'Elections' },
      { to: '/blockchain',   icon: '⬡', label: 'Blockchain' },
    ]},
  ],
  candidate: [
    { section: 'Info', items: [
      { to: '/dashboard',    icon: '▦', label: 'Dashboard' },
      { to: '/elections',    icon: '□', label: 'Elections' },
      { to: '/candidates',   icon: '≡', label: 'Candidates' },
      { to: '/blockchain',   icon: '⬡', label: 'Blockchain' },
    ]},
  ],
};

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const menus = MENUS[user?.role] || MENUS.voter;

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-row">
            <div className="brand-icon">✓</div>
            <div className="brand-name">VoteChain</div>
          </div>
          <div className="brand-sub">Secure blockchain voting</div>
        </div>

        <div className="role-chip">
          <div className="role-dot" />
          <div className="role-name">{user?.name}</div>
          <div className="role-tag">{user?.role}</div>
        </div>

        <nav style={{ flex: 1, overflowY: 'auto' }}>
          {menus.map(s => (
            <div key={s.section}>
              <div className="nav-section">{s.section}</div>
              {s.items.map(item => (
                <NavLink key={item.to} to={item.to}
                  className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
                  <span className="nav-icon">{item.icon}</span>
                  {item.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-email">{user?.email}</div>
          <button className="btn btn-red btn-sm" style={{ width: '100%' }}
            onClick={() => { logout(); navigate('/login'); }}>
            Sign Out
          </button>
        </div>
      </aside>

      <div className="main-content">
        <div className="topbar">
          <div className="page-title">VoteChain</div>
          <div className="status-pill"><span className="status-dot" />Blockchain active</div>
          <div className="status-pill">🔒 JWT</div>
        </div>
        <div className="page-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
