import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
    optimizePackageImports: ["@prisma/client", "@vercel/blob"],
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
