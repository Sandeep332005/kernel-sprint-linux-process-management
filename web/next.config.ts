import type { NextConfig } from "next";

const repoName = "kernel-sprint-linux-process-management";

const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  basePath: process.env.NEXT_PUBLIC_BASE_PATH ?? "/" + repoName,
  assetPrefix: process.env.NEXT_PUBLIC_BASE_PATH ?? "/" + repoName,
};

export default nextConfig;
