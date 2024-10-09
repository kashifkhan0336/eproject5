import { createAuth } from '@keystone-6/auth';
import { statelessSessions } from '@keystone-6/core/session';

const { withAuth } = createAuth({
  listKey: 'User',
  identityField: 'email',
  secretField: 'password',
  sessionData: 'role', // Changed from isAdmin to role
  initFirstItem: {
    fields: ['name', 'email', 'password', 'role'],
    itemData: { role: 'manager' }, // First user is always a manager
  },
});

const session = statelessSessions({
  secret: process.env.SESSION_SECRET || '3092h9h2973f029f23hf29fh2693fgflshkjdhfljksfb29042794hr249724b73',
  maxAge: 60 * 60 * 24 * 30, // 30 days
  secure: process.env.NODE_ENV === 'production',
});

export { withAuth, session };