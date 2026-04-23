import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Disabled on purpose: module paths come from MODULE_REGISTRY (runtime
  // config), so static route typing doesn't apply to our config-driven nav.
  typedRoutes: false,
}

export default nextConfig
