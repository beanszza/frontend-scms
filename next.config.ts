import type { NextConfig } from "next";

const scmsApiUrl = (
  process.env.SCMS_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5006"
).replace(/\/$/, "");

const authApiUrl = (
  process.env.AUTH_API_URL ||
  "http://localhost:5007"
).replace(/\/$/, "");

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/scms/:path*",
        destination: `${scmsApiUrl}/:path*`,
      },
      {
        source: "/api/erp-auth/:path*",
        destination: `${authApiUrl}/api/erp-auth/:path*`,
      },
      {
        source: "/api/:path*",
        destination: `${scmsApiUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;