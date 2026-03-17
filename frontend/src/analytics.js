import { logEvent } from "firebase/analytics";
import { analytics } from "./firebase";

const safeLogEvent = (eventName, params = {}) => {
  if (!analytics) return;
  logEvent(analytics, eventName, params);
};

// Auth events
export const trackLogin = (method) => safeLogEvent("login", { method });

export const trackLogout = () => safeLogEvent("logout");

export const trackLoginError = (method, errorMessage) =>
  safeLogEvent("login_error", { method, error_message: errorMessage });

// Page view (SPA navigation)
export const trackPageView = (pagePath, pageTitle) =>
  safeLogEvent("page_view", {
    page_path: pagePath,
    page_title: pageTitle,
  });

// Contact CRUD events
export const trackContactAdded = () => safeLogEvent("contact_added");

export const trackContactDeleted = () => safeLogEvent("contact_deleted");

export const trackContactViewed = (contactId) =>
  safeLogEvent("contact_viewed", { contact_id: contactId });

// Search
export const trackSearch = (searchTerm) =>
  safeLogEvent("search", { search_term: searchTerm });

// Pagination
export const trackPageChange = (pageNumber, totalPages) =>
  safeLogEvent("page_change", {
    page_number: pageNumber,
    total_pages: totalPages,
  });

// Delete dialog
export const trackDeleteConfirmed = () => safeLogEvent("delete_confirmed");

export const trackDeleteCancelled = () => safeLogEvent("delete_cancelled");
