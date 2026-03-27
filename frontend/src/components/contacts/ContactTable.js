import React from "react";
import ContactTableRow from "./ContactTableRow";

const columns = ["Name", "Email", "Phone", "Company", "Actions"];

const ContactTable = ({ contacts, onDelete }) => {
  if (!contacts || contacts.length === 0) return null;

  return (
    <div className="contact-table-wrapper">
      <table className="contact-table" role="table">
        <thead>
          <tr className="contact-table-header">
            {columns.map((col) => (
              <th key={col} className="contact-table-th">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {contacts.map((contact) => (
            <ContactTableRow
              key={contact.id}
              contact={contact}
              onDelete={onDelete}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ContactTable;
