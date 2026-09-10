import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
    optimizePackageImports: ["@prisma/client", "@vercel/blob"],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.blob.vercel-storage.com",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/fonts/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET, OPTIONS" },
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/:all*(svg|jpg|png|webp|woff2)",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/index.html",
        destination: "/",
        permanent: true,
      },
      {
        source: "/kamar.html",
        destination: "/kamar",
        permanent: true,
      },
      {
        source: "/penghuni.html",
        destination: "/penghuni",
        permanent: true,
      },
      {
        source: "/laporan.html",
        destination: "/laporan",
        permanent: true,
      },
      {
        source: "/pengaturan.html",
        destination: "/pengaturan",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
