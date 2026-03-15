import "./App.css";
import React, { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import Header from "./components/Header.js";
import Notification from "./components/ui/Notification.js";
import ErrorBoundary from "./components/ui/ErrorBoundary.js";

const ContactList = lazy(() => import("./pages/ContactList.js"));
const AddContacts = lazy(() => import("./pages/AddContacts.js"));
const ContactDetail = lazy(() => import("./pages/ContactDetail.js"));

function App() {
  return (
    <div>
      <Header />
      <Notification />
      <div className="app-container">
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
      </div>
    </div>
  );
}

export default App;
