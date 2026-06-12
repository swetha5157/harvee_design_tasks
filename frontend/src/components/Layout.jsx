import { NavLink, Outlet } from 'react-router-dom'

const links = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/students', label: 'Students' },
  { to: '/courses', label: 'Courses' },
  { to: '/allocations', label: 'Allocations' },
  { to: '/ai-assistant', label: 'AI Assistant' },
  { to: '/analytics', label: 'SQL Analytics' }
]

export default function Layout() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">Harvee Task</p>
          <h1>Course Allocation & Analytics</h1>
        </div>
      </header>

      <nav className="app-nav">
        {links.map(link => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
          >
            {link.label}
          </NavLink>
        ))}
      </nav>

      <main className="app-main">
        <Outlet />
      </main>
    </div>
  )
}
