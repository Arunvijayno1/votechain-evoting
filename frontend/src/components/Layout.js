import React from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const MENUS = {
  admin: [
    { section: 'Overview',  items: [
      { to: '/dashboard',        icon: '◈', label: 'Dashboard' },
      { to: '/analytics',        icon: '◉', label: 'Analytics' },
    ]},
    { section: 'Elections', items: [
      { to: '/elections',        icon: '⊡', label: 'Elections' },
      { to: '/admin/candidates', icon: '◎', label: 'Approvals', badge: true },
      { to: '/candidates',       icon: '◑', label: 'All Candidates' },
    ]},
    { section: 'System',    items: [
      { to: '/blockchain',       icon: '⛓', label: 'Blockchain' },
    ]},
  ],
  voter: [
    { section: 'Voting',    items: [
      { to: '/dashboard',        icon: '◈', label: 'Dashboard' },
      { to: '/vote',             icon: '⊡', label: 'Cast Vote' },
      { to: '/my-votes',         icon: '✓',  label: 'My Votes' },
    ]},
    { section: 'Profile',   items: [
      { to: '/face-register',    icon: '◉', label: 'Face Register' },
    ]},
    { section: 'Info',      items: [
      { to: '/elections',        icon: '◑', label: 'Elections' },
      { to: '/blockchain',       icon: '⛓', label: 'Blockchain' },
    ]},
  ],
  candidate: [
    { section: 'Campaign',  items: [
      { to: '/dashboard',        icon: '◈', label: 'Dashboard' },
      { to: '/elections',        icon: '⊡', label: 'Elections' },
      { to: '/candidates',       icon: '◑', label: 'Candidates' },
      { to: '/blockchain',       icon: '⛓', label: 'Blockchain' },
    ]},
  ],
};

const PAGE_TITLES = {
  '/dashboard': 'Dashboard', '/analytics': 'Analytics', '/elections': 'Elections',
  '/admin/candidates': 'Candidate Approvals', '/candidates': 'Candidates',
  '/blockchain': 'Blockchain Explorer', '/vote': 'Cast Vote',
  '/my-votes': 'My Vote History', '/face-register': 'Face Registration',
};

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const menus    = MENUS[user?.role] || MENUS.voter;

  const pageTitle = Object.entries(PAGE_TITLES).find(([k]) => location.pathname.startsWith(k))?.[1] || 'VoteChain';

  return (
    <div className="app-layout">
      {/* ── Sidebar ──────────────────────────── */}
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-logo">
            <div className="brand-icon">⊡</div>
            <div className="brand-name">VOTECHAIN</div>
          </div>
          <div className="brand-sub">Secure · Verified · Immutable</div>
        </div>

        <div className="role-chip">
          <div className="role-dot" />
          <div className="role-name">{user?.name}</div>
          <div className="role-badge">{user?.role}</div>
        </div>

        <nav style={{ flex: 1, paddingTop: 4 }}>
          {menus.map(section => (
            <div key={section.section}>
              <div className="nav-section">{section.section}</div>
              {section.items.map(item => (
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
          <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 2 }}>Signed in as</div>
          <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</div>
          <button className="btn btn-red btn-sm" style={{ width: '100%' }} onClick={() => { logout(); navigate('/login'); }}>
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main ─────────────────────────────── */}
      <div className="main-content">
        <div className="topbar">
          <div className="page-title">{pageTitle}</div>
          <div className="topbar-pill"><span className="topbar-dot" />Blockchain Active</div>
          <div className="topbar-pill">🔒 JWT Secured</div>
        </div>
        <div className="page-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
