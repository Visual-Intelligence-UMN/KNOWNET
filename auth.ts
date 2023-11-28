import NextAuth, { type DefaultSession } from 'next-auth'
import GitHub from 'next-auth/providers/github'
import Google from 'next-auth/providers/google' // Import Google provider

declare module 'next-auth' {
  interface Session {
    user: {
      /** The user's id. */
      id: string
    } & DefaultSession['user']
  }
}

export const {
  handlers: { GET, POST },
  auth
} = NextAuth({
  providers: [
    GitHub, // Existing GitHub provider
    Google
  ],
  callbacks: {
    jwt({ token, profile, account }) {
      // console.log('Profile:', profile)
      if (profile) {
        // Use 'sub' for Google profiles and 'id' for others
        token.id =
          account && account.provider === 'google' ? profile.sub : profile.id
        token.image = profile.avatar_url || profile.picture
      }
      return token
    },
    session: ({ session, token }) => {
      // console.log('Session:', session)
      // console.log('Token:', token)
      if (session?.user && token?.id) {
        session.user.id = String(token.id)
      } else if (session?.user) {
        session.user.id = String(token.sub)
      }
      return session
    },
    authorized({ auth }) {
      return !!auth?.user // this ensures there is a logged in user for -every- request
    }
  },
  pages: {
    signIn: '/sign-in' // overrides the next-auth default signin page
  }
})
