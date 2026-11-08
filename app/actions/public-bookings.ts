'use server';

import { databaseConfigured, dbQuery } from '../../lib/server/db';

type PublicBookingInput = {
  name: string;
  age: number;
  area: string;
  phone?: string;
  bookingReason?: string;
};

export async function createPublicBooking(input: PublicBookingInput) {
  const name = input.name.trim();
  if (!name || !Number.isInteger(input.age) || input.age < 0 || input.age > 120 || !input.area) {
    throw new Error('Invalid booking details.');
  }
  if (!databaseConfigured()) return { id: null, demo: true as const };
  const patient = await dbQuery<{ id: string }>(
    'INSERT INTO patients (name, age, phone) VALUES ($1, $2, $3) RETURNING id',
    [name, input.age, input.phone?.trim() || null],
  );
  const booking = await dbQuery<{ id: string }>(
    `INSERT INTO bookings (patient_id, source, status, area, booking_reason)
     VALUES ($1, 'web', 'new', $2, $3) RETURNING id`,
    [patient.rows[0].id, input.area, input.bookingReason || null],
  );
  return { id: booking.rows[0].id, demo: false as const };
}
