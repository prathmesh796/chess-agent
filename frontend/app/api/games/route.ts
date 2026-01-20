import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  const body = await req.json();

  console.log(body);

  const game = await prisma.game.create({
    data: {
      result: body.result,
      pgn: body.pgn,
      fen: body.fen,
      modelVersion: body.modelVersion,
      status: body.status,
    },
  });

  if(!game) {
    return Response.json({ ok: false, error: "Failed to create game" }, { status: 500 });
  }

  return Response.json({ ok: true, game });
}
