import React, { useEffect, useState } from 'react';

export default function WorkspaceSidebar({
  user,
  busy,
  onLogout,
  contentReady,
}) {
  const [active, setActive] = useState('overview');
  const links = [
    { id: 'overview', name: 'Overview' },
    ...(user.role === 'admin'
      ? []
      : [
          ...(user.role === 'freelancer'
            ? [{ id: 'earnings', name: 'Earnings' }]
            : []),
          {
            id: 'services',
            name: user.role === 'freelancer' ? 'Your gigs' : 'Find services',
          },
          { id: 'bookings', name: 'Bookings' },
          { id: 'transactions', name: 'Transactions' },
        ]),
  ];

  useEffect(() => {
    const ids =
      user.role === 'admin'
        ? ['overview']
        : [
            'overview',
            ...(user.role === 'freelancer' ? ['earnings', 'create-gig'] : []),
            'services',
            'bookings',
            'transactions',
          ];
    const syncHash = () => {
      const id = window.location.hash.slice(1);
      if (ids.includes(id) && document.getElementById(id)) setActive(id);
    };
    let frame;
    const syncScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = null;
        const sections = ids
          .map((id) => document.getElementById(id))
          .filter(Boolean);
        const passed = sections.filter(
          (section) => section.getBoundingClientRect().top <= 160
        );
        if (passed.length) setActive(passed[passed.length - 1].id);
        else setActive('overview');
      });
    };
    syncHash();
    window.addEventListener('hashchange', syncHash);
    window.addEventListener('scroll', syncScroll, { passive: true });
    return () => {
      window.removeEventListener('hashchange', syncHash);
      window.removeEventListener('scroll', syncScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [user.role, contentReady]);

  const initials = (user.name || '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
  return (
    <aside className="workspace-sidebar">
      <nav aria-label="Workspace navigation">
        {links.map((link) => (
          <a
            key={link.id}
            href={`#${link.id}`}
            aria-current={active === link.id ? 'location' : undefined}
            onClick={() => setActive(link.id)}
          >
            {link.name}
          </a>
        ))}
      </nav>
      {user.role === 'freelancer' && (
        <a
          className="sidebar-create"
          href="#create-gig"
          aria-current={active === 'create-gig' ? 'location' : undefined}
          onClick={() => setActive('create-gig')}
        >
          Create a gig
        </a>
      )}
      <div className="sidebar-account">
        <div className="sidebar-identity">
          <span className="avatar" aria-hidden="true">
            {initials}
          </span>
          <div>
            <strong>{user.name}</strong>
            <small className="role">{user.role} account</small>
          </div>
        </div>
        <button className="sidebar-logout" disabled={busy} onClick={onLogout}>
          Log out
        </button>
      </div>
    </aside>
  );
}
