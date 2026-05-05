import axios from 'axios';

const api = axios.create({
  baseURL: '/api', // Proxied by Vite to localhost:8000
  timeout: 10000,
});

const buildApiError = (error, action) => {
  const detail = error?.response?.data?.detail;
  const message = typeof detail === 'string'
    ? detail
    : (error?.response?.data?.message || error?.message || 'Unknown error');
  const status = error?.response?.status;
  return new Error(`${action} failed${status ? ` (${status})` : ''}: ${message}`);
};

const apiCall = async (action, fn) => {
  try {
    const response = await fn();
    return response.data;
  } catch (error) {
    const friendly = buildApiError(error, action);
    console.error(friendly.message, error);
    throw friendly;
  }
};

export const useGameAPI = () => {
  const computeNash = async (matrix, defenderMatrix = null) => {
    const payload = defenderMatrix ? { matrix, defender_matrix: defenderMatrix } : { matrix };
    return apiCall('Compute Nash equilibrium', () => api.post('/game/nash', payload));
  };

  const getPareto = async (matrix, defenderMatrix = null) => {
    const payload = defenderMatrix ? { matrix, defender_matrix: defenderMatrix } : { matrix };
    return apiCall('Load Pareto profiles', () => api.post('/game/pareto', payload));
  };

  const simulateAttack = async (scenario, topology) => {
    return apiCall('Simulate attack', () => api.post('/network/simulate', { scenario, topology }));
  };

  const deployDefense = async (strategyId, aiMode) => {
    return apiCall('Deploy defense', () => api.post('/ai/adapt', { strategyId, aiMode }));
  };

  const listPresets = async () => {
    return apiCall('List presets', () => api.get('/game/presets'));
  };

  const savePreset = async (payload) => {
    return apiCall('Save preset', () => api.post('/game/presets', payload));
  };

  const renamePreset = async (oldName, payload) => {
    return apiCall('Rename preset', () => api.put(`/game/presets/${encodeURIComponent(oldName)}`, payload));
  };

  const deletePreset = async (name) => {
    return apiCall('Delete preset', () => api.delete(`/game/presets/${encodeURIComponent(name)}`));
  };

  return {
    computeNash,
    getPareto,
    simulateAttack,
    deployDefense,
    listPresets,
    savePreset,
    renamePreset,
    deletePreset
  };
};
