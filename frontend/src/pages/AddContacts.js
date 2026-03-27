import React from "react";
import { useNavigate } from "react-router-dom";
import { useAddContactMutation } from "../features/apiSlice";
import { ContactForm } from "../components/contacts";
import { usePageTitle } from "../hooks";
import { trackContactAdded } from "../analytics";

const AddContacts = () => {
  usePageTitle("Add New Contact");
  const [addContact, { isLoading }] = useAddContactMutation();
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    await addContact(data);
    trackContactAdded();
    navigate("/");
  };

  return (
    <div>
      <ContactForm mode="create" onSubmit={onSubmit} isSubmitting={isLoading} />
    </div>
  );
};

export default AddContacts;
