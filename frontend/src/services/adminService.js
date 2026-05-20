import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return { Authorization: `Bearer ${token}` };
};

export const getAllUsers = async () => {
  const response = await axios.get(`${API_URL}/admin/users`, { headers: getAuthHeader() });
  return response.data;
};

export const updateUser = async (id, data) => {
  const response = await axios.put(`${API_URL}/admin/users/${id}`, data, { headers: getAuthHeader() });
  return response.data;
};

export const deleteUser = async (id) => {
  const response = await axios.delete(`${API_URL}/admin/users/${id}`, { headers: getAuthHeader() });
  return response.data;
};

export const getSubscriptionRequests = async () => {
  const response = await axios.get(`${API_URL}/admin/requests`, { headers: getAuthHeader() });
  return response.data;
};

export const handleSubscriptionRequest = async (id, status) => {
  const response = await axios.put(`${API_URL}/admin/requests/${id}`, { status }, { headers: getAuthHeader() });
  return response.data;
};
