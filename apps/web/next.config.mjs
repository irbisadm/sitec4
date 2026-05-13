import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  transpilePackages: [],
  outputFileTracingRoot: path.join(__dirname, '../..'),
  webpack: (config) => config,
}

export default nextConfig
