import React, { useState } from "react";
import { usePageTitle } from "../hooks";

const Settings = () => {
  usePageTitle("Settings");
  const [contactsPerPage, setContactsPerPage] = useState(6);
  const [defaultSort, setDefaultSort] = useState("created_desc");

  return (
    <div className="settings-page">
      <div className="profile-grid">
        <div className="profile-section glass-card">
          <h3 className="form-section-title">Display Settings</h3>
          <div className="preference-row">
            <span>Contacts per page</span>
            <select
              className="form-field-input form-field-select pref-select"
              value={contactsPerPage}
              onChange={(e) => setContactsPerPage(Number(e.target.value))}
            >
              <option value={6}>6</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>
          <div className="preference-row">
            <span>Default sort order</span>
            <select
              className="form-field-input form-field-select pref-select"
              value={defaultSort}
              onChange={(e) => setDefaultSort(e.target.value)}
            >
              <option value="created_desc">Newest first</option>
              <option value="created_asc">Oldest first</option>
              <option value="name_asc">Name A→Z</option>
              <option value="name_desc">Name Z→A</option>
            </select>
          </div>
        </div>

        <div className="profile-section glass-card">
          <h3 className="form-section-title">Data & Privacy</h3>
          <div className="preference-row">
            <span>Export contacts</span>
            <button className="btn-cancel" disabled>
              CSV Export (Coming Soon)
            </button>
          </div>
          <div className="preference-row">
            <span>Import contacts</span>
            <button className="btn-cancel" disabled>
              CSV Import (Coming Soon)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
