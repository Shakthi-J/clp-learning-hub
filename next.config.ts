import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "img.youtube.com" },
      { protocol: "https", hostname: "vgzxzxpfymhttrxvpjeq.supabase.co" },
    ],
  },
};

export default nextConfig;
