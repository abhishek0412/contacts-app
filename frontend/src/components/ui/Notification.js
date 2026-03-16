import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { clearNotification } from "../../features/notificationSlice";

const Notification = () => {
  const { message, type } = useSelector((state) => state.notification);
  const dispatch = useDispatch();

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        dispatch(clearNotification());
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [message, dispatch]);

  if (!message) return null;

  return (
    <div
      className={`notification notification-${type}`}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <span>{message}</span>
      <button
        className="notification-close"
        onClick={() => dispatch(clearNotification())}
        aria-label="Dismiss notification"
      >
        &times;
      </button>
    </div>
  );
};

export default Notification;
