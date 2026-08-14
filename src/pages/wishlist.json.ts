import type { APIRoute } from "astro";
import { get } from "@vercel/blob";

export const prerender = false;

const EMPTY = {
  updatedAt: null,
  options: [] as Array<{ id: string; label: string; votes: number }>,
};

function publicPayload(value: unknown) {
  const source = value as { updatedAt?: unknown; options?: unknown };
  if (!Array.isArray(source?.options)) throw new Error("Invalid wishlist payload");
  return {
    updatedAt: typeof source.updatedAt === "string" ? source.updatedAt : null,
    options: source.options
      .slice(0, 100)
      .map((item) => item as Record<string, unknown>)
      .filter(
        (item) =>
          typeof item.id === "string" &&
          typeof item.label === "string" &&
          typeof item.votes === "number" &&
          Number.isInteger(item.votes) &&
          item.votes >= 0,
      )
      .map((item) => ({
        id: String(item.id),
        label: String(item.label),
        votes: Number(item.votes),
      })),
  };
}

export const GET: APIRoute = async () => {
  try {
    const blob = await get("wishlist/current.json", {
      access: "private",
      useCache: false,
    });
    const payload = blob
      ? publicPayload(await new Response(blob.stream).json())
      : EMPTY;
    return Response.json(payload, {
      headers: { "cache-control": "public, s-maxage=15, stale-while-revalidate=60" },
    });
  } catch {
    return Response.json(EMPTY, {
      status: 503,
      headers: { "cache-control": "no-store" },
    });
  }
};
