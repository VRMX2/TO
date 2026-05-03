import axios from 'axios';

const api = axios.create({
  baseURL: '/api', // Proxied by Vite to localhost:8000
  timeout: 10000,
});

export const useGameAPI = () => {
  const computeNash = async (matrix) => {
    try {
      const response = await api.post('/game/nash', { matrix });
      return response.data;
    } catch (error) {
      console.error("Failed to compute Nash Equilibrium via API:", error);
      throw error;
    }
  };

  const getPareto = async (matrix) => {
    try {
      const response = await api.post('/game/pareto', { matrix });
      return response.data;
    } catch (error) {
      console.error("Failed to get Pareto Optima via API:", error);
      throw error;
    }
  };

  const simulateAttack = async (scenario, topology) => {
    try {
      const response = await api.post('/network/simulate', { scenario, topology });
      return response.data;
    } catch (error) {
      console.error("Failed to simulate attack via API:", error);
      throw error;
    }
  };

  const deployDefense = async (strategyId, aiMode) => {
    try {
      const response = await api.post('/ai/adapt', { strategyId, aiMode });
      return response.data;
    } catch (error) {
      console.error("Failed to deploy defense via API:", error);
      throw error;
    }
  };

  return {
    computeNash,
    getPareto,
    simulateAttack,
    deployDefense
  };
};
