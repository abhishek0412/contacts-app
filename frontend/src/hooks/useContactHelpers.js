/**
 * Get display name from a contact object.
 * Supports both new schema (first_name + last_name) and legacy (name).
 */
export const getFullName = (contact) => {
  if (!contact) return "";
  if (contact.first_name || contact.last_name) {
    return `${contact.first_name || ""} ${contact.last_name || ""}`.trim();
  }
  return contact.name || "";
};

/**
 * Extract up to 2 initials from a contact or a name string.
 */
export const getInitials = (nameOrContact) => {
  const name =
    typeof nameOrContact === "string"
      ? nameOrContact
      : getFullName(nameOrContact);
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

/**
 * Format a phone number for display (no mutation, display only).
 */
export const formatPhone = (phone) => {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) {
    return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  }
  return phone;
};

/**
 * Get a nested JSONB field safely with fallback.
 */
export const getNestedField = (contact, section, field, fallback = "") => {
  return contact?.[section]?.[field] || fallback;
};
