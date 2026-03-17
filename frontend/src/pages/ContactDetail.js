import React from "react";
import { useParams, Link } from "react-router-dom";
import { useGetContactsQuery } from "../features/apiSlice";
import { getInitials } from "../hooks/useContactHelpers";
import { ContactDetailSkeleton } from "../components/ui/Skeleton";
import { trackContactViewed } from "../analytics";

const ContactDetail = () => {
  const { id } = useParams();
  const { data: contacts = [], isLoading } = useGetContactsQuery();
  const contact = contacts.find((c) => String(c.id) === id);

  React.useEffect(() => {
    if (contact) trackContactViewed(id);
  }, [id, contact]);

  if (isLoading) {
    return <ContactDetailSkeleton />;
  }

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
      <Link to="/" className="btn-back" aria-label="Back to Contacts">
        &larr; Back to Contacts
      </Link>
    </div>
  );
};

export default ContactDetail;
