import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import './Chessboard.css';
import Piece, { PieceType, PieceColor } from '../piece/Piece';
import GameOverPopup from '../gameover/GameOverPopup'; // Import the new popup component
import PromotionPopup from '../promotionpopup/PromotionPopup'; // UPDATED: Import PromotionPopup from new path

// --- Helper arrays for coordinate conversion ---
const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];

// --- Mapping algebraic notation piece letters to PieceType enum ---
const algebraicPieceTypeMap = {
  'K': PieceType.KING,
  'Q': PieceType.QUEEN,
  'R': PieceType.ROOK,
  'B': PieceType.BISHOP,
  'N': PieceType.KNIGHT,
};

// --- Reverse mapping for converting board state back to algebraic notation ---
const pieceTypeToAlgebraicLetterMap = {
  [PieceType.KING]: 'K',
  [PieceType.QUEEN]: 'Q',
  [PieceType.ROOK]: 'R',
  [PieceType.BISHOP]: 'B',
  [PieceType.KNIGHT]: 'N',
  [PieceType.PAWN]: '', // Pawns have no letter prefix
};


// --- Helper: Parse Algebraic Notation String ---
const parseAlgebraicNotation = (notationString, defaultColor) => {
  if (typeof notationString !== 'string' || notationString.length < 2 || notationString.length > 3) {
    console.warn(`Invalid notation string format: ${notationString}`);
    return null;
  }

  let pieceLetter = '';
  let coordString = notationString;

  if (notationString.length === 3) { // e.g., "Ke1"
    pieceLetter = notationString.charAt(0);
    coordString = notationString.substring(1);
  } else if (notationString.length === 2) { // e.g., "e2" (pawn)
    pieceLetter = ''; // Indicates a pawn
  } else {
    console.warn(`Notation string length invalid: ${notationString}`);
    return null;
  }

  const file = coordString.charAt(0);
  const rank = coordString.charAt(1);

  const col = files.indexOf(file);
  const row = ranks.indexOf(rank);

  if (col === -1 || row === -1) {
    console.warn(`Invalid coordinate in notation: ${notationString}`);
    return null;
  }

  const type = pieceLetter ? algebraicPieceTypeMap[pieceLetter] : PieceType.PAWN;
  if (!type) {
    console.warn(`Unknown piece type letter: '${pieceLetter}' in ${notationString}`);
    return null;
  }

  return {
    type: type,
    color: defaultColor,
    row: row,
    col: col,
    notation: notationString
  };
};

// --- Helper: Create 2D Board Array from Piece Position Data ---
const createBoardFromPiecePositions = (positions) => {
  const newBoard = Array(8).fill(null).map(() => Array(8).fill(null));

  if (positions && positions[0]) {
    positions[0].forEach(notationString => {
      const pieceInfo = parseAlgebraicNotation(notationString, PieceColor.WHITE);
      if (pieceInfo) {
        newBoard[pieceInfo.row][pieceInfo.col] = {
          type: pieceInfo.type,
          color: pieceInfo.color
        };
      }
    });
  }

  if (positions && positions[1]) {
    positions[1].forEach(notationString => {
      const pieceInfo = parseAlgebraicNotation(notationString, PieceColor.BLACK);
      if (pieceInfo) {
        newBoard[pieceInfo.row][pieceInfo.col] = {
          type: pieceInfo.type,
          color: pieceInfo.color
        };
      }
    });
  }
  return newBoard;
};

// --- Helper: Convert 2D Board Array to Algebraic Notation ---
const convertBoardToAlgebraicNotation = (boardArray) => {
  const whitePieces = [];
  const blackPieces = [];

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = boardArray[r][c];
      if (piece) {
        const file = files[c];
        const rank = ranks[r];
        const pieceLetter = pieceTypeToAlgebraicLetterMap[piece.type];
        const notation = `${pieceLetter}${file}${rank}`;

        if (piece.color === PieceColor.WHITE) {
          whitePieces.push(notation);
        } else {
          blackPieces.push(notation);
        }
      }
    }
  }
  return [whitePieces, blackPieces];
};

// --- Helper: Get Valid Pawn Moves ---
const getValidPawnMoves = (board, row, col, pieceColor, lastMove) => {
  const moves = [];
  const direction = (pieceColor === PieceColor.WHITE) ? -1 : 1; // -1 for white (up), 1 for black (down)
  const startingRow = (pieceColor === PieceColor.WHITE) ? 6 : 1; // White starts on rank 2 (row 6), Black on rank 7 (row 1)
  const enPassantRow = (pieceColor === PieceColor.WHITE) ? 3 : 4; // Row where en passant can occur

  // 1-square forward move
  const newRow1 = row + direction;
  // Check if the square is within bounds and empty
  if (newRow1 >= 0 && newRow1 < 8 && !board[newRow1][col]) {
    moves.push([newRow1, col]);

    // 2-square initial move
    const newRow2 = row + 2 * direction;
    // Check if on starting rank and the two squares forward are empty
    if (row === startingRow && !board[newRow2][col]) {
      moves.push([newRow2, col]);
    }
  }

  // Captures
  const captureCols = [col - 1, col + 1];
  for (const c of captureCols) {
    if (c >= 0 && c < 8) { // Check if target column is within board bounds
      const targetPiece = newRow1 >= 0 && newRow1 < 8 ? board[newRow1][c] : null; // Ensure newRow1 is valid before accessing board
      // If there's an opponent's piece diagonally forward, it's a valid capture
      if (targetPiece && targetPiece.color !== pieceColor) {
        moves.push([newRow1, c]);
      }
    }
  }

  // --- En Passant Logic ---
  // A pawn can capture en passant if:
  // 1. The capturing pawn is on its 5th rank (row 3 for white, row 4 for black).
  // 2. The opponent's pawn moved two squares from its starting position in the immediately preceding turn.
  // 3. The opponent's pawn is directly adjacent horizontally to the capturing pawn's current position.
  if (row === enPassantRow && lastMove) {
    const [lastMoveFromRow] = lastMove.from; // Corrected: only destructure lastMoveFromRow
    const [lastMoveToRow, lastMoveToCol] = lastMove.to;
    const lastMovedPiece = lastMove.piece;

    // Check if the last move was an opponent's pawn moving two squares
    if (lastMovedPiece.type === PieceType.PAWN &&
        lastMovedPiece.color !== pieceColor &&
        Math.abs(lastMoveFromRow - lastMoveToRow) === 2 &&
        lastMoveToRow === row) { // The opponent pawn landed on the same row as our pawn

      // Check if the opponent's pawn is horizontally adjacent
      if (lastMoveToCol === col - 1 || lastMoveToCol === col + 1) {
        // The en passant capture square is diagonally in front of our pawn,
        // and directly behind the captured pawn.
        const enPassantTargetRow = row + direction;
        const enPassantTargetCol = lastMoveToCol; // The column of the captured pawn

        moves.push([enPassantTargetRow, enPassantTargetCol]);
      }
    }
  }

  return moves;
};

// --- Helper: Get Valid Knight Moves ---
const getValidKnightMoves = (board, row, col, pieceColor) => {
  const moves = [];
  // All 8 possible "L" shaped moves
  const knightMoves = [
    [-2, -1], [-2, 1], [-1, -2], [-1, 2],
    [1, -2], [1, 2], [2, -1], [2, 1]
  ];

  for (const [dr, dc] of knightMoves) {
    const newRow = row + dr;
    const newCol = col + dc;

    // Check if the new position is within board bounds
    if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
      const targetPiece = board[newRow][newCol];

      // If the target square is empty or contains an opponent's piece, it's a valid move
      if (!targetPiece || targetPiece.color !== pieceColor) {
        moves.push([newRow, newCol]);
      }
    }
  }
  return moves;
};


// --- Helper: Get Valid Rook Moves ---
const getValidRookMoves = (board, row, col, pieceColor) => {
  const moves = [];
  // Directions: [dr, dc] -> [row_change, col_change]
  const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]]; // Up, Down, Left, Right

  for (const [dr, dc] of directions) { // Iterate over each direction
    for (let i = 1; i < 8; i++) { // Loop outwards from current square
      const newRow = row + dr * i;
      const newCol = col + dc * i;

      if (newRow < 0 || newRow >= 8 || newCol < 0 || newCol >= 8) {
        break; // Out of bounds
      }

      const targetPiece = board[newRow][newCol];

      if (!targetPiece) {
        // Empty square, valid move
        moves.push([newRow, newCol]);
      } else {
        // Occupied square
        if (targetPiece.color !== pieceColor) {
          // Opponent's piece, valid capture
          moves.push([newRow, newCol]);
        }
        break; // Stop in this direction after hitting any piece
      }
    }
  }
  return moves;
};

// --- Helper: Get Valid Bishop Moves ---
const getValidBishopMoves = (board, row, col, pieceColor) => {
  const moves = [];
  // Directions: [dr, dc] -> [row_change, col_change]
  const directions = [[-1, -1], [-1, 1], [1, -1], [1, 1]]; // Diagonals (Up-Left, Up-Right, Down-Left, Down-Right)

  for (const [dr, dc] of directions) { // Iterate over each direction
    for (let i = 1; i < 8; i++) { // Loop outwards from current square
      const newRow = row + dr * i;
      const newCol = col + dc * i;

      if (newRow < 0 || newRow >= 8 || newCol < 0 || newCol >= 8) {
        break; // Out of bounds
      }

      const targetPiece = board[newRow][newCol];

      if (!targetPiece) {
        // Empty square, valid move
        moves.push([newRow, newCol]);
      } else {
        // Occupied square
        if (targetPiece.color !== pieceColor) {
          // Opponent's piece, valid capture
          moves.push([newRow, newCol]);
        }
        break; // Stop in this direction after hitting any piece
      }
    }
  }
  return moves;
};

// --- Helper: Get Valid Queen Moves ---
const getValidQueenMoves = (board, row, col, pieceColor) => {
  // Queen moves are a combination of Rook and Bishop moves
  const rookMoves = getValidRookMoves(board, row, col, pieceColor);
  const bishopMoves = getValidBishopMoves(board, row, col, pieceColor);
  return [...rookMoves, ...bishopMoves]; // Combine the arrays of moves
};

// --- Helper Function: isSquareAttacked ---
// Checks if a given square (targetRow, targetCol) is attacked by any piece of attackingColor
const isSquareAttacked = (board, targetRow, targetCol, attackingColor) => {
  // Iterate through all squares on the board
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];

      if (piece && piece.color === attackingColor) {
        // Check if this attacking piece can attack the target square
        switch (piece.type) {
          case PieceType.PAWN:
            // Pawns only attack diagonally
            const pawnDirection = (attackingColor === PieceColor.WHITE) ? -1 : 1;
            if (r + pawnDirection === targetRow && (c - 1 === targetCol || c + 1 === targetCol)) {
              return true;
            }
            break;
          case PieceType.KNIGHT:
            const knightMoves = [
              [-2, -1], [-2, 1], [-1, -2], [-1, 2],
              [1, -2], [1, 2], [2, -1], [2, 1]
            ];
            if (knightMoves.some(([dr, dc]) => r + dr === targetRow && c + dc === targetCol)) {
              return true;
            }
            break;
          case PieceType.KING:
            // A king can attack squares adjacent to it. This is important for preventing a king
            // from moving into a square adjacent to the opposing king.
            if (Math.abs(r - targetRow) <= 1 && Math.abs(c - targetCol) <= 1 && (r !== targetRow || c !== targetCol)) {
              return true;
            }
            break;
          case PieceType.ROOK:
          case PieceType.BISHOP:
          case PieceType.QUEEN:
            const directions = [];
            if (piece.type === PieceType.ROOK || piece.type === PieceType.QUEEN) {
              directions.push([-1, 0], [1, 0], [0, -1], [0, 1]); // Straight
            }
            if (piece.type === PieceType.BISHOP || piece.type === PieceType.QUEEN) {
              directions.push([-1, -1], [-1, 1], [1, -1], [1, 1]); // Diagonal
            }

            for (const [dr, dc] of directions) { // Iterate over each direction
              for (let i = 1; i < 8; i++) {
                const newR = r + dr * i;
                const newC = c + dc * i;

                if (newR < 0 || newR >= 8 || newC < 0 || newC >= 8) {
                  break; // Out of bounds
                }

                // If this intermediate square is the target square, it's attacked
                if (newR === targetRow && newC === targetCol) {
                  return true;
                }

                // If an intermediate square is occupied (by any piece) AND it's NOT the target square,
                // then the path is blocked. This prevents a piece from attacking THROUGH another.
                if (board[newR][newC] !== null && !(newR === targetRow && newC === targetCol)) {
                  break;
                }
              }
            }
            break;
          default:
            break;
        }
      }
    }
  }
  return false; // Square is not attacked by any piece of attackingColor
};


// --- Helper Function: findKing ---
const findKing = (board, color) => {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece && piece.type === PieceType.KING && piece.color === color) {
        return [r, c];
      }
    }
  }
  return null; // Should not happen in a valid game state unless king is captured
};

// --- Helper Function: isKingInCheck ---
const isKingInCheck = (board, kingColor) => {
  const kingPosition = findKing(board, kingColor);
  if (!kingPosition) {
    console.error(`King of color ${kingColor} not found on the board!`);
    return false;
  }
  const [kingRow, kingCol] = kingPosition;
  const opponentColor = kingColor === PieceColor.WHITE ? PieceColor.BLACK : PieceColor.WHITE;

  return isSquareAttacked(board, kingRow, kingCol, opponentColor);
};


// --- Main Chessboard Component ---
const Chessboard = ({ piecePositions, onPieceMove, onGameReset }) => {
  // --- STATE FOR CASTLING (TEMPORARY - IDEALLY LIFT TO PARENT APP COMPONENT) ---
  const [hasWhiteKingMoved, setHasWhiteKingMoved] = useState(false);
  const [hasWhiteRookA1Moved, setHasWhiteRookA1Moved] = useState(false); // a1 is [7,0]
  const [hasWhiteRookH1Moved, setHasWhiteRookH1Moved] = useState(false); // h1 is [7,7]
  const [hasBlackKingMoved, setHasBlackKingMoved] = useState(false);
  const [hasBlackRookA8Moved, setHasBlackRookA8Moved] = useState(false); // a8 is [0,0]
  const [hasBlackRookH8Moved, setHasBlackRookH8Moved] = useState(false); // h8 is [0,7]
  // --- END STATE FOR CASTLING ---

  const [currentTurn, setCurrentTurn] = useState(PieceColor.WHITE);

  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(null);

  const [isPromoting, setIsPromoting] = useState(false);
  const [promotionDetails, setPromotionDetails] = useState(null);

  // NEW: State to track the last move for en passant
  const [lastMove, setLastMove] = useState(null); // { piece: {type, color}, from: [r,c], to: [r,c] }


  const board = useMemo(() =>
    createBoardFromPiecePositions(piecePositions),
    [piecePositions]
  );

  const [selectedSquare, setSelectedSquare] = useState(null);
  const [validMoves, setValidMoves] = useState([]);


  // --- Helper: Get Valid King Moves (UPDATED FOR CASTLING AND CHECK) ---
  const getValidKingMoves = (board, row, col, pieceColor) => {
    const moves = [];
    const opponentColor = pieceColor === PieceColor.WHITE ? PieceColor.BLACK : PieceColor.WHITE;

    // All 8 surrounding squares for normal moves
    const kingNormalMoves = [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1],           [0, 1],
      [1, -1], [1, 0], [1, 1]
    ];

    for (const [dr, dc] of kingNormalMoves) {
      const newRow = row + dr;
      const newCol = col + dc;

      if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
        const targetPiece = board[newRow][newCol];

        if (!targetPiece || targetPiece.color !== pieceColor) {
          const tempBoardForKingMove = JSON.parse(JSON.stringify(board));
          tempBoardForKingMove[newRow][newCol] = tempBoardForKingMove[row][col];
          tempBoardForKingMove[row][col] = null;

          if (!isSquareAttacked(tempBoardForKingMove, newRow, newCol, opponentColor)) {
              moves.push([newRow, newCol]);
          }
        }
      }
    }

    // --- CASTLING LOGIC (UPDATED WITH CHECK CONDITIONS) ---
    const kingCurrentlyInCheck = isKingInCheck(board, pieceColor);

    if (!kingCurrentlyInCheck) { // Cannot castle if king is currently in check
      if (pieceColor === PieceColor.WHITE) {
        // King-side castling (White: e1 to g1, h1 to f1)
        if (row === 7 && col === 4 && // King is at e1
          !hasWhiteKingMoved && !hasWhiteRookH1Moved &&
          board[7][5] === null && board[7][6] === null && // f1 and g1 are empty
          board[7][7] && board[7][7].type === PieceType.ROOK && board[7][7].color === PieceColor.WHITE) { // h1 has a white rook

          // Check if king's current square and squares it moves through are attacked
          if (!isSquareAttacked(board, 7, 5, opponentColor) && // f1 (square king moves through)
              !isSquareAttacked(board, 7, 6, opponentColor)) { // g1 (king's destination)
            moves.push([7, 6]); // King's destination for castling
          }
        }
        // Queen-side castling (White: e1 to c1, a1 to d1)
        if (row === 7 && col === 4 && // King is at e1
          !hasWhiteKingMoved && !hasWhiteRookA1Moved &&
          board[7][1] === null && board[7][2] === null && board[7][3] === null && // b1, c1, d1 are empty
          board[7][0] && board[7][0].type === PieceType.ROOK && board[7][0].color === PieceColor.WHITE) { // a1 has a white rook

          // Check if king's current square and squares it moves through are attacked
          if (!isSquareAttacked(board, 7, 3, opponentColor) && // d1 (square king moves through)
              !isSquareAttacked(board, 7, 2, opponentColor)) { // c1 (king's destination)
            moves.push([7, 2]); // King's destination for castling
          }
        }
      } else { // Black King
        // King-side castling (Black: e8 to g8, h8 to f8)
        if (row === 0 && col === 4 && // King is at e8
          !hasBlackKingMoved && !hasBlackRookH8Moved &&
          board[0][5] === null && board[0][6] === null && // f8 and g8 are empty
          board[0][7] && board[0][7].type === PieceType.ROOK && board[0][7].color === PieceColor.BLACK) { // h8 has a black rook

          // Check if king's current square and squares it moves through are attacked
          if (!isSquareAttacked(board, 0, 5, opponentColor) && // f8 (square king moves through)
              !isSquareAttacked(board, 0, 6, opponentColor)) { // g8 (king's destination)
            moves.push([0, 6]); // King's destination for castling
          }
        }
        // Queen-side castling (Black: e8 to c8, a8 to d8)
        if (row === 0 && col === 4 && // King is at e8
          !hasBlackKingMoved && !hasBlackRookA8Moved &&
          board[0][1] === null && board[0][2] === null && board[0][3] === null && // b8, c8, d1 are empty
          board[0][0] && board[0][0].type === PieceType.ROOK && board[0][0].color === PieceColor.BLACK) { // a8 has a black rook

          // Check if king's current square and squares it moves through are attacked
          if (!isSquareAttacked(board, 0, 3, opponentColor) && // d8 (square king moves through)
              !isSquareAttacked(board, 0, 2, opponentColor)) { // c8 (king's destination)
            moves.push([0, 2]); // King's destination for castling
          }
        }
      }
    } // End if (!kingCurrentlyInCheck)
    return moves;
  };

  // Helper function to get valid moves for a single piece (used internally for game status check)
  const _getValidMovesForPiece = (pieceRow, pieceCol, pieceObj, boardState, currentLastMove) => { // Added currentLastMove param
    let rawMoves = [];
    switch (pieceObj.type) {
      case PieceType.PAWN: rawMoves = getValidPawnMoves(boardState, pieceRow, pieceCol, pieceObj.color, currentLastMove); break; // Pass lastMove
      case PieceType.KNIGHT: rawMoves = getValidKnightMoves(boardState, pieceRow, pieceCol, pieceObj.color); break;
      case PieceType.ROOK: rawMoves = getValidRookMoves(boardState, pieceRow, pieceCol, pieceObj.color); break;
      case PieceType.BISHOP: rawMoves = getValidBishopMoves(boardState, pieceRow, pieceCol, pieceObj.color); break;
      case PieceType.QUEEN: rawMoves = getValidQueenMoves(boardState, pieceRow, pieceCol, pieceObj.color); break;
      case PieceType.KING: rawMoves = getValidKingMoves(boardState, pieceRow, pieceCol, pieceObj.color); break;
      default: break;
    }

    const possibleLegalMoves = [];
    const kingColor = pieceObj.color;

    for (const [targetR, targetC] of rawMoves) {
        const tempBoard = JSON.parse(JSON.stringify(boardState));
        const tempPiece = tempBoard[pieceRow][pieceCol]; // Get the piece from the temp board

        // Perform the move on the temporary board
        tempBoard[targetR][targetC] = tempPiece;
        tempBoard[pieceRow][pieceCol] = null;

        // Special handling for en passant capture in simulation
        if (tempPiece.type === PieceType.PAWN && pieceCol !== targetC && boardState[targetR][targetC] === null) {
            // This is a diagonal move to an empty square, indicating potential en passant
            // The captured pawn is on the original row of the captured pawn, same column as target
            const capturedPawnRow = pieceRow; // Same row as the attacking pawn
            const capturedPawnCol = targetC; // Same column as the target square
            tempBoard[capturedPawnRow][capturedPawnCol] = null; // Remove the captured pawn
        }

        // Simulate castling rook move for temp board check if it's a King move
        if (tempPiece.type === PieceType.KING) {
             if (tempPiece.color === PieceColor.WHITE) {
                 if (pieceRow === 7 && pieceCol === 4 && targetR === 7 && targetC === 6) { // King-side
                     tempBoard[7][5] = tempBoard[7][7]; tempBoard[7][7] = null;
                 } else if (pieceRow === 7 && pieceCol === 4 && targetR === 7 && targetC === 2) { // Queen-side
                     tempBoard[7][3] = tempBoard[7][0]; tempBoard[7][0] = null;
                 }
             } else { // Black
                 if (pieceRow === 0 && pieceCol === 4 && targetR === 0 && targetC === 6) { // King-side
                     tempBoard[0][5] = tempBoard[0][7]; tempBoard[0][7] = null;
                 } else if (pieceRow === 0 && pieceCol === 4 && targetR === 0 && targetC === 2) { // Queen-side
                     tempBoard[0][3] = tempBoard[0][0]; tempBoard[0][0] = null;
                 }
             }
         }

        if (!isKingInCheck(tempBoard, kingColor)) {
            possibleLegalMoves.push([targetR, targetC]);
        }
    }
    return possibleLegalMoves;
  };


  // Function to calculate and set valid moves for a given piece (updates state)
  const calculateAndSetValidMoves = (selectedPieceRow, selectedPieceCol) => {
    const piece = board[selectedPieceRow][selectedPieceCol];
    if (!piece || piece.color !== currentTurn) { // Ensure selected piece belongs to current turn
      setValidMoves([]);
      return;
    }

    // Reuse the internal helper to get valid moves based on game rules
    const finalValidMoves = _getValidMovesForPiece(selectedPieceRow, selectedPieceCol, piece, board, lastMove); // Pass lastMove
    setValidMoves(finalValidMoves);
  };

  // Function to check if the current player is checkmated or stalemated
  const checkGameStatus = (currentBoard, currentPlayerColor) => {
    const kingInCheck = isKingInCheck(currentBoard, currentPlayerColor);

    let hasAnyValidMove = false;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = currentBoard[r][c];
        if (piece && piece.color === currentPlayerColor) {
          // Check if this piece has ANY legal moves
          // For checkGameStatus, we need to pass a "null" lastMove because we are checking
          // if *any* move is possible, not if a specific en passant is valid based on a prior move.
          // The en passant rule itself is handled within getValidPawnMoves.
          const pieceValidMoves = _getValidMovesForPiece(r, c, piece, currentBoard, null); // Pass null for lastMove
          if (pieceValidMoves.length > 0) {
            hasAnyValidMove = true;
            break; // Found at least one legal move, not checkmate/stalemate
          }
        }
      }
      if (hasAnyValidMove) break;
    }

    if (!hasAnyValidMove) {
      if (kingInCheck) {
        return { gameOver: true, winner: (currentPlayerColor === PieceColor.WHITE ? PieceColor.BLACK : PieceColor.WHITE) }; // Checkmate
      } else {
        return { gameOver: true, winner: 'Draw' }; // Stalemate
      }
    }
    return { gameOver: false, winner: null }; // Game not over
  };

  // Handler for promotion choice
  const handlePromotionChoice = (chosenPieceType) => {
    if (!promotionDetails) return;

    const { row, col, color } = promotionDetails;
    const newBoard = JSON.parse(JSON.stringify(board));

    // Replace the pawn with the chosen piece type
    newBoard[row][col] = { type: chosenPieceType, color: color };

    // Update the board state in the parent (App.js)
    onPieceMove(convertBoardToAlgebraicNotation(newBoard));

    // Reset promotion state
    setIsPromoting(false);
    setPromotionDetails(null);

    // After promotion, clear selected square and valid moves
    setSelectedSquare(null);
    setValidMoves([]);

    // Now that promotion is done, switch turn and check game status
    const nextTurn = currentTurn === PieceColor.WHITE ? PieceColor.BLACK : PieceColor.WHITE;
    setCurrentTurn(nextTurn);
    const gameResult = checkGameStatus(newBoard, nextTurn);
    if (gameResult.gameOver) {
      setGameOver(true);
      setWinner(gameResult.winner);
    }
    // No need to update lastMove here, as promotion is the end of a move, not a new two-square pawn move.
  };


  // --- Click handler for each square ---
  const handleSquareClick = (row, col) => {
    if (gameOver || isPromoting) { // If game is over or promotion is in progress, no clicks are allowed
      console.log("Game is over or promotion in progress. No more moves allowed.");
      return;
    }

    const clickedSquareHasPiece = board[row][col] !== null;
    const clickedPiece = board[row][col]; // The piece on the clicked square

    if (selectedSquare) { // SCENARIO 1: A piece is already selected
      const [prevRow, prevCol] = selectedSquare;
      const pieceToMove = board[prevRow][prevCol]; // The piece that is currently selected

      if (prevRow === row && prevCol === col) {
        // Case 1.1: Clicked the same square as the selected piece -> Deselect
        setSelectedSquare(null);
        setValidMoves([]); // Clear valid moves
      } else if (clickedSquareHasPiece && pieceToMove.color === clickedPiece.color) {
        // Case 1.2: Clicked on a different piece of the *same color* -> Re-select the new piece
        // Check if the newly clicked piece belongs to the current turn
        if (clickedPiece.color !== currentTurn) {
          console.log(`It's ${currentTurn}'s turn. Cannot select ${clickedPiece.color} piece.`);
          setSelectedSquare(null); // Deselect if trying to re-select opponent's piece
          setValidMoves([]);
          return;
        }
        setSelectedSquare([row, col]);
        calculateAndSetValidMoves(row, col); // Calculate valid moves for the newly selected piece
      } else {
        // Case 1.3: Clicked on an empty square OR an opponent's piece -> Attempt move/capture
        // Check if the clicked square is one of the calculated valid moves
        const isValidMoveOrCapture = validMoves.some(
          (move) => move[0] === row && move[1] === col
        );

        if (isValidMoveOrCapture) {
          const newBoard = JSON.parse(JSON.stringify(board));
          newBoard[row][col] = pieceToMove; // Move piece (implicitly captures if clickedSquareHasPiece)
          newBoard[prevRow][prevCol] = null; // Clear previous position

          // --- En Passant Capture Execution ---
          // If a pawn moved diagonally to an empty square, it's an en passant capture
          // This check ensures it's a pawn, it moved diagonally, and the target square was empty
          // The captured pawn is located on the same row as the attacking pawn's *previous* row,
          // and in the target column.
          if (pieceToMove.type === PieceType.PAWN && prevCol !== col && board[row][col] === null) {
              const capturedPawnRow = prevRow; // The captured pawn is on the same row as the attacking pawn's start
              const capturedPawnCol = col; // The captured pawn is in the target column
              newBoard[capturedPawnRow][capturedPawnCol] = null; // Remove the captured pawn
          }


          // --- CASTLING SPECIFIC MOVE EXECUTION AND STATE UPDATES ---
          if (pieceToMove.type === PieceType.KING) {
              if (pieceToMove.color === PieceColor.WHITE) {
                  setHasWhiteKingMoved(true); // White King has moved permanently

                  // White King-side castling (e1 to g1)
                  if (prevRow === 7 && prevCol === 4 && row === 7 && col === 6) {
                      newBoard[7][5] = newBoard[7][7]; // Move h1 rook to f1
                      newBoard[7][7] = null; // Clear old rook position
                      setHasWhiteRookH1Moved(true); // h1 Rook has moved
                  }
                  // White Queen-side castling (e1 to c1)
                  else if (prevRow === 7 && prevCol === 4 && row === 7 && col === 2) {
                      newBoard[7][3] = newBoard[7][0]; // Move a1 rook to d1
                      newBoard[7][0] = null; // Clear old rook position
                      setHasWhiteRookA1Moved(true); // a1 Rook has moved
                  }
              } else { // Black King
                  setHasBlackKingMoved(true); // Black King has moved permanently

                  // Black King-side castling (e8 to g8)
                  if (prevRow === 0 && prevCol === 4 && row === 0 && col === 6) {
                      newBoard[0][5] = newBoard[0][7]; // Move h8 rook to f8
                      newBoard[0][7] = null; // Clear old rook position
                      setHasBlackRookH8Moved(true); // h8 Rook has moved
                  }
                  // Black Queen-side castling (e8 to c8)
                  else if (prevRow === 0 && prevCol === 4 && row === 0 && col === 2) {
                      newBoard[0][3] = newBoard[0][0]; // Move a8 rook to d8
                      newBoard[0][0] = null; // Clear old rook position
                      setHasBlackRookA8Moved(true); // a8 Rook has moved
                  }
              }
          } else if (pieceToMove.type === PieceType.ROOK) {
              // Update rook moved flags if a rook makes a normal move
              if (pieceToMove.color === PieceColor.WHITE) {
                  if (prevRow === 7 && prevCol === 0) setHasWhiteRookA1Moved(true); // Moved from a1
                  if (prevRow === 7 && prevCol === 7) setHasWhiteRookH1Moved(true); // Moved from h1
              } else { // Black Rook
                  if (prevRow === 0 && prevCol === 0) setHasBlackRookA8Moved(true); // Moved from a8
                  if (prevRow === 0 && prevCol === 7) setHasBlackRookH8Moved(true); // Moved from h8
              }
          }
          // --- END CASTLING SPECIFIC MOVE EXECUTION AND STATE UPDATES ---

          // --- PAWN PROMOTION CHECK ---
          if (pieceToMove.type === PieceType.PAWN &&
             ((pieceToMove.color === PieceColor.WHITE && row === 0) ||
              (pieceToMove.color === PieceColor.BLACK && row === 7))) {
            // Pawn reached the last rank, initiate promotion
            setIsPromoting(true);
            setPromotionDetails({ row, col, color: pieceToMove.color });
            // Do NOT switch turn or check game status yet. Promotion must complete first.
            // Only update the parent board state with the *pawn's* move for now.
            onPieceMove(convertBoardToAlgebraicNotation(newBoard));
            // Set lastMove for potential future en passant, even if promoting (though less common)
            setLastMove({ piece: pieceToMove, from: [prevRow, prevCol], to: [row, col] });
          } else {
            // Normal move or capture, update board and switch turn
            onPieceMove(convertBoardToAlgebraicNotation(newBoard));

            // Set lastMove for potential future en passant
            setLastMove({ piece: pieceToMove, from: [prevRow, prevCol], to: [row, col] });

            // After successful move/capture, deselect the piece and clear valid moves
            setSelectedSquare(null);
            setValidMoves([]);

            // Toggle turn after a successful move
            const nextTurn = currentTurn === PieceColor.WHITE ? PieceColor.BLACK : PieceColor.WHITE;
            setCurrentTurn(nextTurn);

            // Check game status for the player whose turn it now is
            const gameResult = checkGameStatus(newBoard, nextTurn);
            if (gameResult.gameOver) {
                setGameOver(true);
                setWinner(gameResult.winner);
            }
          }

        } else {
          // If the move is not valid according to `validMoves`, deselect and clear
          setSelectedSquare(null);
          setValidMoves([]);
          console.log("Invalid move for selected piece.");
        }
      }
    } else { // SCENARIO 2: No piece is currently selected
      if (clickedSquareHasPiece) { // If an actual piece is clicked
        // Prevent selection of opponent's piece on their turn
        if (clickedPiece.color !== currentTurn) {
          console.log(`It's ${currentTurn}'s turn. Cannot select ${clickedPiece.color} piece.`);
          return; // Stop here, disallow selection
        }
        // Select the clicked piece
        setSelectedSquare([row, col]);
        calculateAndSetValidMoves(row, col); // Calculate valid moves for the newly selected piece
      }
      // If an empty square is clicked when nothing is selected, do nothing
    }
  };

  // --- Renders a single square on the chessboard ---
  const renderSquare = (row, col) => {
    const isDarkSquare = (row + col) % 2 === 0;
    let squareClassName = isDarkSquare ? 'square dark' : 'square light';

    // Apply 'selected-square' class if this square is currently selected
    if (selectedSquare && selectedSquare[0] === row && selectedSquare[1] === col) {
      squareClassName += ' selected-square';
    }

    // Determine if the current square is a valid move target
    const isValidMoveSquare = validMoves.some(
      (move) => move[0] === row && move[1] === col
    );

    const displayRank = ranks[row];
    const displayFile = files[col];

    const pieceOnSquare = board[row][col];
    let pieceToRender = null;

    if (pieceOnSquare) {
      pieceToRender = <Piece type={pieceOnSquare.type} color={pieceOnSquare.color} />;
    }

    return (
      <div
        key={`${displayFile}${displayRank}`}
        className={squareClassName}
        onClick={() => handleSquareClick(row, col)}
      >
        {pieceToRender}
        <div className="square-label-rank">{displayRank}</div>
        <div className="square-label-file">{displayFile}</div>
        {/* Conditionally render the valid move indicator div */}
        {isValidMoveSquare && <div className="valid-move-indicator"></div>}
      </div>
    );
  };

  // --- Renders the entire 8x8 chessboard ---
  const renderBoard = () => {
    const boardElements = [];
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        boardElements.push(renderSquare(i, j));
      }
    }
    return boardElements;
  };

  return (
    // Add 'piece-selected' class to the chessboard container when a piece is selected
    <div className={`chessboard ${selectedSquare ? 'piece-selected' : ''}`}>
      {renderBoard()}

      {/* Render the GameOverPopup when game is over */}
      {gameOver && (
        <GameOverPopup
          winner={winner}
          onClose={() => {
            setGameOver(false);
            setWinner(null);
            setCurrentTurn(PieceColor.WHITE);
            setSelectedSquare(null);
            setValidMoves([]);
            setLastMove(null); // Reset lastMove on game reset
            if (onGameReset) {
              onGameReset();
            }
            // Reset castling flags for a new game
            setHasWhiteKingMoved(false);
            setHasWhiteRookA1Moved(false);
            setHasWhiteRookH1Moved(false);
            setHasBlackKingMoved(false);
            setHasBlackRookA8Moved(false);
            setHasBlackRookH8Moved(false);
          }}
        />
      )}

      {/* NEW: Render PromotionPopup when isPromoting is true */}
      {isPromoting && promotionDetails && (
        <PromotionPopup
          pawnColor={promotionDetails.color}
          onChoice={handlePromotionChoice}
        />
      )}
    </div>
  );
};

// --- Prop Types for Chessboard Component ---
Chessboard.propTypes = {
  piecePositions: PropTypes.arrayOf(
    PropTypes.arrayOf(PropTypes.string).isRequired
  ).isRequired,
  onPieceMove: PropTypes.func.isRequired,
  onGameReset: PropTypes.func,
};

export default Chessboard;
