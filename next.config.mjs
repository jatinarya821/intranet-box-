/** @type {import('next').NextConfig} */
const nextConfig = {
  // Mark better-sqlite3 as server-side only (native module — cannot be bundled)
  serverExternalPackages: ['better-sqlite3'],
};

export default nextConfig;
