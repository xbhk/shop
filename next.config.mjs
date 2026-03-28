/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  images: {
    unoptimized: true
  },
  // Exclude server-only modules from client bundle
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.externals = config.externals || [];
      // Make better-sqlite3 external so it only runs on server
      config.externals.push({
        'better-sqlite3': 'commonjs better-sqlite3'
      });
    }
    return config;
  }
};

export default nextConfig;
