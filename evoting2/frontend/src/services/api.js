import axios from 'axios';

const API = axios.create({ baseURL: '/api' });

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

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

export const register    = (d)  => API.post('/auth/register', d);
export const login       = (d)  => API.post('/auth/login', d);
export const getMe       = ()   => API.get('/auth/me');

export const getElections       = ()      => API.get('/elections');
export const getElection        = (id)    => API.get(`/elections/${id}`);
export const createElection     = (d)     => API.post('/elections', d);
export const updateElectionStatus = (id, status) => API.patch(`/elections/${id}`, { status });

export const getCandidates    = (p)       => API.get('/candidates', { params: p });
export const applyAsCandidate = (d)       => API.post('/candidates/apply', d);
export const approveCandidate = (id, status) => API.patch(`/candidates/${id}/approve`, { status });

export const getVoterProfile  = ()        => API.get('/voters/profile');
export const registerFace     = (emb)     => API.post('/voters/face/register', { embedding: emb });
export const verifyFace       = (emb)     => API.post('/voters/face/verify', { embedding: emb });

export const castVote         = (d)       => API.post('/votes', d);
export const getMyVotes       = ()        => API.get('/votes/my');
export const getResults       = (id)      => API.get(`/votes/results/${id}`);

export const getChain         = ()        => API.get('/blockchain');
export const validateChain    = ()        => API.get('/blockchain/validate');

export const getAdminStats    = ()        => API.get('/admin/stats');
export const getAllVoters      = ()        => API.get('/admin/voters');

export default API;
