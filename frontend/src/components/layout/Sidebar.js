import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useGetContactStatsQuery } from "../../features";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: "📊" },
  { to: "/", label: "Contacts", icon: "👥", end: true },
  { to: "/add", label: "Add New", icon: "＋" },
  { to: "/search", label: "Search", icon: "🔍" },
  { to: "/profile", label: "My Profile", icon: "👤" },
  { to: "/settings", label: "Settings", icon: "⚙" },
];

const Sidebar = () => {
  const { logout } = useAuth();
  const { data: stats } = useGetContactStatsQuery();

  return (
    <aside className="sidebar" role="navigation" aria-label="Main navigation">
      <div className="sidebar-brand">
        <div className="sidebar-logo">CM</div>
        <span className="sidebar-title">Contact Manager</span>
      </div>

      <nav className="sidebar-nav">
        {navItems.map(({ to, label, icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `sidebar-item${isActive ? " active" : ""}`
            }
          >
            <span className="sidebar-icon">{icon}</span>
            <span className="sidebar-label">{label}</span>
            {label === "Contacts" && stats?.total != null && (
              <span className="sidebar-badge">{stats.total}</span>
            )}
          </NavLink>
        ))}
      </nav>

      <button className="sidebar-item sidebar-logout" onClick={logout}>
        <span className="sidebar-icon">🚪</span>
        <span className="sidebar-label">Logout</span>
      </button>
    </aside>
  );
};

export default Sidebar;
