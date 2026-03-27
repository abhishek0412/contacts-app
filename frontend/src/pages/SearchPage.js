import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useSearchContactsQuery } from "../features/apiSlice";
import { getFullName, getInitials } from "../hooks/useContactHelpers";
import { usePageTitle } from "../hooks";
import { trackSearch } from "../analytics";

const FILTER_OPTIONS = [
  { key: "all", label: "All" },
  { key: "name", label: "Name" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
  { key: "company", label: "Company" },
  { key: "city", label: "City" },
];

const RECENT_KEY = "contact_recent_searches";
const MAX_RECENT = 5;

const getRecentSearches = () => {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
  } catch {
    return [];
  }
};

const saveRecentSearch = (term) => {
  const recent = getRecentSearches().filter((s) => s !== term);
  recent.unshift(term);
  localStorage.setItem(RECENT_KEY, JSON.stringify(recent.slice(0, MAX_RECENT)));
};

const SearchPage = () => {
  usePageTitle("Search");
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQ = searchParams.get("q") || "";
  const [query, setQuery] = useState(initialQ);
  const [activeFilter, setActiveFilter] = useState("all");
  const [recentSearches, setRecentSearches] = useState(getRecentSearches);

  const shouldSearch = query.trim().length >= 2;
  const { data: results = [], isFetching } = useSearchContactsQuery(
    { q: query.trim(), field: activeFilter },
    { skip: !shouldSearch },
  );

  const handleSearch = useCallback(
    (e) => {
      e.preventDefault();
      const q = query.trim();
      if (q.length >= 2) {
        setSearchParams({ q, field: activeFilter });
        saveRecentSearch(q);
        setRecentSearches(getRecentSearches());
        trackSearch(q);
      }
    },
    [query, activeFilter, setSearchParams],
  );

  // Sync URL params to state
  useEffect(() => {
    const q = searchParams.get("q");
    if (q && q !== query) setQuery(q);
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="search-page">
      <form className="search-page-bar" onSubmit={handleSearch}>
        <span className="search-page-icon">🔍</span>
        <input
          type="search"
          className="search-page-input"
          placeholder="Search contacts by name, email, phone, company, city..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          // eslint-disable-next-line jsx-a11y/no-autofocus
          autoFocus
        />
      </form>

      <div className="filter-chips">
        {FILTER_OPTIONS.map(({ key, label }) => (
          <button
            key={key}
            className={`filter-chip${activeFilter === key ? " active" : ""}`}
            onClick={() => setActiveFilter(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {isFetching && <div className="search-loading">Searching...</div>}

      {shouldSearch && !isFetching && results.length === 0 && (
        <div className="empty-state">No contacts match "{query}"</div>
      )}

      {results.length > 0 && (
        <div className="search-results">
          {results.map((contact) => (
            <Link
              key={contact.id}
              to={`/contacts/${contact.id}`}
              className="search-result-card glass-card"
            >
              <div className="contact-avatar">{getInitials(contact)}</div>
              <div className="search-result-info">
                <span className="search-result-name">
                  {getFullName(contact)}
                </span>
                <span className="search-result-meta">
                  {[contact.email, contact.phone, contact.company]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </div>
              {activeFilter !== "all" && activeFilter !== "name" && (
                <span className="search-match-badge">
                  {activeFilter.charAt(0).toUpperCase() + activeFilter.slice(1)}{" "}
                  match
                </span>
              )}
            </Link>
          ))}
        </div>
      )}

      {!shouldSearch && recentSearches.length > 0 && (
        <div className="recent-searches">
          <h3 className="recent-title">Recent Searches</h3>
          {recentSearches.map((term) => (
            <button
              key={term}
              className="recent-item"
              onClick={() => {
                setQuery(term);
                setSearchParams({ q: term, field: activeFilter });
              }}
            >
              🕒 {term}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchPage;
