import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable StrictMode to prevent duplicate API calls and video connections
  // StrictMode causes components to mount/unmount twice in development
  reactStrictMode: false,
  
  // Set the correct root directory to silence lockfile warning
  turbopack: {
    root: __dirname,
  },
  // External packages for server components
  serverExternalPackages: [],
};

export default nextConfig;
