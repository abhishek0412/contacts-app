import React from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  useGetContactQuery,
  useDeleteContactMutation,
} from "../features/apiSlice";
import { ContactHero, ContactInfoGrid } from "../components/contacts";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import { ContactDetailSkeleton } from "../components/ui/Skeleton";
import { usePageTitle } from "../hooks";
import {
  trackContactViewed,
  trackContactDeleted,
  trackDeleteConfirmed,
  trackDeleteCancelled,
} from "../analytics";

const ContactDetail = () => {
  usePageTitle("Contact Detail");
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: contact, isLoading, error } = useGetContactQuery(id);
  const [deleteContact] = useDeleteContactMutation();
  const [showDelete, setShowDelete] = React.useState(false);

  React.useEffect(() => {
    if (contact) trackContactViewed(id);
  }, [id, contact]);

  const handleDelete = async () => {
    await deleteContact(id);
    trackContactDeleted();
    trackDeleteConfirmed();
    navigate("/");
  };

  if (isLoading) return <ContactDetailSkeleton />;

  if (error || !contact) {
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
      <Link to="/" className="btn-back-link">
        ← Back to Contacts
      </Link>

      <ContactHero contact={contact} />

      <div className="detail-delete-bar">
        <button
          className="btn-hero btn-hero-delete"
          onClick={() => setShowDelete(true)}
        >
          🗑 Delete
        </button>
      </div>

      <ContactInfoGrid contact={contact} />

      {showDelete && (
        <ConfirmDialog
          message="Are you sure you want to delete this contact? This action cannot be undone."
          onConfirm={handleDelete}
          onCancel={() => {
            trackDeleteCancelled();
            setShowDelete(false);
          }}
        />
      )}
    </div>
  );
};

export default ContactDetail;
