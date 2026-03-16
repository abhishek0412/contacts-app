import React from "react";

export const ContactListSkeleton = ({ count = 5 }) => (
  <div className="glass-card contact-list-card" role="status" aria-label="Loading contacts">
    <div className="skeleton-heading" />
    <div className="skeleton-search" />
    {Array.from({ length: count }, (_, i) => (
      <div className="contact-item skeleton-item" key={i}>
        <div className="contact-info">
          <div className="contact-avatar skeleton-pulse" />
          <div className="contact-details">
            <div className="skeleton-line skeleton-name" />
            <div className="skeleton-line skeleton-phone" />
          </div>
        </div>
        <div className="skeleton-btn" />
      </div>
    ))}
  </div>
);

export const ContactDetailSkeleton = () => (
  <div role="status" aria-label="Loading contact details">
    <div className="contact-detail-card">
      <div className="detail-avatar skeleton-pulse skeleton-avatar-lg" />
      <div className="skeleton-line skeleton-detail-name" />
      <div className="skeleton-line skeleton-detail-phone" />
    </div>
    <div className="skeleton-back" />
  </div>
);
