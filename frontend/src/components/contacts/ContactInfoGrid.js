import React from "react";
import { getNestedField } from "../../hooks/useContactHelpers";

const InfoField = ({ label, value }) => {
  if (!value) return null;
  return (
    <div className="info-field">
      <span className="info-label">{label}</span>
      <span className="info-value">{value}</span>
    </div>
  );
};

const InfoCard = ({ title, children }) => (
  <div className="info-card glass-card">
    <h3 className="info-card-title">{title}</h3>
    <div className="info-card-body">{children}</div>
  </div>
);

const ContactInfoGrid = ({ contact }) => {
  const p = contact.personal || {};
  const a = contact.address || {};
  const pr = contact.professional || {};

  return (
    <div className="info-grid">
      <InfoCard title="Personal Information">
        <InfoField label="First Name" value={contact.first_name} />
        <InfoField label="Last Name" value={contact.last_name} />
        <InfoField label="Date of Birth" value={p.dob} />
        <InfoField label="Gender" value={p.gender} />
        <InfoField label="Nickname" value={p.nickname} />
      </InfoCard>

      <InfoCard title="Contact Information">
        <InfoField label="Email" value={contact.email} />
        <InfoField label="Phone" value={contact.phone} />
        <InfoField label="Alt Phone" value={p.alt_phone} />
        <InfoField label="Website" value={pr.website} />
        <InfoField label="LinkedIn" value={pr.linkedin} />
      </InfoCard>

      <InfoCard title="Address">
        <InfoField label="Street" value={a.street} />
        <InfoField
          label="City / State"
          value={[a.city, a.state].filter(Boolean).join(", ")}
        />
        <InfoField label="Zip" value={a.zip} />
        <InfoField label="Country" value={a.country} />
      </InfoCard>

      <InfoCard title="Professional & Notes">
        <InfoField label="Company" value={contact.company} />
        <InfoField label="Role" value={pr.role} />
        <InfoField label="Notes" value={pr.notes} />
      </InfoCard>
    </div>
  );
};

export default ContactInfoGrid;
