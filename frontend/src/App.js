import "./App.css";
import React, { lazy, Suspense, useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import { trackPageView } from "./analytics";
import Header from "./components/Header.js";
import Notification from "./components/ui/Notification.js";
import ErrorBoundary from "./components/ui/ErrorBoundary.js";

const Login = lazy(() => import("./pages/Login.js"));
const ContactList = lazy(() => import("./pages/ContactList.js"));
const AddContacts = lazy(() => import("./pages/AddContacts.js"));
const ContactDetail = lazy(() => import("./pages/ContactDetail.js"));

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? children : <Navigate to="/login" />;
}

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
      {user && <Header />}
      <Notification />
      <main className="app-container">
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
                path="/"
                element={
                  <ProtectedRoute>
                    <ContactList />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/add"
                element={
                  <ProtectedRoute>
                    <AddContacts />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/contacts/:id"
                element={
                  <ProtectedRoute>
                    <ContactDetail />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </main>
    </>
  );
}

export default App;
