import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@repo/shared-types', '@repo/zod-schemas'],
};

export default nextConfig;
