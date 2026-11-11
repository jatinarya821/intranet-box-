import { networkInterfaces } from 'node:os';

const lanAddresses = Object.values(networkInterfaces())
  .flat()
  .filter((address) => address && address.family === 'IPv4' && !address.internal)
  .map((address) => address.address);

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Mark better-sqlite3 as server-side only (native module — cannot be bundled)
  serverExternalPackages: ['better-sqlite3'],
  allowedDevOrigins: lanAddresses,
};

export default nextConfig;
