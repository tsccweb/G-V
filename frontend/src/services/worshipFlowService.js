import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return { Authorization: `Bearer ${token}` };
};

export const getFlows = async () => {
  const response = await axios.get(`${API_URL}/flows`, { headers: getAuthHeader() });
  return response.data;
};

export const getFlowById = async (id) => {
  const response = await axios.get(`${API_URL}/flows/${id}`, { headers: getAuthHeader() });
  return response.data;
};

export const createFlow = async (data) => {
  const response = await axios.post(`${API_URL}/flows`, data, { headers: getAuthHeader() });
  return response.data;
};

export const updateFlow = async (id, data) => {
  const response = await axios.put(`${API_URL}/flows/${id}`, data, { headers: getAuthHeader() });
  return response.data;
};

export const deleteFlow = async (id) => {
  const response = await axios.delete(`${API_URL}/flows/${id}`, { headers: getAuthHeader() });
  return response.data;
};

export const addSongToFlow = async (flowId, songData) => {
  const response = await axios.post(`${API_URL}/flows/${flowId}/songs`, songData, { headers: getAuthHeader() });
  return response.data;
};

export const removeSongFromFlow = async (flowId, songId) => {
  const response = await axios.delete(`${API_URL}/flows/${flowId}/songs/${songId}`, { headers: getAuthHeader() });
  return response.data;
};

export const reorderFlowSongs = async (flowId, orderedIds) => {
  const response = await axios.put(`${API_URL}/flows/${flowId}/songs/reorder`, { orderedIds }, { headers: getAuthHeader() });
  return response.data;
};

export const goLive = async (flowId) => {
  const response = await axios.post(`${API_URL}/flows/${flowId}/live`, {}, { headers: getAuthHeader() });
  return response.data;
};

export const endLive = async (flowId) => {
  const response = await axios.post(`${API_URL}/flows/${flowId}/end`, {}, { headers: getAuthHeader() });
  return response.data;
};

export const joinByCode = async (code) => {
  const response = await axios.get(`${API_URL}/live/join/${code}`);
  return response.data;
};

export const syncState = async (sessionId, state) => {
  const response = await axios.post(`${API_URL}/live/${sessionId}/sync`, state, { headers: getAuthHeader() });
  return response.data;
};

export const getState = async (sessionId) => {
  const response = await axios.get(`${API_URL}/live/${sessionId}`, { headers: getAuthHeader() });
  return response.data;
};
