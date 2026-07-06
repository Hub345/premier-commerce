/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Compile the shared protocol package from source (it ships .ts, not built JS).
  transpilePackages: ["@premier/protocol"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "*.supabase.in" },
    ],
  },
};

export default nextConfig;
