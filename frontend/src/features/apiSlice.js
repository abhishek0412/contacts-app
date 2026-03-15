import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { showNotification } from "./notificationSlice";

export const contactsApi = createApi({
  reducerPath: "contactsApi",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.REACT_APP_API_URL || "http://localhost:3001",
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
        const { data } = await queryFulfilled;
        dispatch(
          showNotification({
            message: `"${data.name}" has been added!`,
            type: "success",
          }),
        );
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
        await queryFulfilled;
        dispatch(
          showNotification({
            message: `"${contact?.name}" has been removed.`,
            type: "info",
          }),
        );
      },
    }),
  }),
});

export const {
  useGetContactsQuery,
  useAddContactMutation,
  useDeleteContactMutation,
} = contactsApi;
