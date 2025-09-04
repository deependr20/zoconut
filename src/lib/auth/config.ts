import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import connectDB from '@/lib/db/connection';
import User from '@/lib/db/models/User';
import { UserRole } from '@/types';

// Check if we're in Vercel environment without database
const isVercelWithoutDB = process.env.VERCEL && !process.env.MONGODB_URI;

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }

        // If in Vercel without database, use demo credentials
        if (isVercelWithoutDB) {
          // Demo credentials for Vercel deployment
          if (credentials.email === 'demo@zoconut.com' && credentials.password === 'demo123') {
            return {
              id: 'demo-user-id',
              email: 'demo@zoconut.com',
              name: 'Demo User',
              firstName: 'Demo',
              lastName: 'User',
              role: UserRole.CLIENT,
              avatar: null,
              emailVerified: null
            };
          }
          throw new Error('Demo mode: Use demo@zoconut.com / demo123');
        }

        try {
          const dbConnection = await connectDB();

          // If no database connection, fall back to demo mode
          if (!dbConnection) {
            if (credentials.email === 'demo@zoconut.com' && credentials.password === 'demo123') {
              return {
                id: 'demo-user-id',
                email: 'demo@zoconut.com',
                name: 'Demo User',
                firstName: 'Demo',
                lastName: 'User',
                role: UserRole.CLIENT,
                avatar: null,
                emailVerified: null
              };
            }
            throw new Error('Database not available. Use demo@zoconut.com / demo123');
          }

          const user = await User.findOne({
            email: credentials.email.toLowerCase()
          }).select('+password');

          if (!user) {
            throw new Error('Invalid email or password');
          }

          const isPasswordValid = await user.comparePassword(credentials.password);
          
          if (!isPasswordValid) {
            throw new Error('Invalid email or password');
          }

          if (user.status !== 'active') {
            throw new Error('Account is not active. Please contact support.');
          }

          return {
            id: user._id.toString(),
            email: user.email,
            name: user.fullName,
            role: user.role,
            firstName: user.firstName,
            lastName: user.lastName,
            avatar: user.avatar,
            emailVerified: user.emailVerified
          };
        } catch (error) {
          console.error('Auth error:', error);
          throw error;
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // Initial sign in
      if (user) {
        token.role = user.role;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
        token.avatar = user.avatar;
        token.emailVerified = !!user.emailVerified;
      }

      // Handle session update
      if (trigger === 'update' && session) {
        token = { ...token, ...session };
      }

      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!;
        session.user.role = token.role as UserRole;
        session.user.firstName = token.firstName as string;
        session.user.lastName = token.lastName as string;
        session.user.avatar = token.avatar as string;
        session.user.emailVerified = token.emailVerified as boolean;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    }
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  events: {
    async signIn({ user, isNewUser }) {
      if (isNewUser) {
        console.log(`New user signed up: ${user.email}`);
      }
    },
    async signOut({ token }) {
      console.log(`User signed out: ${token.email}`);
    }
  },
  debug: process.env.NODE_ENV === 'development',
};
