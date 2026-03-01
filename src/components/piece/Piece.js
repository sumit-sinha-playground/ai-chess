import React from 'react';
import PropTypes from 'prop-types';
import './Piece.css';

// --- Import all individual piece images ---
// Ensure these paths are correct relative to Piece.js
import blackBishop from '../../assets/images/black-bishop.png';
import blackKing from '../../assets/images/black-king.png';
import blackKnight from '../../assets/images/black-knight.png';
import blackPawn from '../../assets/images/black-pawn.png';
import blackQueen from '../../assets/images/black-queen.png';
import blackRook from '../../assets/images/black-rook.png';
import whiteBishop from '../../assets/images/white-bishop.png';
import whiteKing from '../../assets/images/white-king.png';
import whiteKnight from '../../assets/images/white-knight.png';
import whitePawn from '../../assets/images/white-pawn.png';
import whiteQueen from '../../assets/images/white-queen.png';
import whiteRook from '../../assets/images/white-rook.png';

// Enum for Piece Types (remains the same)
export const PieceType = {
  ROOK: 'rook',
  KNIGHT: 'knight',
  BISHOP: 'bishop',
  QUEEN: 'queen',
  KING: 'king',
  PAWN: 'pawn',
};

// Enum for Piece Colors (remains the same)
export const PieceColor = {
  BLACK: 'black',
  WHITE: 'white',
};

// --- Mapping PieceType and PieceColor to actual image imports ---
// ENSURE ALL ENTRIES ARE PRESENT AND CORRECTLY MAPPED
const pieceImageMap = {
  [PieceColor.BLACK]: {
    [PieceType.BISHOP]: blackBishop,
    [PieceType.KING]: blackKing,
    [PieceType.KNIGHT]: blackKnight,
    [PieceType.PAWN]: blackPawn,
    [PieceType.QUEEN]: blackQueen,
    [PieceType.ROOK]: blackRook,
  },
  [PieceColor.WHITE]: {
    [PieceType.BISHOP]: whiteBishop,
    [PieceType.KING]: whiteKing,
    [PieceType.KNIGHT]: whiteKnight,
    [PieceType.PAWN]: whitePawn,
    [PieceType.QUEEN]: whiteQueen,
    [PieceType.ROOK]: whiteRook,
  },
};

const Piece = ({ type, color }) => {
  // Get the specific image source based on type and color
  const imageSrc = pieceImageMap[color]?.[type];

  if (!imageSrc) {
    // This warning will tell you exactly which piece mapping is missing
    console.warn(`No image found for ${color} ${type}. Check pieceImageMap in Piece.js.`);
    return null; // Or render a placeholder/error
  }

  const ariaLabel = `${color} ${type}`;

  return (
    <div
      className="piece"
      role="img"
      aria-label={ariaLabel}
    >
      <img src={imageSrc} alt={ariaLabel} className="piece-image" />
    </div>
  );
};

Piece.propTypes = {
  type: PropTypes.oneOf(Object.values(PieceType)).isRequired,
  color: PropTypes.oneOf(Object.values(PieceColor)).isRequired,
};

export default Piece;
