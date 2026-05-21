import { create } from 'zustand';

export const useGameStore = create((set) => ({
  // State
  nashEngineActive: true,
  threatLevel: 67,
  defenseCoverage: 78,
  
  attackerStrategies: [
    { id: 'A1', name: 'SQL Injection', prob: 0 },
    { id: 'A2', name: 'DDoS Flood', prob: 42 },
    { id: 'A3', name: 'Zero-Day Exploit', prob: 35 },
    { id: 'A4', name: 'Phishing APT', prob: 23 },
  ],
  defenderStrategies: [
    { id: 'D1', name: 'Firewall', prob: 31 },
    { id: 'D2', name: 'Intrusion Det.', prob: 0 },
    { id: 'D3', name: 'Patch System', prob: 38 },
    { id: 'D4', name: 'Honey Pot', prob: 31 },
  ],
  
  payoffMatrix: [
    [5, 2, -1, 4],
    [4, 6, 8, 3],
    [-3, 1, 7, 2],
    [2, -2, 5, 0]
  ],
  nashEquilibriumCell: { row: 1, col: 1 }, // A2, D2
  
  paretoOptima: [
    { id: 1, strat: '(A2,D2)', att: '+6', def: '-6' },
    { id: 2, strat: '(A3,D2)', att: '+4', def: '-4' },
    { id: 3, strat: '(A3,D4)', att: '0', def: '0' },
    { id: 4, strat: '(A1,D3)', att: '+7', def: '-7' }
  ],
  
  attValue: 2.71,
  defValue: -2.71,
  
  aiLogs: [
    { id: 1, time: '09:41:22', text: 'Nash equilibrium computed — mixed strategy', color: 'cyan' },
    { id: 2, time: '09:41:18', text: 'Pareto front: 4 optimal profiles found', color: 'secondary' },
    { id: 3, time: '09:41:05', text: 'DDoS pattern detected on node N-03', color: 'amber' },
    { id: 4, time: '09:40:51', text: 'Firewall rule updated via RL agent', color: 'green' }
  ],

  // Actions
  simulateAttack: () => set((state) => {
    // In a real scenario, this dispatches to the API which then streams back WS updates
    const newLogs = [
      { id: Date.now(), time: new Date().toLocaleTimeString('en-US', { hour12: false }), text: 'Attack simulation initiated...', color: 'red' },
      ...state.aiLogs.slice(0, 3)
    ];
    return { 
      threatLevel: Math.min(100, state.threatLevel + Math.floor(Math.random() * 10)),
      aiLogs: newLogs
    };
  }),
  
  deployDefense: () => set((state) => {
    const newLogs = [
      { id: Date.now(), time: new Date().toLocaleTimeString('en-US', { hour12: false }), text: 'Deploying defense strategies...', color: 'green' },
      ...state.aiLogs.slice(0, 3)
    ];
    return {
      defenseCoverage: Math.min(100, state.defenseCoverage + Math.floor(Math.random() * 5)),
      threatLevel: Math.max(0, state.threatLevel - Math.floor(Math.random() * 10)),
      aiLogs: newLogs
    };
  }),
  
  triggerAI: () => set((state) => {
    const newLogs = [
      { id: Date.now(), time: new Date().toLocaleTimeString('en-US', { hour12: false }), text: 'AI triggered dynamic defense updates', color: 'cyan' },
      ...state.aiLogs.slice(0, 3)
    ];
    return { aiLogs: newLogs, defenseCoverage: Math.min(100, state.defenseCoverage + 10) };
  }),

  // New Actions for API hooks
  addAILog: (log) => set((state) => ({
    aiLogs: [{ id: Date.now() + Math.random(), ...log }, ...state.aiLogs.slice(0, 4)]
  })),

  setThreatLevel: (level) => set((state) => ({ threatLevel: typeof level === 'function' ? level(state.threatLevel) : level })),

  updateNashResults: ({ nashData, paretoData }) => set((state) => {
    // Merge backend data if available
    return {
      attackerStrategies: nashData?.attackerStrategies || state.attackerStrategies,
      defenderStrategies: nashData?.defenderStrategies || state.defenderStrategies,
      attValue: nashData?.attValue || state.attValue,
      defValue: nashData?.defValue || state.defValue,
      nashEquilibriumCell: nashData?.nashCell || state.nashEquilibriumCell,
      paretoOptima: paretoData?.optima || state.paretoOptima
    };
  })
}));