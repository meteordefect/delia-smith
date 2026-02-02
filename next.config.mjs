/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['gsap'],
  // Include data folder in serverless function bundles for Vercel
  outputFileTracingIncludes: {
    '/': ['./data/**/*'],
    '/[country]': ['./data/**/*'],
  },
};

export default nextConfig;
