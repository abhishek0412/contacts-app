import React from "react";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../../test-utils";
import ErrorBoundary from "./ErrorBoundary";

const ThrowingComponent = () => {
  throw new Error("Test error");
};

const GoodComponent = () => <div>All good</div>;

describe("ErrorBoundary", () => {
  beforeEach(() => {
    // Suppress console.error for expected error boundary logs
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    console.error.mockRestore();
  });

  it("renders children when there is no error", () => {
    renderWithProviders(
      <ErrorBoundary>
        <GoodComponent />
      </ErrorBoundary>,
    );
    expect(screen.getByText("All good")).toBeInTheDocument();
  });

  it("renders fallback UI when a child throws", () => {
    renderWithProviders(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>,
    );
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(screen.getByText(/unexpected error/i)).toBeInTheDocument();
  });

  it("shows a link to go home", () => {
    renderWithProviders(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>,
    );
    const link = screen.getByText("Go to Home");
    expect(link).toBeInTheDocument();
    expect(link.closest("a")).toHaveAttribute("href", "/");
  });
});
