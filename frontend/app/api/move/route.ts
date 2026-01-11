import { Chess } from "chess.js";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const body = await req.json();
  const { fen } = body;

  if (!fen) {
    return Response.json(
      { error: "FEN is required" },
      { status: 400 }
    );
  }

  const chess = new Chess(fen);

  const legalMoves = chess.moves({ verbose: true });

  if (legalMoves.length === 0) {
    console.log("No legal moves available");

    const newGame = prisma.game.create({
      data: {
        pgn: "",
        fen: fen,
        modelVersion: "0.1",
        status: "fresh",
        result: "draw",
      },
    });

    console.log("New game created", newGame);

    return Response.json(
      { message: "Game created" },
      { status: 201 }
    );
  }

  // 🎲 Random legal move (temporary AI)
  const randomMove = legalMoves[Math.floor(Math.random() * legalMoves.length)];

  chess.move(randomMove);

  return Response.json({
    move: randomMove.from + randomMove.to,
    san: randomMove.san,
    fen: chess.fen(),
  });
}