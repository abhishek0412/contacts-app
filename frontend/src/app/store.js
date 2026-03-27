import { configureStore } from "@reduxjs/toolkit";
import { contactsApi } from "../features/contacts/contactsApi";
import notificationReducer from "../features/notificationSlice";

const store = configureStore({
  reducer: {
    [contactsApi.reducerPath]: contactsApi.reducer,
    notification: notificationReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(contactsApi.middleware),
});

export default store;
