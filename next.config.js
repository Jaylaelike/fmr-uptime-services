/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Remove the static export configuration
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;