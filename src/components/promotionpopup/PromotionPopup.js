import React from 'react';
import PropTypes from 'prop-types';
import Piece, { PieceType, PieceColor } from '../piece/Piece'; // Import Piece component and enums
import './PromotionPopup.css'; // Import its own CSS

const PromotionPopup = ({ pawnColor, onChoice }) => {
  const promotionPieces = [
    PieceType.QUEEN,
    PieceType.ROOK,
    PieceType.BISHOP,
    PieceType.KNIGHT,
  ];

  // Removed getPieceImage function as we will now render the Piece component directly

  return (
    <div className="promotion-overlay">
      <div className="promotion-popup">
        <h3>Choose a piece for promotion:</h3>
        <div className="promotion-options">
          {promotionPieces.map((type) => (
            <button
              key={type}
              onClick={() => onChoice(type)}
              className="promotion-button"
            >
              {/* Render the Piece component directly to load the image */}
              <Piece type={type} color={pawnColor} />
              {/* Optional text label, if desired alongside the piece image */}
              {/* <span>{type}</span> */}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

PromotionPopup.propTypes = {
  pawnColor: PropTypes.oneOf([PieceColor.WHITE, PieceColor.BLACK]).isRequired,
  onChoice: PropTypes.func.isRequired,
};

export default PromotionPopup;
