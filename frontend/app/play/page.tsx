"use client";

import dynamic from "next/dynamic";

// Dynamically import the ChessBoardWrapper to avoid SSR issues
const ChessBoardWrapper = dynamic(() => import("./ChessBoardWrapper").then((mod) => ({ default: mod.ChessBoardWrapper })),
    { 
        ssr: false,
        loading: () => <div className="w-[600px] h-[600px] bg-gray-100 flex items-center justify-center">Loading chessboard...</div>
    }
);

export default function PlayPage() {
    return (
        <div className="flex flex-col items-center gap-4 p-8">
            <h1 className="text-2xl font-bold">Play vs AI</h1>

            <div style={{ width: '600px', maxWidth: '90vw' }}>
                <ChessBoardWrapper
                    initialFen="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w - - 0 1"
                />
            </div>
        </div>
    );
}