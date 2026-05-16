import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Analysis from './pages/Analysis';
import Simulation from './pages/Simulation';
import Report from './pages/Report';
import About from './pages/About';
import SplashScreen from './components/SplashScreen';
import './styles/globals.css';
import './styles/dashboard.css';

function App() {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <>
      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', opacity: showSplash ? 0 : 1, transition: 'opacity 0.5s ease-in', visibility: showSplash ? 'hidden' : 'visible' }}>
        <div style={{ flex: 1 }}>
        <Router>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/analysis" element={<Analysis />} />
            <Route path="/simulate" element={<Simulation />} />
            <Route path="/report" element={<Report />} />
            <Route path="/about" element={<About />} />
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
        CyberGameGT &copy; 2026
      </footer>
    </div>
    </>
  );
}

export default App;
