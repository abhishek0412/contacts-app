import React from "react";
import { Link } from "react-router-dom";
import {
  useGetContactStatsQuery,
  useGetContactsQuery,
} from "../features/apiSlice";
import { StatsCards } from "../components/contacts";
import { getFullName, getInitials } from "../hooks/useContactHelpers";
import { usePageTitle } from "../hooks";

const Dashboard = () => {
  usePageTitle("Dashboard");
  const { data } = useGetContactsQuery({ page: 1, limit: 5 });
  const recentContacts = data?.contacts || [];

  return (
    <div>
      <StatsCards />

      <div className="glass-card">
        <div className="section-header">
          <h2 className="section-title">Recently Added</h2>
          <Link to="/" className="section-link">
            View all →
          </Link>
        </div>
        {recentContacts.length === 0 ? (
          <div className="empty-state">
            No contacts yet. <Link to="/add">Add your first contact</Link>
          </div>
        ) : (
          <div className="recent-contacts-list">
            {recentContacts.map((contact) => (
              <Link
                key={contact.id}
                to={`/contacts/${contact.id}`}
                className="recent-contact-item"
              >
                <div className="contact-avatar">{getInitials(contact)}</div>
                <div className="recent-contact-info">
                  <span className="recent-contact-name">
                    {getFullName(contact)}
                  </span>
                  <span className="recent-contact-meta">
                    {[contact.email, contact.company]
                      .filter(Boolean)
                      .join(" · ") || contact.phone}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
