import type { NextConfig } from "next";

const allowedDevOrigins = [
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "*.ngrok.io",
  "*.ngrok.app",
  "*.ngrok-free.app",
  "*.ngrok-free.dev",
  "*.loca.lt",
  "*.trycloudflare.com",
];

const config: NextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  allowedDevOrigins,
};

export default config;
