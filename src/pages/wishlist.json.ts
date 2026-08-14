import type { APIRoute } from "astro";
import http from "node:http";
import https from "node:https";

export const prerender = false;

const UPSTREAMS = [
  "https://51.20.98.145/wishlist.json",
  "http://51.20.98.145/wishlist.json",
];

function pull(url: string): Promise<string> {
  const lib = url.startsWith("https") ? https : http;
  return new Promise((resolve, reject) => {
    const req = lib.get(
      url,
      { rejectUnauthorized: false, timeout: 8000 },
      (res) => {
        if ((res.statusCode ?? 500) >= 400) {
          reject(new Error(String(res.statusCode)));
          res.resume();
          return;
        }
        const chunks: Buffer[] = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => resolve(Buffer.concat(chunks).toString()));
      },
    );
    req.on("error", reject);
    req.on("timeout", () => req.destroy(new Error("timeout")));
  });
}

export const GET: APIRoute = async () => {
  for (const url of UPSTREAMS) {
    try {
      const body = await pull(url);
      JSON.parse(body);
      return new Response(body, {
        headers: {
          "content-type": "application/json; charset=utf-8",
          "cache-control": "public, max-age=15",
        },
      });
    } catch {
      // try next
    }
  }
  return new Response(JSON.stringify({ options: [] }), {
    status: 502,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
};
