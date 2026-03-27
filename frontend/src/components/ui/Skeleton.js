import React from "react";

export const ContactListSkeleton = ({ count = 6 }) => (
  <div role="status" aria-label="Loading contacts">
    {/* Stats skeleton */}
    <div className="stats-grid">
      {Array.from({ length: 4 }, (_, i) => (
        <div className="stats-card glass-card" key={i}>
          <div
            className="skeleton-line"
            style={{ width: "80px", marginBottom: "8px" }}
          />
          <div
            className="skeleton-line"
            style={{ width: "50px", height: "28px" }}
          />
        </div>
      ))}
    </div>
    {/* Table skeleton */}
    <div className="glass-card contact-list-section">
      <div className="skeleton-heading" />
      <div className="contact-table-wrapper">
        <table className="contact-table">
          <thead>
            <tr className="contact-table-header">
              {["Name", "Email", "Phone", "Company", "Actions"].map((col) => (
                <th key={col} className="contact-table-th">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: count }, (_, i) => (
              <tr className="contact-table-row" key={i}>
                <td className="contact-table-cell contact-table-name">
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    <div className="contact-avatar skeleton-pulse" />
                    <div className="skeleton-line skeleton-name" />
                  </div>
                </td>
                <td className="contact-table-cell">
                  <div className="skeleton-line" style={{ width: "140px" }} />
                </td>
                <td className="contact-table-cell">
                  <div className="skeleton-line" style={{ width: "110px" }} />
                </td>
                <td className="contact-table-cell">
                  <div className="skeleton-line" style={{ width: "90px" }} />
                </td>
                <td className="contact-table-cell">
                  <div className="skeleton-line" style={{ width: "70px" }} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

export const ContactDetailSkeleton = () => (
  <div role="status" aria-label="Loading contact details">
    <div
      className="skeleton-line"
      style={{ width: "150px", marginBottom: "16px" }}
    />
    <div className="contact-hero glass-card">
      <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
        <div className="hero-avatar skeleton-pulse" />
        <div>
          <div
            className="skeleton-line"
            style={{ width: "200px", height: "22px", marginBottom: "8px" }}
          />
          <div
            className="skeleton-line"
            style={{ width: "140px", marginBottom: "6px" }}
          />
          <div className="skeleton-line" style={{ width: "180px" }} />
        </div>
      </div>
    </div>
    <div className="info-grid">
      {Array.from({ length: 4 }, (_, i) => (
        <div className="info-card glass-card" key={i}>
          <div
            className="skeleton-line"
            style={{ width: "120px", height: "18px", marginBottom: "16px" }}
          />
          {Array.from({ length: 3 }, (__, j) => (
            <div key={j} style={{ marginBottom: "12px" }}>
              <div
                className="skeleton-line"
                style={{ width: "60px", height: "10px", marginBottom: "4px" }}
              />
              <div className="skeleton-line" style={{ width: "140px" }} />
            </div>
          ))}
        </div>
      ))}
    </div>
  </div>
);
