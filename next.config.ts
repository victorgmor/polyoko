import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // avoid parent ~/package-lock.json stealing the workspace root
  outputFileTracingRoot: path.join(__dirname),
};

export default nextConfig;
