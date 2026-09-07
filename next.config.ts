import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/scms/:path*",
        destination: "http://localhost:5006/api/scms/:path*",
      },
      {
        source: "/api/erp-auth/:path*",
        destination: "http://localhost:5007/api/erp-auth/:path*",
      },
    ];
  },
};

export default nextConfig;
