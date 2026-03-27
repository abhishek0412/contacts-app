import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { auth } from "../../firebase";
import {
  onAddContactSuccess,
  onAddContactError,
  onUpdateContactSuccess,
  onUpdateContactError,
  onDeleteContactSuccess,
  onDeleteContactError,
} from "./contactsNotifications";

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
  tagTypes: ["Contact", "ContactStats"],
  endpoints: (builder) => ({
    // --- Queries ---

    getContacts: builder.query({
      query: ({ page = 1, limit = 6 } = {}) =>
        `/contacts?page=${page}&limit=${limit}`,
      providesTags: (result) =>
        result?.contacts
          ? [
              ...result.contacts.map((c) => ({ type: "Contact", id: c.id })),
              { type: "Contact", id: "LIST" },
            ]
          : [{ type: "Contact", id: "LIST" }],
    }),

    getContact: builder.query({
      query: (id) => `/contacts/${id}`,
      providesTags: (result, error, id) => [{ type: "Contact", id }],
    }),

    getContactStats: builder.query({
      query: () => "/contacts/stats",
      providesTags: ["ContactStats"],
    }),

    searchContacts: builder.query({
      query: ({ q, field = "all" }) =>
        `/contacts/search?q=${encodeURIComponent(q)}&field=${field}`,
      providesTags: [{ type: "Contact", id: "SEARCH" }],
    }),

    // --- Mutations ---

    addContact: builder.mutation({
      query: (contact) => ({
        url: "/contacts",
        method: "POST",
        body: contact,
      }),
      invalidatesTags: [{ type: "Contact", id: "LIST" }, "ContactStats"],
      async onQueryStarted(_contact, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          onAddContactSuccess(dispatch, data);
        } catch {
          onAddContactError(dispatch);
        }
      },
    }),

    updateContact: builder.mutation({
      query: ({ id, ...patch }) => ({
        url: `/contacts/${id}`,
        method: "PUT",
        body: patch,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Contact", id },
        { type: "Contact", id: "LIST" },
        "ContactStats",
      ],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          onUpdateContactSuccess(dispatch, data);
        } catch {
          onUpdateContactError(dispatch);
        }
      },
    }),

    deleteContact: builder.mutation({
      query: (id) => ({
        url: `/contacts/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "Contact", id: "LIST" }, "ContactStats"],
      async onQueryStarted(id, { dispatch, queryFulfilled, getState }) {
        const state = contactsApi.endpoints.getContacts.select({})(getState());
        const contacts = state.data?.contacts || state.data || [];
        const contact = contacts.find((c) => c.id === id);
        try {
          await queryFulfilled;
          onDeleteContactSuccess(dispatch, contact?.name);
        } catch {
          onDeleteContactError(dispatch);
        }
      },
    }),
  }),
});

export const {
  useGetContactsQuery,
  useGetContactQuery,
  useGetContactStatsQuery,
  useSearchContactsQuery,
  useAddContactMutation,
  useUpdateContactMutation,
  useDeleteContactMutation,
} = contactsApi;
