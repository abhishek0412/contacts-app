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
    <>
      <Header />
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
              <Route path="/" element={<ContactList />} />
              <Route path="/add" element={<AddContacts />} />
              <Route path="/contacts/:id" element={<ContactDetail />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </main>
    </>
  );
}

export default App;
