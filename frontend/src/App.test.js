import React from "react";
import { screen, waitFor } from "@testing-library/react";
import { renderWithProviders } from "./test-utils";
import App from "./App";

// Mock AuthContext to provide an authenticated user
jest.mock("./contexts/AuthContext", () => ({
  AuthProvider: ({ children }) => children,
  useAuth: () => ({
    user: { uid: "test-user", displayName: "Test User" },
    loading: false,
    loginWithGithub: jest.fn(),
    loginWithGoogle: jest.fn(),
    logout: jest.fn(),
  }),
}));

describe("App", () => {
  it("renders the sidebar navigation", async () => {
    renderWithProviders(<App />);
    expect(await screen.findByText("Contact Manager")).toBeInTheDocument();
  });

  it("renders Contacts and Add New nav links", async () => {
    renderWithProviders(<App />);
    expect(await screen.findByText("Contact Manager")).toBeInTheDocument();
    expect(screen.getAllByText("Contacts").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Add New/)).toBeInTheDocument();
  });

  it("renders the app layout", () => {
    const { container } = renderWithProviders(<App />);
    expect(container.querySelector(".app-layout")).toBeInTheDocument();
  });

  it("renders the add form on /add route", async () => {
    renderWithProviders(<App />, { route: "/add" });
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /Save Contact/i }),
      ).toBeInTheDocument();
    });
  });
});
