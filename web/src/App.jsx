import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Analysis from './pages/Analysis';
import Simulation from './pages/Simulation';
import Report from './pages/Report';
import About from './pages/About';
import SplashScreen from './components/SplashScreen';
import SystemStatusBar from './components/SystemStatusBar';
import './styles/globals.css';
import './styles/pro.css';
import './styles/dashboard.css';

function App() {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <>
      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
      <div
        className="app-shell"
        style={{
          opacity: showSplash ? 0 : 1,
          visibility: showSplash ? 'hidden' : 'visible',
        }}
      >
        <div className="app-shell__main">
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
        <SystemStatusBar />
      </div>
    </>
  );
}

export default App;
