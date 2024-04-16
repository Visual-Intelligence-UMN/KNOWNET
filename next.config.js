const nextConfig = {
  typescript: {
    ignoreBuildErrors: true
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        pathname: '**'
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '**'
      }
    ]
  },
  rewrites: async () => {
    return [
      // Rewrite for chat API
      {
        source: '/api/chat/:path*',
        destination:
          process.env.NODE_ENV === 'development'
            ? 'http://34.192.167.210:5328/api/chat/:path*'
            : 'http://34.192.167.210:5328/api/chat/:path*'
      },
      // Rewrite for nodes API
      {
        source: '/api/nodes/:path*',
        destination:
          process.env.NODE_ENV === 'development'
            ? 'http://34.192.167.210:5328/api/nodes/:path*'
            : 'http://34.192.167.210:5328/api/nodes/:path*'
      },
      // Rewrite for python API
      {
        source: '/api/python/:path*',
        destination:
          process.env.NODE_ENV === 'development'
            ? 'http://34.192.167.210:5328/api/python/:path*'
            : 'http://34.192.167.210:5328/api/python/:path*'
      }
    ]
  }
}

module.exports = nextConfig
