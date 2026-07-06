import type { NextConfig } from "next";

const isGithubPages = process.env.DEPLOY_TARGET === "github-pages";

const nextConfig: NextConfig = {
  output: isGithubPages ? "export" : "standalone",
  basePath: isGithubPages ? "/d-n-ph-c-nguy-n" : "",
  images: {
    unoptimized: isGithubPages ? true : undefined,
  },
};

export default nextConfig;
