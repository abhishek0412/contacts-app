import React from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAddContactMutation } from "../features/apiSlice";
import { trackContactAdded } from "../analytics";

const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z
    .string()
    .min(10, "Phone number must be at least 10 characters")
    .regex(/^[\d\s()+-]+$/, "Invalid phone number format"),
});

const AddContacts = () => {
  const [addContact, { isLoading }] = useAddContactMutation();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(contactSchema),
  });

  const onSubmit = async (data) => {
    await addContact(data);
    trackContactAdded();
    navigate("/");
  };

  return (
    <div className="glass-card add-contact-card">
      <h2>Add Contact</h2>
      <form onSubmit={handleSubmit(onSubmit)} aria-busy={isLoading}>
        <div className="form-group">
          <label htmlFor="name" className="sr-only">
            Name
          </label>
          <input
            id="name"
            type="text"
            placeholder="Name"
            aria-required="true"
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? "name-error" : undefined}
            {...register("name")}
            className={errors.name ? "input-error" : ""}
          />
          {errors.name && (
            <span id="name-error" className="field-error" role="alert">
              {errors.name.message}
            </span>
          )}
        </div>
        <div className="form-group">
          <label htmlFor="phone" className="sr-only">
            Phone Number
          </label>
          <input
            id="phone"
            type="tel"
            placeholder="Phone Number"
            aria-required="true"
            aria-invalid={!!errors.phone}
            aria-describedby={errors.phone ? "phone-error" : undefined}
            {...register("phone")}
            className={errors.phone ? "input-error" : ""}
          />
          {errors.phone && (
            <span id="phone-error" className="field-error" role="alert">
              {errors.phone.message}
            </span>
          )}
        </div>
        <button className="btn-add" type="submit" disabled={isLoading}>
          {isLoading ? "Adding..." : "Add Contact"}
        </button>
      </form>
    </div>
  );
};

export default AddContacts;
