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
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/analysis" element={<Analysis />} />
        <Route path="/simulate" element={<Simulation />} />
        <Route path="/report" element={<Report />} />
      </Routes>
    </Router>
  );
}

export default App;
