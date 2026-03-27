import "./App.css";
import React, { lazy, Suspense, useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import { trackPageView } from "./analytics";
import { AppLayout } from "./components/layout";
import ProtectedRoute from "./components/ProtectedRoute.js";
import Notification from "./components/ui/Notification.js";
import ErrorBoundary from "./components/ui/ErrorBoundary.js";

const Login = lazy(() => import("./pages/Login.js"));
const ContactList = lazy(() => import("./pages/ContactList.js"));
const AddContacts = lazy(() => import("./pages/AddContacts.js"));
const ContactDetail = lazy(() => import("./pages/ContactDetail.js"));
const EditContact = lazy(() => import("./pages/EditContact.js"));
const SearchPage = lazy(() => import("./pages/SearchPage.js"));
const MyProfile = lazy(() => import("./pages/MyProfile.js"));
const Settings = lazy(() => import("./pages/Settings.js"));
const Dashboard = lazy(() => import("./pages/Dashboard.js"));

function App() {
  const { user, loading } = useAuth();
  const location = useLocation();

  useEffect(() => {
    trackPageView(location.pathname, document.title);
  }, [location]);

  if (loading) {
    return (
      <div className="loading-spinner" role="status">
        <span>Loading...</span>
      </div>
    );
  }

  return (
    <>
      <Notification />
      <ErrorBoundary>
        <Suspense
          fallback={
            <div className="loading-spinner" role="status">
              <span>Loading...</span>
            </div>
          }
        >
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<ContactList />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/add" element={<AddContacts />} />
              <Route path="/contacts/:id" element={<ContactDetail />} />
              <Route path="/contacts/:id/edit" element={<EditContact />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/profile" element={<MyProfile />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </>
  );
}

export default App;
