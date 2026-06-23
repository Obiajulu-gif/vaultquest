import path from "path";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@vaultquest/stellar-wallet-connect"],
  webpack(config) {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@react-native-async-storage/async-storage": path.resolve(
        "./lib/shims/async-storage.js",
      ),
    };
    return config;
  },
};

export default nextConfig;
