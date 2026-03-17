import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { showNotification } from "./notificationSlice";
import { auth } from "../firebase";

export const contactsApi = createApi({
  reducerPath: "contactsApi",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.REACT_APP_API_URL || "http://localhost:3001",
    prepareHeaders: async (headers) => {
      const user = auth.currentUser;
      if (user) {
        const token = await user.getIdToken();
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ["Contact"],
  endpoints: (builder) => ({
    getContacts: builder.query({
      query: () => "/contacts",
      providesTags: ["Contact"],
    }),
    addContact: builder.mutation({
      query: (contact) => ({
        url: "/contacts",
        method: "POST",
        body: contact,
      }),
      invalidatesTags: ["Contact"],
      async onQueryStarted(contact, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(
            showNotification({
              message: `"${data.name}" has been added!`,
              type: "success",
            }),
          );
        } catch {
          dispatch(
            showNotification({
              message: "Failed to add contact.",
              type: "error",
            }),
          );
        }
      },
    }),
    deleteContact: builder.mutation({
      query: (id) => ({
        url: `/contacts/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Contact"],
      async onQueryStarted(id, { dispatch, queryFulfilled, getState }) {
        const contacts = contactsApi.endpoints.getContacts.select()(getState());
        const contact = contacts.data?.find((c) => c.id === id);
        try {
          await queryFulfilled;
          dispatch(
            showNotification({
              message: `"${contact?.name}" has been removed.`,
              type: "info",
            }),
          );
        } catch {
          dispatch(
            showNotification({
              message: "Failed to delete contact.",
              type: "error",
            }),
          );
        }
      },
    }),
  }),
});

export const {
  useGetContactsQuery,
  useAddContactMutation,
  useDeleteContactMutation,
} = contactsApi;
