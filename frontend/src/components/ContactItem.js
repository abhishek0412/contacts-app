import React from "react";
import { Link } from "react-router-dom";
import { getInitials } from "../hooks/useContactHelpers";

const ContactItem = ({ contact, onDelete }) => (
  <Link
    to={`/contacts/${contact.id}`}
    className="contact-item"
    key={contact.id}
  >
    <div className="contact-info">
      <div className="contact-avatar">{getInitials(contact.name)}</div>
      <div className="contact-details">
        <h3>{contact.name}</h3>
        <p>{contact.phone}</p>
      </div>
    </div>
    <button
      className="btn-delete"
      aria-label={`Delete ${contact.name}`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onDelete(contact.id);
      }}
    >
      &#x1f5d1;
    </button>
  </Link>
);

export default ContactItem;
