import { logEvent } from "firebase/analytics";
import { analytics } from "./firebase";

// Auth events
export const trackLogin = (method) => logEvent(analytics, "login", { method });

export const trackLogout = () => logEvent(analytics, "logout");

export const trackLoginError = (method, errorMessage) =>
  logEvent(analytics, "login_error", { method, error_message: errorMessage });

// Page view (SPA navigation)
export const trackPageView = (pagePath, pageTitle) =>
  logEvent(analytics, "page_view", {
    page_path: pagePath,
    page_title: pageTitle,
  });

// Contact CRUD events
export const trackContactAdded = () => logEvent(analytics, "contact_added");

export const trackContactDeleted = () => logEvent(analytics, "contact_deleted");

export const trackContactViewed = (contactId) =>
  logEvent(analytics, "contact_viewed", { contact_id: contactId });

// Search
export const trackSearch = (searchTerm) =>
  logEvent(analytics, "search", { search_term: searchTerm });

// Pagination
export const trackPageChange = (pageNumber, totalPages) =>
  logEvent(analytics, "page_change", {
    page_number: pageNumber,
    total_pages: totalPages,
  });

// Delete dialog
export const trackDeleteConfirmed = () =>
  logEvent(analytics, "delete_confirmed");

export const trackDeleteCancelled = () =>
  logEvent(analytics, "delete_cancelled");
