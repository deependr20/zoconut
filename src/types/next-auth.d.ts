import { UserRole } from './index';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: UserRole;
      firstName: string;
      lastName: string;
      avatar?: string;
      emailVerified: boolean;
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    firstName: string;
    lastName: string;
    avatar?: string;
    emailVerified: boolean;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: UserRole;
    firstName: string;
    lastName: string;
    avatar?: string;
    emailVerified: boolean;
  }
}
