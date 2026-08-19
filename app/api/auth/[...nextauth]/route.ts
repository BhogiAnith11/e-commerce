import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

const providers: any[] = [
  CredentialsProvider({
    name: 'credentials',
    credentials: {
      email: { label: 'Email', type: 'email' },
      password: { label: 'Password', type: 'password' },
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) return null;

      await connectDB();
      const user = await User.findOne({ email: credentials.email.toLowerCase() });
      if (!user) return null;

      const passwordMatch = await bcrypt.compare(credentials.password, user.passwordHash);
      if (!passwordMatch) return null;

      return {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
        image: user.image,
      };
    },
  }),
];

// Add Google Provider if credentials are provided
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  );
}

const handler = NextAuth({
  providers,
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google' && user.email) {
        try {
          await connectDB();
          const emailLower = user.email.toLowerCase();
          let existingUser = await User.findOne({ email: emailLower });
          if (!existingUser) {
            existingUser = await User.create({
              name: user.name || 'Google User',
              email: emailLower,
              role: 'buyer',
              passwordHash: 'google_oauth_user',
              image: user.image || undefined,
            });
          }
          user.id = existingUser._id.toString();
          (user as any).role = existingUser.role;
          return true;
        } catch (err) {
          console.error('Error during Google sign in callback:', err);
          return true;
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role || 'buyer';
        token.id = user.id;
      } else if (!token.role && typeof token.email === 'string') {
        try {
          await connectDB();
          const dbUser = await User.findOne({ email: token.email.toLowerCase() });
          if (dbUser) {
            token.role = dbUser.role;
            token.id = dbUser._id.toString();
          }
        } catch (e) {
          console.error('jwt token fetch error:', e);
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { role?: string; id?: string }).role = (token.role as string) || 'buyer';
        (session.user as { role?: string; id?: string }).id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    newUser: '/signup',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };
