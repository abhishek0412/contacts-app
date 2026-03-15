import React, { useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { removeContact } from "../features/contactsSlice";
import { getInitials } from "../hooks/useContactHelpers";
import ConfirmDialog from "./ConfirmDialog";

const CONTACTS_PER_PAGE = 5;

const ContactList = () => {
  const dispatch = useDispatch();
  const { contacts } = useSelector((state) => state.contacts);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteId, setDeleteId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const filteredContacts = useMemo(() => {
    if (!searchTerm) return contacts;
    const term = searchTerm.toLowerCase();
    return contacts.filter(
      (c) => c.name.toLowerCase().includes(term) || c.phone.includes(term),
    );
  }, [contacts, searchTerm]);

  const totalPages = Math.ceil(filteredContacts.length / CONTACTS_PER_PAGE);

  const paginatedContacts = useMemo(() => {
    const start = (currentPage - 1) * CONTACTS_PER_PAGE;
    return filteredContacts.slice(start, start + CONTACTS_PER_PAGE);
  }, [filteredContacts, currentPage]);

  // Reset to page 1 when search changes
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleDelete = () => {
    if (deleteId !== null) {
      dispatch(removeContact(deleteId));
      setDeleteId(null);
    }
  };

  const renderContactList = paginatedContacts.map((contact) => {
    return (
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
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setDeleteId(contact.id);
          }}
        >
          &#x1f5d1;
        </button>
      </Link>
    );
  });

  return (
    <div className="glass-card contact-list-card">
      <h2>Contacts</h2>
      <input
        type="text"
        className="search-input"
        placeholder="Search contacts..."
        value={searchTerm}
        onChange={handleSearch}
      />
      {filteredContacts.length === 0 ? (
        <div className="empty-state">
          {contacts.length === 0
            ? "No contacts yet. Add one!"
            : "No contacts match your search."}
        </div>
      ) : (
        <>
          {renderContactList}
          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="page-btn"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
              >
                &laquo; Prev
              </button>
              <span className="page-info">
                {currentPage} / {totalPages}
              </span>
              <button
                className="page-btn"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
              >
                Next &raquo;
              </button>
            </div>
          )}
        </>
      )}
      {deleteId !== null && (
        <ConfirmDialog
          message="Are you sure you want to delete this contact?"
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </div>
  );
};

export default ContactList;
