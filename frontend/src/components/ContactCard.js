import React from "react";

const ContactCard = (props) => {
  const { name, phone } = props.contact;
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="contact-detail-card">
      <div className="detail-avatar">{initials}</div>
      <h3>{name}</h3>
      <p>{phone}</p>
    </div>
  );
};

export default ContactCard;
