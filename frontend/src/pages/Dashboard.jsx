import React from 'react';
import Header from '../components/Header';
import StrategyPanel from '../components/StrategyPanel';
import PayoffMatrix from '../components/PayoffMatrix';
import NetworkCanvas from '../components/NetworkCanvas';
import ConvergenceChart from '../components/ConvergenceChart';
import NashPanel from '../components/NashPanel';
import AIMonitor from '../components/AIMonitor';
import { useGameStore } from '../store/gameStore';
import { useNash } from '../hooks/useNash';
import { useWebSocket } from '../hooks/useWebSocket';
import { Target, Shield, Zap } from 'lucide-react';

export default function Dashboard() {
  const simulateAttack = useGameStore(state => state.simulateAttack);
  const deployDefense = useGameStore(state => state.deployDefense);
  
  // Initialize WebSocket connection and Nash hook
  useWebSocket();
  const { recompute } = useNash();

  return (
    <div className="dashboard-layout">
      <Header />
      
      {/* Controls Row */}
      <div className="controls-row">
        <div className="controls-left">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="text-secondary text-xs">Scenario</span>
            <select defaultValue="standard">
              <option value="standard">Standard 4x4</option>
              <option value="zero-sum">Zero-Sum 4x4</option>
              <option value="advanced">Advanced APT</option>
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="text-secondary text-xs">Topology</span>
            <select defaultValue="star">
              <option value="star">Star Network</option>
              <option value="mesh">Mesh Network</option>
              <option value="ring">Ring Network</option>
            </select>
          </div>
        </div>

        <div className="controls-center">
          <button className="btn btn-cyan" onClick={recompute}>
            <Target size={14} />
            Compute Nash
          </button>
          <button className="btn btn-red" onClick={simulateAttack}>
            <Zap size={14} />
            Simulate Attack
          </button>
          <button className="btn btn-green" onClick={deployDefense}>
            <Shield size={14} />
            Deploy Defense
          </button>
        </div>

        <div className="controls-right">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="text-secondary text-xs">AI Adaptation</span>
            <select defaultValue="rl">
              <option value="rl">Reinforcement Learning</option>
              <option value="static">Static Optimal</option>
              <option value="none">Disabled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Left Column */}
      <div className="left-sidebar">
        <StrategyPanel />
        <PayoffMatrix />
      </div>

      {/* Center Column */}
      <div className="main-content">
        <NetworkCanvas />
        <ConvergenceChart />
      </div>

      {/* Right Column */}
      <div className="right-sidebar">
        <NashPanel />
        <AIMonitor />
      </div>
    </div>
  );
}
