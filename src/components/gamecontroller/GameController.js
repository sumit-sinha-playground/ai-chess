import React, { useState, useEffect } from 'react'; // Added useEffect for logging search params
import { useSearchParams } from 'react-router-dom'; // Import useSearchParams
import Chessboard from '../chessboard/Chessboard';

// Initial state for a standard chess game
const initialPiecePositions = [
  // White pieces
  ['Ra1', 'Nb1', 'Bc1', 'Qd1', 'Ke1', 'Bf1', 'Ng1', 'Rh1',
    'a2', 'b2', 'c2', 'd2', 'e2', 'f2', 'g2', 'h2'],
  // Black pieces
  ['Ra8', 'Nb8', 'Bc8', 'Qd8', 'Ke8', 'Bf8', 'Ng8', 'Rh8',
    'a7', 'b7', 'c7', 'd7', 'e7', 'f7', 'g7', 'h7'],
];

function GameController() {
  const [currentPiecePositions, setCurrentPiecePositions] = useState(initialPiecePositions);
  const [searchParams] = useSearchParams(); // Hook to access query parameters

  // Log the 'id' from the URL for demonstration
  useEffect(() => {
    if (searchParams == null) return;
    const gameId = searchParams.get('id');
    if (gameId) {
      console.log('Game ID from URL:', gameId);
      // You can use this gameId to load specific game state from a database, etc.
    } else {
      console.log('No game ID found in URL. Starting new game.');
    }
  }, [searchParams]); // Re-run effect if searchParams change

  const handlePieceMove = (newPositions) => {
    setCurrentPiecePositions(newPositions);
  };

  // Function to reset the game to its initial state
  const handleGameReset = () => {
    setCurrentPiecePositions(initialPiecePositions); // Reset to initial state
  };

  return (
    <div className="game-controller">
      <Chessboard
        piecePositions={currentPiecePositions}
        onPieceMove={handlePieceMove}
        onGameReset={handleGameReset}
      />
    </div>
  );
}

export default GameController;
