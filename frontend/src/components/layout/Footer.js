import React from "react";

const Footer = () => (
  <footer className="app-footer">
    <span>&copy; 2026 Contact Manager</span>
    <span className="footer-sep">&bull;</span>
    <a href="/privacy" className="footer-link">
      Privacy
    </a>
    <span className="footer-sep">&bull;</span>
    <a href="/terms" className="footer-link">
      Terms
    </a>
    <span className="footer-sep">&bull;</span>
    <a href="/help" className="footer-link">
      Help
    </a>
  </footer>
);

export default Footer;
