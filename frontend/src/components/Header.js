import React from "react";
import { useSelector } from "react-redux";
import { Link, NavLink } from "react-router-dom";

const Header = () => {
  const { contacts } = useSelector((state) => state.contacts);

  return (
    <div className="app-header">
      <Link to="/" className="header-title">
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
