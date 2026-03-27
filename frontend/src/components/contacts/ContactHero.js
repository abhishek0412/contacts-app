import React from "react";
import { Link } from "react-router-dom";
import {
  getFullName,
  getInitials,
  getNestedField,
} from "../../hooks/useContactHelpers";

const ContactHero = ({ contact }) => {
  const name = getFullName(contact);
  const initials = getInitials(contact);
  const role = getNestedField(contact, "professional", "role");
  const company = contact.company;

  return (
    <div className="contact-hero glass-card">
      <div className="hero-left">
        <div className="hero-avatar">{initials}</div>
        <div className="hero-info">
          <h2 className="hero-name">{name}</h2>
          {(role || company) && (
            <p className="hero-role">
              {role}
              {role && company ? " at " : ""}
              {company}
            </p>
          )}
          <div className="hero-contacts">
            {contact.email && (
              <span className="hero-email">{contact.email}</span>
            )}
            {contact.phone && (
              <span className="hero-phone">{contact.phone}</span>
            )}
          </div>
          <span className="hero-badge">● Active</span>
        </div>
      </div>
      <div className="hero-actions">
        <Link
          to={`/contacts/${contact.id}/edit`}
          className="btn-hero btn-hero-edit"
        >
          ✏️ Edit
        </Link>
      </div>
    </div>
  );
};

export default ContactHero;
