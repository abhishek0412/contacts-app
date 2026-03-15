import { configureStore } from "@reduxjs/toolkit";
import contactsReducer from "../features/contactsSlice";
import notificationReducer from "../features/notificationSlice";

const store = configureStore({
  reducer: {
    contacts: contactsReducer,
    notification: notificationReducer,
  },
});

export default store;
