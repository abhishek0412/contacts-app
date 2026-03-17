import React from "react";
import { Link, NavLink } from "react-router-dom";
import { useGetContactsQuery } from "../features/apiSlice";
import { useAuth } from "../contexts/AuthContext";

const Header = () => {
  const { data: contacts = [] } = useGetContactsQuery();
  const { user, logout } = useAuth();

  return (
    <header className="app-header">
      <Link to="/" className="header-title">
        <img src="/logo.png" alt="Contact Manager" className="header-logo" />
        <h2>Contact Manager</h2>
      </Link>
      <nav className="header-nav" aria-label="Main navigation">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            isActive ? "nav-link active" : "nav-link"
          }
          aria-current={({ isActive }) => (isActive ? "page" : undefined)}
        >
          Contacts{" "}
          <span className="badge" aria-label={`${contacts.length} total`}>
            {contacts.length}
          </span>
        </NavLink>
        <NavLink
          to="/add"
          className={({ isActive }) =>
            isActive ? "nav-link active" : "nav-link"
          }
          aria-current={({ isActive }) => (isActive ? "page" : undefined)}
        >
          Add New
        </NavLink>
        {user && (
          <button className="nav-link logout-btn" onClick={logout}>
            Logout
          </button>
        )}
      </nav>
    </header>
  );
};

export default Header;
