import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  useGetContactsQuery,
  useDeleteContactMutation,
} from "../features/apiSlice";
import { getInitials } from "../hooks/useContactHelpers";
import ConfirmDialog from "../components/ui/ConfirmDialog";

const CONTACTS_PER_PAGE = 5;

const ContactList = () => {
  const { data: contacts = [], isLoading, error } = useGetContactsQuery();
  const [deleteContact] = useDeleteContactMutation();
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
      deleteContact(deleteId);
      setDeleteId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="loading-spinner" role="status">
        Loading contacts...
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-message" role="alert">
        Failed to load contacts.
      </div>
    );
  }

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
          aria-label={`Delete ${contact.name}`}
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
        aria-label="Search contacts"
        value={searchTerm}
        onChange={handleSearch}
      />
      {filteredContacts.length === 0 ? (
        <div className="empty-state" role="status">
          {contacts.length === 0
            ? "No contacts yet. Add one!"
            : "No contacts match your search."}
        </div>
      ) : (
        <>
          {renderContactList}
          {totalPages > 1 && (
            <div
              className="pagination"
              role="navigation"
              aria-label="Pagination"
            >
              <button
                className="page-btn"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                aria-label="Previous page"
              >
                &laquo; Prev
              </button>
              <span className="page-info" aria-current="page">
                Page {currentPage} of {totalPages}
              </span>
              <button
                className="page-btn"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                aria-label="Next page"
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
