/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
    domains: ["firebasestorage.googleapis.com"],
    imageSizes: [16, 32, 48, 64, 96],
    path: "/_next/image",
  },
  output: "export",
};

export default nextConfig;
