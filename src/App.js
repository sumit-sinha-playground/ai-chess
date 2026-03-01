import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'; // Import BrowserRouter, Routes, Route, Navigate
import GameController from './components/gamecontroller/GameController';
import './App.css';

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          {/* Route for the GameController component */}
          <Route path="/game" element={<GameController />} />

          {/* Optional: Redirect root path to /game, or add a landing page */}
          <Route path="/" element={<Navigate to="/game" replace />} />

          {/* Optional: Add a 404 Not Found page */}
          <Route path="*" element={<div>404 Not Found</div>} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
