/** @type {import('next').NextConfig} */
const nextConfig = {
  // Default server-action body limit (1MB) is too small for a fee-policy PDF upload.
  experimental: {
    serverActions: {
      bodySizeLimit: '15mb',
    },
  },
};

export default nextConfig;
