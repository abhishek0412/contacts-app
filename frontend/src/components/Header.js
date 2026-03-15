import React from "react";
import { Link, NavLink } from "react-router-dom";
import { useGetContactsQuery } from "../features/apiSlice";

const Header = () => {
  const { data: contacts = [] } = useGetContactsQuery();

  return (
    <div className="app-header">
      <Link to="/" className="header-title">
        <img src="/logo.png" alt="Contact Manager" className="header-logo" />
        <h2>Contact Manager</h2>
      </Link>
      <nav className="header-nav">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            isActive ? "nav-link active" : "nav-link"
          }
        >
          Contacts <span className="badge">{contacts.length}</span>
        </NavLink>
        <NavLink
          to="/add"
          className={({ isActive }) =>
            isActive ? "nav-link active" : "nav-link"
          }
        >
          Add New
        </NavLink>
      </nav>
    </div>
  );
};

export default Header;
