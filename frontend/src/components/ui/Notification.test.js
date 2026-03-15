import React from "react";
import { screen, act } from "@testing-library/react";
import { renderWithProviders } from "../../test-utils";
import Notification from "./Notification";

describe("Notification", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("renders nothing when there is no notification", () => {
    const { container } = renderWithProviders(<Notification />);
    expect(container.querySelector(".notification")).not.toBeInTheDocument();
  });

  it("renders message when notification is active", () => {
    renderWithProviders(<Notification />, {
      preloadedState: {
        notification: { message: "Contact added!", type: "success" },
      },
    });
    expect(screen.getByText("Contact added!")).toBeInTheDocument();
  });

  it("applies correct CSS class based on type", () => {
    const { container } = renderWithProviders(<Notification />, {
      preloadedState: {
        notification: { message: "Removed", type: "info" },
      },
    });
    expect(container.querySelector(".notification-info")).toBeInTheDocument();
  });

  it("renders close button", () => {
    renderWithProviders(<Notification />, {
      preloadedState: {
        notification: { message: "Hello", type: "success" },
      },
    });
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("clears notification on close button click", () => {
    const { store } = renderWithProviders(<Notification />, {
      preloadedState: {
        notification: { message: "Hello", type: "success" },
      },
    });
    screen.getByRole("button").click();
    expect(store.getState().notification.message).toBeNull();
  });

  it("auto-dismisses after 4 seconds", () => {
    const { store } = renderWithProviders(<Notification />, {
      preloadedState: {
        notification: { message: "Bye", type: "success" },
      },
    });
    expect(store.getState().notification.message).toBe("Bye");

    act(() => {
      jest.advanceTimersByTime(4000);
    });

    expect(store.getState().notification.message).toBeNull();
  });
});
