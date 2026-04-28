/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' }
    ]
  },
  experimental: { serverActions: { allowedOrigins: ['localhost:3000', 'engli.ge'] } }
};
module.exports = nextConfig;
