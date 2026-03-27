import React, { useState, useMemo } from "react";
import {
  useGetContactsQuery,
  useDeleteContactMutation,
} from "../features/apiSlice";
import SearchInput from "../components/SearchInput";
import Pagination from "../components/Pagination";
import ContactItem from "../components/ContactItem";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import { ContactListSkeleton } from "../components/ui/Skeleton";
import {
  trackSearch,
  trackContactDeleted,
  trackDeleteConfirmed,
  trackDeleteCancelled,
  trackPageChange,
} from "../analytics";

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
    const value = e.target.value;
    setSearchTerm(value);
    setCurrentPage(1);
    if (value.length >= 2) trackSearch(value);
  };

  const handleDelete = () => {
    if (deleteId !== null) {
      deleteContact(deleteId);
      trackContactDeleted();
      trackDeleteConfirmed();
      setDeleteId(null);
    }
  };

  if (isLoading) {
    return <ContactListSkeleton />;
  }

  if (error) {
    return (
      <div className="error-message" role="alert">
        Failed to load contacts.
      </div>
    );
  }

  return (
    <div className="glass-card contact-list-card">
      <h2>Contacts</h2>
      <SearchInput value={searchTerm} onChange={handleSearch} />
      {filteredContacts.length === 0 ? (
        <div className="empty-state" role="status">
          {contacts.length === 0
            ? "No contacts yet. Add one!"
            : "No contacts match your search."}
        </div>
      ) : (
        <>
          {paginatedContacts.map((contact) => (
            <ContactItem
              key={contact.id}
              contact={contact}
              onDelete={setDeleteId}
            />
          ))}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPrev={() => {
              setCurrentPage((p) => p - 1);
              trackPageChange(currentPage - 1, totalPages);
            }}
            onNext={() => {
              setCurrentPage((p) => p + 1);
              trackPageChange(currentPage + 1, totalPages);
            }}
          />
        </>
      )}
      {deleteId !== null && (
        <ConfirmDialog
          message="Are you sure you want to delete this contact?"
          onConfirm={handleDelete}
          onCancel={() => {
            trackDeleteCancelled();
            setDeleteId(null);
          }}
        />
      )}
    </div>
  );
};

export default ContactList;
