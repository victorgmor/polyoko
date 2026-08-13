import type { APIRoute } from "astro";
import { hubSvg } from "../lib/shapes";

export const GET: APIRoute = () =>
  new Response(
    hubSvg().replace(
      'viewBox="0 0 191.885 191.89"',
      'viewBox="-36 -36 264 264"',
    ),
    { headers: { "Content-Type": "image/svg+xml; charset=utf-8" } },
  );
