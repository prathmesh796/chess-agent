"use client";

import { useState, useRef } from "react";
import { Chess, Square } from "chess.js";
import { Chessboard, PieceDropHandlerArgs, SquareHandlerArgs } from "react-chessboard";

interface ChessBoardWrapperProps {
    initialFen: string;
}

type GameOverState = {
    isOver: boolean;
    result?: 'win' | 'loss' | 'draw';
    reason?: string;
};

export function ChessBoardWrapper({ initialFen }: ChessBoardWrapperProps) {
    const [gameOver, setGameOver] = useState<GameOverState>({ isOver: false });
    const [isSaving, setIsSaving] = useState(false);

    const chessGameRef = useRef(new Chess());
    const chessGame = chessGameRef.current;

    // track the current position of the chess game in state to trigger a re-render of the chessboard
    const [chessPosition, setChessPosition] = useState(chessGame.fen());
    const [moveFrom, setMoveFrom] = useState('');
    const [optionSquares, setOptionSquares] = useState({});

    // Function to check if game is over and determine the result
    function checkGameOver() {
        if (chessGame.isGameOver()) {
            let result: 'win' | 'loss' | 'draw';
            let reason: string;

            if (chessGame.isCheckmate()) {
                // If it's checkmate, the current turn player lost
                // Since player is white and AI is black
                if (chessGame.turn() === 'w') {
                    result = 'loss';
                    reason = 'Checkmate - AI (Black) wins!';
                } else {
                    result = 'win';
                    reason = 'Checkmate - You (White) win!';
                }
            } else if (chessGame.isStalemate()) {
                result = 'draw';
                reason = 'Stalemate';
            } else if (chessGame.isThreefoldRepetition()) {
                result = 'draw';
                reason = 'Draw by threefold repetition';
            } else if (chessGame.isInsufficientMaterial()) {
                result = 'draw';
                reason = 'Draw by insufficient material';
            } else if (chessGame.isDraw()) {
                result = 'draw';
                reason = 'Draw by 50-move rule';
            } else {
                result = 'draw';
                reason = 'Game Over';
            }

            setGameOver({ isOver: true, result, reason });
            saveGameToDatabase(result, reason);
            return true;
        }
        return false;
    }

    // Function to save game to database
    async function saveGameToDatabase(result: 'win' | 'loss' | 'draw', reason: string) {
        if (isSaving) return; // Prevent duplicate saves

        setIsSaving(true);

        try {
            const pgn = chessGame.pgn();
            const fen = chessGame.fen();

            const response = await fetch('/api/games', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    result,
                    pgn,
                    fen,
                    modelVersion: 'random-v1', // Update this when you implement a real AI
                    status: 'completed',
                }),
            });

            if (!response.ok) {
                console.error('Failed to save game:', await response.text());
            } else {
                console.log('Game saved successfully!');
            }
        } catch (error) {
            console.error('Error saving game:', error);
        } finally {
            setIsSaving(false);
        }
    }

    function makeRandomMove() {
        // get all possible moves
        const possibleMoves = chessGame.moves();

        // exit if the game is over
        if (chessGame.isGameOver()) {
            return;
        }

        // pick a random move
        const randomMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];

        // make the move
        chessGame.move(randomMove);

        // update the position state
        setChessPosition(chessGame.fen());

        // check if game is over after AI move
        checkGameOver();
    }

    function getMoveOptions(square: Square) {
        // get the moves for the square
        const moves = chessGame.moves({
            square,
            verbose: true
        });

        // if no moves, clear the option squares
        if (moves.length === 0) {
            setOptionSquares({});
            return false;
        }

        // create a new object to store the option squares
        const newSquares: Record<string, React.CSSProperties> = {};

        // loop through the moves and set the option squares
        for (const move of moves) {
            newSquares[move.to] = {
                background: chessGame.get(move.to) && chessGame.get(move.to)?.color !== chessGame.get(square)?.color ? 'radial-gradient(circle, rgba(0,0,0,.1) 85%, transparent 85%)' // larger circle for capturing
                    : 'radial-gradient(circle, rgba(0,0,0,.1) 25%, transparent 25%)',
                // smaller circle for moving
                borderRadius: '50%'
            };
        }

        // set the square clicked to move from to yellow
        newSquares[square] = {
            background: 'rgba(255, 255, 0, 0.4)'
        };

        // set the option squares
        setOptionSquares(newSquares);

        // return true to indicate that there are move options
        return true;
    }

    function onSquareClick({
        square,
        piece
    }: SquareHandlerArgs) {
        // piece clicked to move
        if (!moveFrom && piece) {
            // get the move options for the square
            const hasMoveOptions = getMoveOptions(square as Square);

            // if move options, set the moveFrom to the square
            if (hasMoveOptions) {
                setMoveFrom(square);
            }

            // return early
            return;
        }

        // square clicked to move to, check if valid move
        const moves = chessGame.moves({
            square: moveFrom as Square,
            verbose: true
        });
        const foundMove = moves.find(m => m.from === moveFrom && m.to === square);

        // not a valid move
        if (!foundMove) {
            // check if clicked on new piece
            const hasMoveOptions = getMoveOptions(square as Square);

            // if new piece, setMoveFrom, otherwise clear moveFrom
            setMoveFrom(hasMoveOptions ? square : '');

            // return early
            return;
        }

        // is normal move
        try {
            chessGame.move({
                from: moveFrom,
                to: square,
                promotion: 'q'
            });
        } catch {
            // if invalid, setMoveFrom and getMoveOptions
            const hasMoveOptions = getMoveOptions(square as Square);

            // if new piece, setMoveFrom, otherwise clear moveFrom
            if (hasMoveOptions) {
                setMoveFrom(square);
            }

            // return early
            return;
        }

        // update the position state
        setChessPosition(chessGame.fen());

        // check if game is over after player move
        if (checkGameOver()) {
            // clear moveFrom and optionSquares
            setMoveFrom('');
            setOptionSquares({});
            return;
        }

        // make random cpu move after a short delay
        setTimeout(makeRandomMove, 300);

        // clear moveFrom and optionSquares
        setMoveFrom('');
        setOptionSquares({});
    }

    function onPieceDrop({
        sourceSquare,
        targetSquare
    }: PieceDropHandlerArgs) {
        // type narrow targetSquare potentially being null (e.g. if dropped off board)
        if (!targetSquare) {
            return false;
        }

        // try to make the move according to chess.js logic
        try {
            chessGame.move({
                from: sourceSquare,
                to: targetSquare,
                promotion: 'q' // always promote to a queen for example simplicity
            });

            // update the position state upon successful move to trigger a re-render of the chessboard
            setChessPosition(chessGame.fen());

            // clear moveFrom and optionSquares
            setMoveFrom('');
            setOptionSquares({});

            // check if game is over after player move
            if (checkGameOver()) {
                return true;
            }

            // make random cpu move after a short delay
            setTimeout(makeRandomMove, 500);

            // return true as the move was successful
            return true;
        } catch {
            // return false as the move was not successful
            return false;
        }
    }

    const chessboardOptions = {
        onPieceDrop,
        onSquareClick,
        position: chessPosition,
        squareStyles: optionSquares,
        id: 'click-or-drag-to-move'
    };

    return (
        <div className="flex flex-col items-center gap-4">
            <Chessboard
                options={chessboardOptions}
            />
            {gameOver.isOver && (
                <div className="w-full max-w-2xl mt-4 p-6 rounded-lg border-2 text-center bg-linear-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900">
                    <h2 className="text-2xl font-bold mb-2">
                        {gameOver.result === "win" && "🎉 Victory!"}
                        {gameOver.result === "loss" && "😔 Defeat"}
                        {gameOver.result === "draw" && "🤝 Draw"}
                    </h2>
                    <p className="text-lg mb-3 text-slate-700 dark:text-slate-300">
                        {gameOver.reason}
                    </p>

                    {isSaving ? (
                        <p className="text-sm text-blue-600 dark:text-blue-400 mb-3">
                            💾 Saving game to database...
                        </p>
                    ) : (
                        <p className="text-sm text-green-600 dark:text-green-400 mb-3">
                            ✅ Game saved successfully!
                        </p>
                    )}

                    <div className="mt-4 p-3 bg-white dark:bg-slate-700 rounded border border-slate-200 dark:border-slate-600">
                        <p className="text-xs font-mono text-left overflow-x-auto whitespace-pre-wrap break-all">
                            <strong>PGN:</strong> {chessGame.pgn()}
                        </p>
                    </div>

                    <button
                        onClick={() => window.location.reload()}
                        className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                    >
                        New Game
                    </button>
                </div>
            )}
        </div>
    );
}
