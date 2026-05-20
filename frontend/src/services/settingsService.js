import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return { Authorization: `Bearer ${token}` };
};

export const getSettings = async () => {
  const response = await axios.get(`${API_URL}/settings`, { headers: getAuthHeader() });
  return response.data;
};

export const updateSettings = async (data) => {
  const response = await axios.put(`${API_URL}/settings`, data, { headers: getAuthHeader() });
  return response.data;
};

export const resetSettings = async () => {
  const response = await axios.post(`${API_URL}/settings/reset`, {}, { headers: getAuthHeader() });
  return response.data;
};
