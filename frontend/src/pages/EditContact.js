import React from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  useGetContactQuery,
  useUpdateContactMutation,
} from "../features/apiSlice";
import { ContactForm } from "../components/contacts";
import { ContactDetailSkeleton } from "../components/ui/Skeleton";
import { usePageTitle } from "../hooks";

const EditContact = () => {
  usePageTitle("Edit Contact");
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    data: contact,
    isLoading: loadingContact,
    error,
  } = useGetContactQuery(id);
  const [updateContact, { isLoading: saving }] = useUpdateContactMutation();

  const onSubmit = async (data) => {
    await updateContact({ id, ...data });
    navigate(`/contacts/${id}`);
  };

  if (loadingContact) return <ContactDetailSkeleton />;

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
      <Link to={`/contacts/${id}`} className="btn-back-link">
        ← Back to Contact
      </Link>
      <ContactForm
        mode="edit"
        defaultValues={{
          first_name: contact.first_name || "",
          last_name: contact.last_name || "",
          email: contact.email || "",
          phone: contact.phone || "",
          company: contact.company || "",
          is_favorite: contact.is_favorite || false,
          personal: {
            nickname: contact.personal?.nickname || "",
            gender: contact.personal?.gender || "",
            dob: contact.personal?.dob || "",
            alt_phone: contact.personal?.alt_phone || "",
          },
          address: {
            street: contact.address?.street || "",
            city: contact.address?.city || "",
            state: contact.address?.state || "",
            zip: contact.address?.zip || "",
            country: contact.address?.country || "",
          },
          professional: {
            role: contact.professional?.role || "",
            website: contact.professional?.website || "",
            linkedin: contact.professional?.linkedin || "",
            notes: contact.professional?.notes || "",
          },
        }}
        onSubmit={onSubmit}
        isSubmitting={saving}
      />
    </div>
  );
};

export default EditContact;
