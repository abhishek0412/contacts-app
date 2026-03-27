import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { getInitials } from "../hooks/useContactHelpers";
import { usePageTitle } from "../hooks";

const MyProfile = () => {
  usePageTitle("My Profile");
  const { user } = useAuth();
  const [theme, setTheme] = useState("dark");
  const [notifications, setNotifications] = useState(true);

  const displayName = user?.displayName || "User";
  const email = user?.email || "";
  const initials = getInitials(displayName);

  return (
    <div className="profile-page">
      {/* Profile Header */}
      <div className="profile-header glass-card">
        <div className="profile-avatar-lg">{initials}</div>
        <div className="profile-header-info">
          <h2>{displayName}</h2>
          <p>{email}</p>
        </div>
      </div>

      <div className="profile-grid">
        {/* Account Settings */}
        <div className="profile-section glass-card">
          <h3 className="form-section-title">Account Settings</h3>
          <div className="info-field">
            <span className="info-label">Display Name</span>
            <span className="info-value">{displayName}</span>
          </div>
          <div className="info-field">
            <span className="info-label">Email</span>
            <span className="info-value">{email}</span>
          </div>
          <div className="info-field">
            <span className="info-label">Provider</span>
            <span className="info-value">
              {user?.providerData?.[0]?.providerId || "firebase"}
            </span>
          </div>
        </div>

        {/* Preferences */}
        <div className="profile-section glass-card">
          <h3 className="form-section-title">Preferences</h3>
          <div className="preference-row">
            <span>Theme</span>
            <select
              className="form-field-input form-field-select pref-select"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
            >
              <option value="dark">Dark</option>
              <option value="light">Light (coming soon)</option>
            </select>
          </div>
          <div className="preference-row">
            <span>Notifications</span>
            <button
              className={`toggle-btn${notifications ? " active" : ""}`}
              onClick={() => setNotifications(!notifications)}
              aria-pressed={notifications}
            >
              {notifications ? "ON" : "OFF"}
            </button>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="danger-zone glass-card">
        <h3 className="danger-title">Danger Zone</h3>
        <p className="danger-desc">
          Once you delete your account, there is no going back. All your
          contacts will be permanently removed.
        </p>
        <button className="btn-danger" disabled>
          Delete Account (Coming Soon)
        </button>
      </div>
    </div>
  );
};

export default MyProfile;
