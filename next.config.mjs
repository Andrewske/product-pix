import createMDX from '@next/mdx'

/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],
  typescript: {
    tsconfigPath: './tsconfig.build.json',
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'pub-76304578acde4439afba93b377f6b24c.r2.dev',
        port: '',
        pathname: '/**',
      },
    ],
  },
}

// Use string names for plugins (required for Turbopack - functions can't be serialized to Rust)
const withMDX = createMDX({
  options: {
    remarkPlugins: ['remark-gfm'],
    rehypePlugins: ['rehype-slug', ['rehype-autolink-headings', { behavior: 'wrap' }]],
  },
})

export default withMDX(nextConfig)
