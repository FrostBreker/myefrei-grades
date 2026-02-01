import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    // Required for optimized Docker builds
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
