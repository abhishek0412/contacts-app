import React from "react";
import { Link } from "react-router-dom";
import { getFullName, getInitials } from "../../hooks/useContactHelpers";

const ContactTableRow = ({ contact, onDelete }) => {
  const name = getFullName(contact);
  const initials = getInitials(contact);

  return (
    <tr className="contact-table-row">
      <td className="contact-table-cell contact-table-name">
        <Link to={`/contacts/${contact.id}`} className="contact-name-link">
          <div className="contact-avatar">{initials}</div>
          <span>{name}</span>
        </Link>
      </td>
      <td className="contact-table-cell">{contact.email || "—"}</td>
      <td className="contact-table-cell">{contact.phone}</td>
      <td className="contact-table-cell">{contact.company || "—"}</td>
      <td className="contact-table-cell contact-table-actions">
        <Link
          to={`/contacts/${contact.id}`}
          className="action-icon action-view"
          aria-label={`View ${name}`}
          title="View"
        >
          👁
        </Link>
        <Link
          to={`/contacts/${contact.id}/edit`}
          className="action-icon action-edit"
          aria-label={`Edit ${name}`}
          title="Edit"
        >
          ✏️
        </Link>
        <button
          className="action-icon action-delete"
          aria-label={`Delete ${name}`}
          title="Delete"
          onClick={() => onDelete(contact.id)}
        >
          🗑
        </button>
      </td>
    </tr>
  );
};

export default ContactTableRow;
