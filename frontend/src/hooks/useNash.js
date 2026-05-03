import { useGameStore } from '../store/gameStore';
import { useGameAPI } from './useGameAPI';

export const useNash = () => {
  const { computeNash, getPareto } = useGameAPI();
  const payoffMatrix = useGameStore(state => state.payoffMatrix);
  const updateNashResults = useGameStore(state => state.updateNashResults);
  const addAILog = useGameStore(state => state.addAILog);

  const recompute = async () => {
    addAILog({
      time: new Date().toLocaleTimeString('en-US', { hour12: false }),
      text: 'Computing Nash Equilibrium via backend engine...',
      color: 'secondary'
    });

    try {
      const [nashData, paretoData] = await Promise.all([
        computeNash(payoffMatrix),
        getPareto(payoffMatrix)
      ]);

      // Update the store with the real calculated data
      updateNashResults({
        nashData,
        paretoData
      });

      addAILog({
        time: new Date().toLocaleTimeString('en-US', { hour12: false }),
        text: 'Nash equilibrium computed successfully',
        color: 'cyan'
      });
    } catch (error) {
      console.error("Failed to recompute Nash", error);
      // Fallback for UI visualization if backend is offline
      addAILog({
        time: new Date().toLocaleTimeString('en-US', { hour12: false }),
        text: 'API offline — using cached/mock equilibrium',
        color: 'amber'
      });
    }
  };

  return { recompute };
};
