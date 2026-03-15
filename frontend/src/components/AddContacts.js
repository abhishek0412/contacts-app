import React from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { addContact } from "../features/contactsSlice";

const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z
    .string()
    .min(10, "Phone number must be at least 10 characters")
    .regex(/^[\d\s()+-]+$/, "Invalid phone number format"),
});

const AddContacts = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(contactSchema),
  });

  const onSubmit = (data) => {
    dispatch(addContact(data));
    navigate("/");
  };

  return (
    <div className="glass-card add-contact-card">
      <h2>Add Contact</h2>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="form-group">
          <input
            type="text"
            placeholder="Name"
            {...register("name")}
            className={errors.name ? "input-error" : ""}
          />
          {errors.name && (
            <span className="field-error">{errors.name.message}</span>
          )}
        </div>
        <div className="form-group">
          <input
            type="text"
            placeholder="Phone Number"
            {...register("phone")}
            className={errors.phone ? "input-error" : ""}
          />
          {errors.phone && (
            <span className="field-error">{errors.phone.message}</span>
          )}
        </div>
        <button className="btn-add" type="submit">
          Add Contact
        </button>
      </form>
    </div>
  );
};

export default AddContacts;
