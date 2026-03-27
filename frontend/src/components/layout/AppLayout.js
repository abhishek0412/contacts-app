import React from "react";
import { Outlet } from "react-router-dom";
import { PageTitleProvider } from "../../hooks";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import Footer from "./Footer";

const AppLayout = () => (
  <PageTitleProvider>
    <div className="app-layout">
      <Sidebar />
      <div className="app-main">
        <TopBar />
        <div className="app-content">
          <Outlet />
        </div>
        <Footer />
      </div>
    </div>
  </PageTitleProvider>
);

export default AppLayout;
