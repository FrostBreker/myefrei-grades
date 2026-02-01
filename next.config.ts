import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    // Enable standalone output for Docker deployment
    output: 'standalone',

    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'lh3.googleusercontent.com',
            },
        ],
    },
};

export default nextConfig;
