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
            ? 'http://127.0.0.1:5328/api/chat/:path*'
            : 'http://your_production_flask_server/api/chat/:path*'
      },
      // Rewrite for nodes API
      {
        source: '/api/nodes/:path*',
        destination:
          process.env.NODE_ENV === 'development'
            ? 'http://127.0.0.1:5328/api/nodes/:path*'
            : 'http://your_production_flask_server/api/nodes/:path*'
      },
      // Rewrite for python API
      {
        source: '/api/python/:path*',
        destination:
          process.env.NODE_ENV === 'development'
            ? 'http://127.0.0.1:5328/api/python/:path*'
            : 'http://your_production_flask_server/api/python/:path*'
      }
    ]
  }
}

module.exports = nextConfig
