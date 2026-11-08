import { cookies } from 'next/headers';

export function requireStaffSession() {
  const expected = process.env.STAFF_SESSION_TOKEN;
  const actual = cookies().get('staff_session')?.value;
  if (!expected || !actual || actual !== expected) {
    throw new Error('Staff authentication is required.');
  }
  return { role: 'staff' as const };
}
