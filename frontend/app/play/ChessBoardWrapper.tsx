"use client";

import { useState } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import { makeAIMove } from "../../actions/move";

interface ChessBoardWrapperProps {
    initialFen: string;
}

export function ChessBoardWrapper({ initialFen }: ChessBoardWrapperProps) {
    const [game, setGame] = useState(new Chess(initialFen));
    const [fen, setFen] = useState(initialFen);
    const [moves, setMoves] = useState<string[][]>([]);

    // Handle move validation (only for non-review mode)
    const onDrop = async ({ piece, sourceSquare, targetSquare }: {
        piece: { isSparePiece: boolean; position: string; pieceType: string };
        sourceSquare: string;
        targetSquare: string | null
    }) => {
        // If piece is dropped off the board, reject the move
        if (!targetSquare) return false;

        const newGame = new Chess(game.fen());

        const move = newGame.move({
            from: sourceSquare,
            to: targetSquare,
            promotion: "q",
        });

        if (move === null) return false;

        setGame(newGame);
        setFen(newGame.fen());

        // Let AI respond
        const aiMove = await makeAIMove(newGame.fen());

        newGame.move(aiMove.move);

        setGame(newGame);
        setFen(newGame.fen());

        return true;
    }

    return (
        <Chessboard
            options={{
                position: fen,
                boardStyle: {
                    borderRadius: "8px",
                    boxShadow: "0 8px 16px rgba(0, 0, 0, 0.4)",
                },
                onPieceDrop: onDrop,
                allowDragging: true,
            }}
        />
    );
}
