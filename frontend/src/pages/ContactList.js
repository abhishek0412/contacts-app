import React, { useState } from "react";
import {
  useGetContactsQuery,
  useDeleteContactMutation,
} from "../features/apiSlice";
import { StatsCards, ContactTable } from "../components/contacts";
import Pagination from "../components/Pagination";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import { ContactListSkeleton } from "../components/ui/Skeleton";
import { usePageTitle } from "../hooks";
import {
  trackContactDeleted,
  trackDeleteConfirmed,
  trackDeleteCancelled,
  trackPageChange,
} from "../analytics";

const CONTACTS_PER_PAGE = 6;

const ContactList = () => {
  usePageTitle("Contacts");
  const [currentPage, setCurrentPage] = useState(1);
  const { data, isLoading, error } = useGetContactsQuery({
    page: currentPage,
    limit: CONTACTS_PER_PAGE,
  });
  const [deleteContact] = useDeleteContactMutation();
  const [deleteId, setDeleteId] = useState(null);

  const contacts = data?.contacts || [];
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 1;

  const handleDelete = () => {
    if (deleteId !== null) {
      deleteContact(deleteId);
      trackContactDeleted();
      trackDeleteConfirmed();
      setDeleteId(null);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    trackPageChange(page, totalPages);
  };

  if (isLoading) return <ContactListSkeleton />;

  if (error) {
    return (
      <div className="error-message" role="alert">
        Failed to load contacts.
      </div>
    );
  }

  return (
    <div>
      <StatsCards />

      <div className="glass-card contact-list-section">
        <h2 className="section-title">All Contacts</h2>

        {contacts.length === 0 ? (
          <div className="empty-state" role="status">
            No contacts yet. Add one!
          </div>
        ) : (
          <>
            <ContactTable contacts={contacts} onDelete={setDeleteId} />
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={total}
              itemsPerPage={CONTACTS_PER_PAGE}
              onPageChange={handlePageChange}
            />
          </>
        )}
      </div>

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
