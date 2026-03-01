import React from 'react';
import PropTypes from 'prop-types';
import { PieceColor } from '../piece/Piece'; // Import PieceColor for type checking
import './GameOverPopup.css'; // Link to the new CSS file

const GameOverPopup = ({ winner, onClose }) => {
  let message = '';
  if (winner === 'Draw') {
    message = 'Game Over: It\'s a Draw (Stalemate)!';
  } else if (winner === PieceColor.WHITE) { // Using PieceColor enum directly
    message = 'Game Over: White Wins by Checkmate!';
  } else if (winner === PieceColor.BLACK) { // Using PieceColor enum directly
    message = 'Game Over: Black Wins by Checkmate!';
  }

  return (
    <div className="game-over-overlay">
      <div className="game-over-popup">
        <h2>{message}</h2>
        <button onClick={onClose}>Play Again?</button>
      </div>
    </div>
  );
};

GameOverPopup.propTypes = {
  winner: PropTypes.oneOf([PieceColor.WHITE, PieceColor.BLACK, 'Draw']), // Use enum values
  onClose: PropTypes.func.isRequired,
};

export default GameOverPopup;
