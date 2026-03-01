import { BrowserRouter, Routes, Route } from 'react-router-dom'; // Import BrowserRouter, Routes, Route, Navigate
import GameController from './components/gamecontroller/GameController';
import Home from './components/home/Home'; // Import the new Home component
import './App.css';

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          {/* Route for the GameController component */}
          <Route path="/game" element={<GameController />} />

          {/* Route for the Home landing page */}
          <Route path="/" element={<Home />} />

          {/* Optional: Add a 404 Not Found page */}
          <Route path="*" element={<div>404 Not Found</div>} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
