import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return { Authorization: `Bearer ${token}` };
};

export const updateProfile = async (data) => {
  const response = await axios.put(`${API_URL}/auth/me`, data, { headers: getAuthHeader() });
  return response.data;
};

export const changePassword = async (data) => {
  const response = await axios.put(`${API_URL}/auth/me/password`, data, { headers: getAuthHeader() });
  return response.data;
};

export const getUsers = async () => {
  const response = await axios.get(`${API_URL}/auth/users`, { headers: getAuthHeader() });
  return response.data;
};
