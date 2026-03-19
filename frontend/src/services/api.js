import axios from 'axios';

const API = axios.create({ baseURL: '/api' });

// Attach JWT token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Global response error handler
API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ── Auth ──────────────────────────────────────────────────
export const register    = (data)  => API.post('/auth/register', data);
export const login       = (data)  => API.post('/auth/login', data);
export const getMe       = ()      => API.get('/auth/me');

// ── Elections ─────────────────────────────────────────────
export const getElections       = ()       => API.get('/elections');
export const getElection        = (id)     => API.get(`/elections/${id}`);
export const createElection     = (data)   => API.post('/elections', data);
export const updateElectionStatus = (id, status) => API.patch(`/elections/${id}`, { status });

// ── Candidates ────────────────────────────────────────────
export const getCandidates      = (params) => API.get('/candidates', { params });
export const applyAsCandidate   = (data)   => API.post('/candidates/apply', data);
export const approveCandidate   = (id, status) => API.patch(`/candidates/${id}/approve`, { status });

// ── Voters / Face ─────────────────────────────────────────
export const getVoterProfile    = ()       => API.get('/voters/profile');
export const registerFace       = (embedding) => API.post('/voters/face/register', { embedding });
export const verifyFace         = (embedding) => API.post('/voters/face/verify', { embedding });

// ── Votes ─────────────────────────────────────────────────
export const castVote           = (data)   => API.post('/votes', data);
export const getMyVotes         = ()       => API.get('/votes/my');
export const getResults         = (electionId) => API.get(`/votes/results/${electionId}`);

// ── Blockchain ────────────────────────────────────────────
export const getChain           = ()       => API.get('/blockchain');
export const validateChain      = ()       => API.get('/blockchain/validate');
export const getBlock           = (index)  => API.get(`/blockchain/block/${index}`);

// ── Admin ─────────────────────────────────────────────────
export const getAdminStats      = ()       => API.get('/admin/stats');
export const getAllVoters        = ()       => API.get('/admin/voters');

export default API;
