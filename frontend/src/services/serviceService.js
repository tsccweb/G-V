import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return { Authorization: `Bearer ${token}` };
};

export const getServices = async () => {
  const response = await axios.get(`${API_URL}/services`, { headers: getAuthHeader() });
  return response.data;
};

export const getServiceById = async (id) => {
  const response = await axios.get(`${API_URL}/services/${id}`, { headers: getAuthHeader() });
  return response.data;
};

export const createService = async (serviceData) => {
  const response = await axios.post(`${API_URL}/services`, serviceData, { headers: getAuthHeader() });
  return response.data;
};

export const deleteService = async (id) => {
  const response = await axios.delete(`${API_URL}/services/${id}`, { headers: getAuthHeader() });
  return response.data;
};

export const updateServiceItems = async (id, items) => {
  const response = await axios.put(`${API_URL}/services/${id}/items`, { items }, { headers: getAuthHeader() });
  return response.data;
};

export const addToLineup = async (data) => {
  const response = await axios.post(`${API_URL}/services/lineup`, data, { headers: getAuthHeader() });
  return response.data;
};

export const inviteToLineup = async (data) => {
  const response = await axios.post(`${API_URL}/services/lineup`, data, { headers: getAuthHeader() });
  return response.data;
};

export const addServiceItem = async (serviceId, itemData) => {
  const response = await axios.post(`${API_URL}/services/${serviceId}/items`, itemData, { headers: getAuthHeader() });
  return response.data;
};

export const removeServiceItem = async (serviceId, itemId) => {
  const response = await axios.delete(`${API_URL}/services/${serviceId}/items/${itemId}`, { headers: getAuthHeader() });
  return response.data;
};

export const goLiveService = async (serviceId) => {
  const response = await axios.post(`${API_URL}/services/${serviceId}/live`, {}, { headers: getAuthHeader() });
  return response.data;
};

export const removeFromLineup = async (serviceId, id) => {
  const response = await axios.delete(`${API_URL}/services/${serviceId}/lineup/${id}`, { headers: getAuthHeader() });
  return response.data;
};
