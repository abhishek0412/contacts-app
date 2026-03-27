import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { signUpSchema } from "../schemas/auth";
import { trackLoginError } from "../analytics";

const SignUp = () => {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    displayName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGlobalError(null);
    setErrors({});

    const result = signUpSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0];
        if (!fieldErrors[field]) fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    try {
      await signUp(form.email, form.password, form.displayName);
      setSuccess(true);
    } catch (err) {
      trackLoginError("email-signup", err.message);
      if (err.code === "auth/email-already-in-use") {
        setGlobalError(
          "An account with this email already exists. Try signing in instead.",
        );
      } else if (err.code === "auth/weak-password") {
        setErrors({ password: "Password is too weak. Try a stronger one." });
      } else if (err.code === "auth/invalid-email") {
        setErrors({ email: "This email address is not valid." });
      } else {
        setGlobalError(
          err.message || "Something went wrong. Please try again.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="login-page">
        <div className="login-card glass-card">
          <div className="login-header">
            <div className="login-icon signup-success-icon">
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
            </div>
            <h1>Check your email</h1>
            <p className="login-subtitle">
              We've sent a verification link to <strong>{form.email}</strong>.
              Click the link to activate your account.
            </p>
          </div>
          <Link
            to="/login"
            className="btn-signin"
            style={{
              textAlign: "center",
              display: "block",
              textDecoration: "none",
            }}
          >
            Back to Sign In
          </Link>
          <p className="login-footer">
            Didn't get the email? Check your spam folder.
          </p>
        </div>

        <footer className="login-page-footer">
          © 2026 Contact Manager <span className="footer-sep">•</span> Privacy{" "}
          <span className="footer-sep">•</span> Terms{" "}
          <span className="footer-sep">•</span> Help
        </footer>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-card glass-card">
        <div className="login-header">
          <div className="login-icon">
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="8.5" cy="7" r="4" />
              <line x1="20" y1="8" x2="20" y2="14" />
              <line x1="23" y1="11" x2="17" y2="11" />
            </svg>
          </div>
          <h1>Create Account</h1>
          <p className="login-subtitle">
            Sign up to start managing your contacts
          </p>
        </div>

        {globalError && <p className="login-error">{globalError}</p>}

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <div className="login-field">
            <label className="login-field-label" htmlFor="signup-name">
              Full Name
            </label>
            <input
              id="signup-name"
              name="displayName"
              type="text"
              placeholder="John Doe"
              value={form.displayName}
              onChange={handleChange}
              className={`login-field-input ${errors.displayName ? "field-error" : ""}`}
              autoComplete="name"
            />
            {errors.displayName && (
              <span className="field-error-text">{errors.displayName}</span>
            )}
          </div>

          <div className="login-field">
            <label className="login-field-label" htmlFor="signup-email">
              Email Address
            </label>
            <input
              id="signup-email"
              name="email"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              className={`login-field-input ${errors.email ? "field-error" : ""}`}
              autoComplete="email"
            />
            {errors.email && (
              <span className="field-error-text">{errors.email}</span>
            )}
          </div>

          <div className="login-field">
            <label className="login-field-label" htmlFor="signup-password">
              Password
            </label>
            <input
              id="signup-password"
              name="password"
              type="password"
              placeholder="Min 8 chars, upper, lower, number, special"
              value={form.password}
              onChange={handleChange}
              className={`login-field-input ${errors.password ? "field-error" : ""}`}
              autoComplete="new-password"
            />
            {errors.password && (
              <span className="field-error-text">{errors.password}</span>
            )}
          </div>

          <div className="login-field">
            <label className="login-field-label" htmlFor="signup-confirm">
              Confirm Password
            </label>
            <input
              id="signup-confirm"
              name="confirmPassword"
              type="password"
              placeholder="Re-enter your password"
              value={form.confirmPassword}
              onChange={handleChange}
              className={`login-field-input ${errors.confirmPassword ? "field-error" : ""}`}
              autoComplete="new-password"
            />
            {errors.confirmPassword && (
              <span className="field-error-text">{errors.confirmPassword}</span>
            )}
          </div>

          <button type="submit" className="btn-signin" disabled={loading}>
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <p className="login-signup">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
        <p className="login-footer">
          Your contacts are private and secured with OAuth 2.0
        </p>
      </div>

      <footer className="login-page-footer">
        © 2026 Contact Manager <span className="footer-sep">•</span> Privacy{" "}
        <span className="footer-sep">•</span> Terms{" "}
        <span className="footer-sep">•</span> Help
      </footer>
    </div>
  );
};

export default SignUp;
