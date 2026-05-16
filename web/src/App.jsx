import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Analysis from './pages/Analysis';
import Simulation from './pages/Simulation';
import Report from './pages/Report';
import './styles/globals.css';
import './styles/dashboard.css';

function App() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <div style={{ flex: 1 }}>
        <Router>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/analysis" element={<Analysis />} />
            <Route path="/simulate" element={<Simulation />} />
            <Route path="/report" element={<Report />} />
          </Routes>
        </Router>
      </div>
      <footer style={{
        textAlign: 'center',
        padding: '1rem',
        background: 'var(--bg-panel)',
        borderTop: '1px solid var(--border-subtle)',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.75rem',
        color: 'var(--text-secondary)'
      }}>
        Made by: GRISSI LAHCEN, BERRAG RAYANE ABDESSALEM, HABBA EL RAYANE, AKSOUH ABDERRAOUF, BERSALI HAMZA, CHABRI ABDELMALEK
      </footer>
    </div>
  );
}

export default App;
