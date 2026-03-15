import notificationReducer, {
  showNotification,
  clearNotification,
} from "./notificationSlice";

describe("notificationSlice", () => {
  const initialState = { message: null, type: null };

  it("should return initial state", () => {
    expect(notificationReducer(undefined, { type: "unknown" })).toEqual(
      initialState,
    );
  });

  it("should set message and type on showNotification", () => {
    const state = notificationReducer(
      initialState,
      showNotification({ message: "Contact added!", type: "success" }),
    );
    expect(state.message).toBe("Contact added!");
    expect(state.type).toBe("success");
  });

  it("should default type to success if not provided", () => {
    const state = notificationReducer(
      initialState,
      showNotification({ message: "Done!" }),
    );
    expect(state.type).toBe("success");
  });

  it("should clear notification", () => {
    const activeState = { message: "Hello", type: "info" };
    const state = notificationReducer(activeState, clearNotification());
    expect(state.message).toBeNull();
    expect(state.type).toBeNull();
  });

  it("should replace previous notification", () => {
    const activeState = { message: "First", type: "success" };
    const state = notificationReducer(
      activeState,
      showNotification({ message: "Second", type: "info" }),
    );
    expect(state.message).toBe("Second");
    expect(state.type).toBe("info");
  });
});
