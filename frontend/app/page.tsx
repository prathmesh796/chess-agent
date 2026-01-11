"use client";

import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <h1 className="text-4xl font-bold text-gray-900 mb-2">Chess Agent</h1>
      <p className="text-lg text-gray-600 mb-6">Play chess against the AI</p>

      <button
        onClick={() => router.push("/play")}
        className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium shadow-sm"
      >
        Play
      </button>
    </div>
  );
}
