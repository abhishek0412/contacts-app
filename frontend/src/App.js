import "./App.css";
import React, { useEffect, lazy, Suspense } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Routes, Route } from "react-router-dom";
import Header from "./components/Header.js";
import Notification from "./components/ui/Notification.js";
import ErrorBoundary from "./components/ui/ErrorBoundary.js";
import { fetchContacts } from "./features/contactsSlice";

const ContactList = lazy(() => import("./pages/ContactList.js"));
const AddContacts = lazy(() => import("./pages/AddContacts.js"));
const ContactDetail = lazy(() => import("./pages/ContactDetail.js"));

function App() {
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.contacts);

  useEffect(() => {
    dispatch(fetchContacts());
  }, [dispatch]);

  return (
    <div>
      <Header />
      <Notification />
      <div className="app-container">
        {loading && <div className="loading-spinner">Loading contacts...</div>}
        {error && <div className="error-message">{error}</div>}
        {!loading && (
          <ErrorBoundary>
            <Suspense
              fallback={<div className="loading-spinner">Loading...</div>}
            >
              <Routes>
                <Route path="/" element={<ContactList />} />
                <Route path="/add" element={<AddContacts />} />
                <Route path="/contacts/:id" element={<ContactDetail />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        )}
      </div>
    </div>
  );
}

export default App;
