import type { APIRoute } from "astro";
import { hubSvg } from "../lib/shapes";

export const GET: APIRoute = () =>
  new Response(
    hubSvg().replace(
      'viewBox="0 0 141.667 92.254"',
      'viewBox="-24 -40 190 172"',
    ),
    { headers: { "Content-Type": "image/svg+xml; charset=utf-8" } },
  );
