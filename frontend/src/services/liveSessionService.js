import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return { Authorization: `Bearer ${token}` };
};

export const syncLiveState = async (serviceId, state) => {
  const response = await axios.post(`${API_URL}/live/${serviceId}/sync`, state, { headers: getAuthHeader() });
  return response.data;
};

export const getLiveState = async (serviceId) => {
  const response = await axios.get(`${API_URL}/live/${serviceId}`, { headers: getAuthHeader() });
  return response.data;
};
