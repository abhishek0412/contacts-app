import React from "react";
import { useSelector } from "react-redux";
import { useParams, Link } from "react-router-dom";
import { getInitials } from "../hooks/useContactHelpers";

const ContactDetail = () => {
  const { id } = useParams();
  const contact = useSelector((state) =>
    state.contacts.contacts.find((c) => String(c.id) === id),
  );

  if (!contact) {
    return (
      <div className="glass-card" style={{ textAlign: "center" }}>
        <h2>Contact not found</h2>
        <Link to="/" className="btn-back">
          Back to Contacts
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="contact-detail-card">
        <div className="detail-avatar">{getInitials(contact.name)}</div>
        <h3>{contact.name}</h3>
        <p>{contact.phone}</p>
        {contact.email && <p>{contact.email}</p>}
      </div>
      <Link to="/" className="btn-back">
        &larr; Back to Contacts
      </Link>
    </div>
  );
};

export default ContactDetail;
