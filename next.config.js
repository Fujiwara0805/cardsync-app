/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove output: 'export' to enable dynamic API routes
  reactStrictMode: true,
  images: {
    domains: ['lh3.googleusercontent.com'], // Allow Google profile images
  }
}

module.exports = nextConfig