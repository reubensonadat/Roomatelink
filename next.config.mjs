/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ['*'], // Allow all origins for server actions
    },
  },
};

export default nextConfig;
