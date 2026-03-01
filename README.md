# Chess Application

This is a browser-based React chess application that allows two players to play chess locally (pass-and-play). It features a fully functional chessboard with move validation for all piece types, castling, en passant, pawn promotion, check, and checkmate detection.

## Features
- **Full Chess Rules Engine:** Includes all standard moves, captures, castling, and en passant.
- **Game State Management:** Tracks turns, check, checkmate, and stalemate.
- **Pawn Promotion:** Interactive popup to choose the promoted piece.
- **URL-Based Game Initialization:** Supports loading a game by an ID via URL parameters (e.g., `?id=123`).

## Prerequisites
- [Node.js](https://nodejs.org/) (recommended v16 or higher)
- npm (comes with Node.js)

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```
2. **Start the development server:**
   ```bash
   npm start
   ```
3. Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

## How to Contribute

The project uses a standard React component architecture bootstrapped with Create React App. Here is a brief overview of the folder structure:

- `/src/components/chessboard`: Contains the main `Chessboard` logic, board rendering, and move validation rules.
- `/src/components/gamecontroller`: Houses `GameController` which manages the board state and URL parameters.
- `/src/components/piece`: Definitions and SVG assets for all chess pieces.
- `/src/components/promotionpopup`: The UI for handling pawn promotion.
- `/src/components/gameover`: The UI for displaying match results (checkmate, draw).

### Development Scripts
- `npm start` - Runs the app in development mode.
- `npm test` - Launches the interactive test runner.
- `npm run build` - Builds the app for production in the `build` folder.

If you are adding new rules or fixing bugs in piece movement, refer to `Chessboard.js` which houses most of the business logic including `getValidPawnMoves`, `getValidKnightMoves`, etc.
