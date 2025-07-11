import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { GameProvider } from './context/GameContext';
import HomePage from './pages/HomePage';
import JoinPage from './pages/JoinPage';
import GameRoomPage from './pages/GameRoomPage';
import './index.css';

function App() {
  return (
    <GameProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/join" element={<JoinPage />} />
            <Route path="/room/:roomId" element={<GameRoomPage />} />
          </Routes>
        </div>
      </Router>
    </GameProvider>
  );
}

export default App;
