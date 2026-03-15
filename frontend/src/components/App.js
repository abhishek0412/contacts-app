import "./App.css";
import React, { useEffect, lazy, Suspense } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Routes, Route } from "react-router-dom";
import Header from "./Header.js";
import Notification from "./Notification.js";
import ErrorBoundary from "./ErrorBoundary.js";
import { fetchContacts } from "../features/contactsSlice";

const ContactList = lazy(() => import("./ContactList.js"));
const AddContacts = lazy(() => import("./AddContacts.js"));
const ContactDetail = lazy(() => import("./ContactDetail.js"));

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
