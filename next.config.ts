import type { NextConfig } from "next";

const scmsApiUrl = (process.env.SCMS_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:5006").replace(/\/$/, "");
const authApiUrl = (process.env.AUTH_API_URL || "http://localhost:5007").replace(/\/$/, "");

const isDirectScmService = scmsApiUrl.includes(":5006");
const scmsDestination = isDirectScmService
  ? `${scmsApiUrl}/:path*`
  : `${scmsApiUrl}/api/scms/:path*`;

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/scms/:path*",
        destination: scmsDestination,
      },
      {
        source: "/api/erp-auth/:path*",
        destination: `${authApiUrl}/api/erp-auth/:path*`,
      },
    ];
  },
};

export default nextConfig;
