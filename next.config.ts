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
        // Auth service proxy
        source: "/api/erp-auth/:path*",
        destination: `${authApiUrl}/api/erp-auth/:path*`,
      },
      {
        // api-sims (Next.js, replaces C# api-ims).
        // Old frontend called /api/scms/api/Items → C# UsePathBase stripped /api/scms
        // → landed at /api/Items on C#.
        // New api-sims serves same routes at /api/items (kebab-case, lowercase).
        // This rewrite strips the /api/scms/api/ prefix and forwards to api-sims /api/.
        source: "/api/scms/api/:path*",
        destination: `${scmsApiUrl}/api/:path*`,
      },
      {
        // Catch-all for any remaining /api/scms/* calls (legacy paths without /api/ segment)
        source: "/api/scms/:path*",
        destination: `${scmsApiUrl}/api/:path*`,
      },
      {
        source: "/api/:path*",
        destination: `${scmsApiUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;