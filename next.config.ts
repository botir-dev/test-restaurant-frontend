import type { NextConfig } from "next";
const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/.*\/api\/.*/i,
      handler: "NetworkFirst",
      options: {
        cacheName: "api-cache",
        expiration: { maxEntries: 200, maxAgeSeconds: 24 * 60 * 60 },
        networkTimeoutSeconds: 5,
      },
    },
    {
      urlPattern: /\.(png|jpg|jpeg|svg|gif|webp|ico)$/i,
      handler: "CacheFirst",
      options: {
        cacheName: "image-cache",
        expiration: { maxEntries: 100, maxAgeSeconds: 7 * 24 * 60 * 60 },
      },
    },
    {
      urlPattern: /^https:\/\/.*/i,
      handler: "NetworkFirst",
      options: {
        cacheName: "others-cache",
        expiration: { maxEntries: 100, maxAgeSeconds: 24 * 60 * 60 },
        networkTimeoutSeconds: 5,
      },
    },
  ],
});

const nextConfig: NextConfig = {
  images: { remotePatterns: [{ protocol: "https", hostname: "**" }] },

  // MANA SHU QATORNI QO'SHDIK:
  turbopack: {},
};

module.exports = withPWA(nextConfig);
