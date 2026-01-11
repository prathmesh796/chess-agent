export const makeAIMove = async (fen: string) => {
    const res = await fetch("/api/move", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fen }),
    });

    const data = await res.json();

    return data;
}