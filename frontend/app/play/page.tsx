"use client";

import { useState } from "react";
import { Chess } from "chess.js";
import dynamic from "next/dynamic";

// Dynamically import the ChessBoardWrapper to avoid SSR issues
const ChessBoardWrapper = dynamic(() => import("./ChessBoardWrapper").then((mod) => ({ default: mod.ChessBoardWrapper })),
    { 
        ssr: false,
        loading: () => <div className="w-[600px] h-[600px] bg-gray-100 flex items-center justify-center">Loading chessboard...</div>
    }
);

export default function PlayPage() {
    const [game, setGame] = useState(new Chess());
    const [fen, setFen] = useState(game.fen());
    const [isThinking, setIsThinking] = useState(false);

    async function makeAIMove(currentFen: string) {
        setIsThinking(true);

        const res = await fetch("/api/move", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fen: currentFen }),
        });

        const data = await res.json();

        const newGame = new Chess(currentFen);
        newGame.move({
            from: data.move.slice(0, 2),
            to: data.move.slice(2, 4),
            promotion: "q",
        });

        setGame(newGame);
        setFen(newGame.fen());
        setIsThinking(false);
    }

    return (
        <div className="flex flex-col items-center gap-4 p-8">
            <h1 className="text-2xl font-bold">Play vs AI</h1>

            <div style={{ width: '600px', maxWidth: '90vw' }}>
                <ChessBoardWrapper
                    initialFen={fen}
                />
            </div>

            {isThinking && <p>AI is thinking...</p>}
        </div>
    );
}