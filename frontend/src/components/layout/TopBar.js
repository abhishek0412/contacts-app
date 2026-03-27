import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { usePageTitle } from "../../hooks";
import { getInitials } from "../../hooks/useContactHelpers";

const TopBar = () => {
  const { title } = usePageTitle();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState("");

  const handleSearch = (e) => {
    e.preventDefault();
    const q = searchValue.trim();
    if (q) {
      navigate(`/search?q=${encodeURIComponent(q)}`);
      setSearchValue("");
    }
  };

  const displayName = user?.displayName || user?.email || "User";
  const initials = getInitials(displayName);

  return (
    <header className="topbar">
      <h1 className="topbar-title">{title}</h1>

      <div className="topbar-actions">
        <form className="topbar-search" onSubmit={handleSearch}>
          <span className="topbar-search-icon">🔍</span>
          <input
            type="search"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Search anything..."
            className="topbar-search-input"
            aria-label="Global search"
          />
        </form>

        <button className="topbar-notification" aria-label="Notifications">
          🔔
        </button>

        <div
          className="topbar-avatar"
          title={displayName}
          aria-label={`Logged in as ${displayName}`}
        >
          {initials}
        </div>
      </div>
    </header>
  );
};

export default TopBar;
