/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Allow images from eBird and other external sources
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ebird.org',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.download.ams.birds.cornell.edu',
        pathname: '/**',
      },
    ],
  },
  // Enable static exports if needed
  // output: 'export',
}

module.exports = nextConfig 