import { hubSvg } from "@/lib/shapes";

export function GET() {
  return new Response(hubSvg(), {
    headers: { "Content-Type": "image/svg+xml; charset=utf-8" },
  });
}
