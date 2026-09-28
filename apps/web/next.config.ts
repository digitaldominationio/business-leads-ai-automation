import path from "path";
import type { NextConfig } from "next";

const apiProxyTarget = process.env.API_PROXY_TARGET || "http://api:3001";

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: ["@prospex/types"],
  turbopack: {
    root: path.join(__dirname, "..", ".."),
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${apiProxyTarget}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
