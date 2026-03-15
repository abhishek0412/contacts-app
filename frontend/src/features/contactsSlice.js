import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as contactsApi from "../api/contacts.js";
import { showNotification } from "./notificationSlice";

// Async thunks
export const fetchContacts = createAsyncThunk(
  "contacts/fetchContacts",
  async () => {
    const data = await contactsApi.fetchAll();
    return data;
  },
);

export const addContact = createAsyncThunk(
  "contacts/addContact",
  async (contact, { dispatch }) => {
    const data = await contactsApi.create(contact);
    dispatch(
      showNotification({
        message: `"${data.name}" has been added!`,
        type: "success",
      }),
    );
    return data;
  },
);

export const removeContact = createAsyncThunk(
  "contacts/removeContact",
  async (id, { getState, dispatch }) => {
    const contact = getState().contacts.contacts.find((c) => c.id === id);
    await contactsApi.remove(id);
    dispatch(
      showNotification({
        message: `"${contact?.name}" has been removed.`,
        type: "info",
      }),
    );
    return id;
  },
);

const contactsSlice = createSlice({
  name: "contacts",
  initialState: {
    contacts: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // fetchContacts
      .addCase(fetchContacts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchContacts.fulfilled, (state, action) => {
        state.loading = false;
        state.contacts = action.payload;
      })
      .addCase(fetchContacts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // addContact
      .addCase(addContact.fulfilled, (state, action) => {
        state.contacts.push(action.payload);
      })
      // removeContact
      .addCase(removeContact.fulfilled, (state, action) => {
        state.contacts = state.contacts.filter((c) => c.id !== action.payload);
      });
  },
});

export default contactsSlice.reducer;
