import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return { headers: { Authorization: `Bearer ${token}` } };
};

export const getGroups = async () => {
  const response = await axios.get(`${API_URL}/groups`, getAuthHeader());
  return response.data;
};

export const getGroupById = async (id) => {
  const response = await axios.get(`${API_URL}/groups/${id}`, getAuthHeader());
  return response.data;
};

export const createGroup = async (groupData) => {
  const response = await axios.post(`${API_URL}/groups`, groupData, getAuthHeader());
  return response.data;
};

export const updateGroup = async (id, groupData) => {
  const response = await axios.put(`${API_URL}/groups/${id}`, groupData, getAuthHeader());
  return response.data;
};

export const deleteGroup = async (id) => {
  const response = await axios.delete(`${API_URL}/groups/${id}`, getAuthHeader());
  return response.data;
};

export const addMembersToGroup = async (id, memberIds) => {
  const response = await axios.post(`${API_URL}/groups/${id}/members`, { memberIds }, getAuthHeader());
  return response.data;
};

export const removeMemberFromGroup = async (id, memberId) => {
  const response = await axios.delete(`${API_URL}/groups/${id}/members/${memberId}`, getAuthHeader());
  return response.data;
};
