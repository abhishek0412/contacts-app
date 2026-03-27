import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { contactSchema, contactUpdateSchema } from "../../schemas/contact";

/**
 * Shared form for Add + Edit contact.
 * - mode="create": all required fields enforced
 * - mode="edit": partial updates allowed, prefilled with defaultValues
 */

const FormField = ({
  id,
  label,
  register,
  error,
  type = "text",
  placeholder,
  ...rest
}) => (
  <div className="form-field">
    <label htmlFor={id} className="form-field-label">
      {label}
    </label>
    <input
      id={id}
      type={type}
      placeholder={placeholder || label}
      aria-invalid={!!error}
      aria-describedby={error ? `${id}-error` : undefined}
      className={`form-field-input${error ? " input-error" : ""}`}
      {...register}
      {...rest}
    />
    {error && (
      <span id={`${id}-error`} className="field-error" role="alert">
        {error.message}
      </span>
    )}
  </div>
);

const FormSelect = ({ id, label, register, error, options }) => (
  <div className="form-field">
    <label htmlFor={id} className="form-field-label">
      {label}
    </label>
    <select
      id={id}
      className={`form-field-input form-field-select${error ? " input-error" : ""}`}
      aria-invalid={!!error}
      {...register}
    >
      <option value="">Select...</option>
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
    {error && (
      <span id={`${id}-error`} className="field-error" role="alert">
        {error.message}
      </span>
    )}
  </div>
);

const FormTextarea = ({ id, label, register, error, placeholder }) => (
  <div className="form-field form-field-full">
    <label htmlFor={id} className="form-field-label">
      {label}
    </label>
    <textarea
      id={id}
      rows={3}
      placeholder={placeholder || label}
      className={`form-field-input form-field-textarea${error ? " input-error" : ""}`}
      aria-invalid={!!error}
      {...register}
    />
    {error && (
      <span id={`${id}-error`} className="field-error" role="alert">
        {error.message}
      </span>
    )}
  </div>
);

const ContactForm = ({
  mode = "create",
  defaultValues,
  onSubmit,
  isSubmitting,
}) => {
  const schema = mode === "edit" ? contactUpdateSchema : contactSchema;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: defaultValues || {
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      company: "",
      personal: { nickname: "", gender: "", dob: "", alt_phone: "" },
      address: { street: "", city: "", state: "", zip: "", country: "" },
      professional: { role: "", website: "", linkedin: "", notes: "" },
    },
  });

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      aria-busy={isSubmitting}
      className="contact-form"
    >
      {/* Personal Information */}
      <div className="form-section glass-card">
        <h3 className="form-section-title">Personal Information</h3>
        <div className="form-section-grid">
          <FormField
            id="first_name"
            label="First Name"
            register={register("first_name")}
            error={errors.first_name}
            placeholder="John"
          />
          <FormField
            id="last_name"
            label="Last Name"
            register={register("last_name")}
            error={errors.last_name}
            placeholder="Doe"
          />
          <FormField
            id="personal.dob"
            label="Date of Birth"
            register={register("personal.dob")}
            error={errors.personal?.dob}
            placeholder="MM/DD/YYYY"
          />
          <FormField
            id="personal.nickname"
            label="Nickname"
            register={register("personal.nickname")}
            error={errors.personal?.nickname}
            placeholder="Optional"
          />
          <FormSelect
            id="personal.gender"
            label="Gender"
            register={register("personal.gender")}
            error={errors.personal?.gender}
            options={["Male", "Female", "Other"]}
          />
        </div>
      </div>

      {/* Contact Information */}
      <div className="form-section glass-card">
        <h3 className="form-section-title">Contact Information</h3>
        <div className="form-section-grid">
          <FormField
            id="email"
            label="Email Address"
            register={register("email")}
            error={errors.email}
            type="email"
            placeholder="you@example.com"
          />
          <FormField
            id="phone"
            label="Phone Number"
            register={register("phone")}
            error={errors.phone}
            type="tel"
            placeholder="+91 ..."
          />
          <FormField
            id="personal.alt_phone"
            label="Alt Phone"
            register={register("personal.alt_phone")}
            error={errors.personal?.alt_phone}
            type="tel"
            placeholder="Optional"
          />
          <FormField
            id="professional.website"
            label="Website"
            register={register("professional.website")}
            error={errors.professional?.website}
            placeholder="https://..."
          />
        </div>
      </div>

      {/* Address */}
      <div className="form-section glass-card">
        <h3 className="form-section-title">Address</h3>
        <div className="form-section-grid">
          <div className="form-field form-field-full">
            <label htmlFor="address.street" className="form-field-label">
              Street Address
            </label>
            <input
              id="address.street"
              placeholder="123 Main St"
              className="form-field-input"
              {...register("address.street")}
            />
          </div>
          <FormField
            id="address.city"
            label="City"
            register={register("address.city")}
            error={errors.address?.city}
            placeholder="City"
          />
          <FormField
            id="address.state"
            label="State"
            register={register("address.state")}
            error={errors.address?.state}
            placeholder="State"
          />
          <FormField
            id="address.zip"
            label="Zip"
            register={register("address.zip")}
            error={errors.address?.zip}
            placeholder="Zip"
          />
          <FormField
            id="address.country"
            label="Country"
            register={register("address.country")}
            error={errors.address?.country}
            placeholder="Country"
          />
        </div>
      </div>

      {/* Professional & Notes */}
      <div className="form-section glass-card">
        <h3 className="form-section-title">Professional & Notes</h3>
        <div className="form-section-grid">
          <FormField
            id="company"
            label="Company"
            register={register("company")}
            error={errors.company}
            placeholder="Company name"
          />
          <FormField
            id="professional.role"
            label="Role / Title"
            register={register("professional.role")}
            error={errors.professional?.role}
            placeholder="Job title"
          />
          <FormTextarea
            id="professional.notes"
            label="Notes"
            register={register("professional.notes")}
            error={errors.professional?.notes}
            placeholder="Add any additional notes..."
          />
        </div>
      </div>

      {/* Actions */}
      <div className="form-actions">
        <button
          type="button"
          className="btn-cancel"
          onClick={() => window.history.back()}
        >
          Cancel
        </button>
        <button type="submit" className="btn-add" disabled={isSubmitting}>
          {isSubmitting
            ? mode === "edit"
              ? "Saving..."
              : "Adding..."
            : mode === "edit"
              ? "Save Contact"
              : "Save Contact"}
        </button>
      </div>
    </form>
  );
};

export default ContactForm;
