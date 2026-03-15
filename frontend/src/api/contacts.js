import axios from "axios";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:3001",
});

export const fetchAll = async () => {
  const response = await api.get("/contacts");
  return response.data;
};

export const fetchById = async (id) => {
  const response = await api.get(`/contacts/${id}`);
  return response.data;
};

export const create = async (contact) => {
  const response = await api.post("/contacts", contact);
  return response.data;
};

export const update = async (id, contact) => {
  const response = await api.put(`/contacts/${id}`, contact);
  return response.data;
};

export const remove = async (id) => {
  const response = await api.delete(`/contacts/${id}`);
  return response.data;
};
