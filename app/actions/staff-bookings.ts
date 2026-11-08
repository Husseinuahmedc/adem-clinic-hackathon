'use server';

import { dbQuery } from '../../lib/server/db';
import { requireStaffSession } from '../../lib/server/auth';

export async function listStaffBookings(input: { page?: number; pageSize?: number; search?: string; followUpsToday?: boolean } = {}) {
  requireStaffSession();
  const pageSize = Math.min(Math.max(input.pageSize ?? 25, 1), 100);
  const page = Math.max(input.page ?? 1, 1);
  const offset = (page - 1) * pageSize;
  const search = input.search?.trim() ? `%${input.search.trim()}%` : null;
  const followUpFilter = input.followUpsToday ? `AND EXISTS (SELECT 1 FROM follow_ups f WHERE f.patient_id = p.id AND f.follow_up_date = CURRENT_DATE)` : '';
  const result = await dbQuery<{
    id: string; patient_id: string | null; patient_name: string; age: number; phone: string | null;
    area: string; status: string; booking_reason: string | null; note: string | null;
    appointment_date: string | null; appointment_time: string | null; total_count: string;
  }>(
    `SELECT b.id, b.patient_id, p.name AS patient_name, p.age, p.phone, b.area, b.status,
            b.booking_reason, b.note, b.appointment_date, b.appointment_time,
            COUNT(*) OVER() AS total_count
     FROM bookings b
     LEFT JOIN patients p ON p.id = b.patient_id
     WHERE ($1::text IS NULL OR p.name ILIKE $1 OR COALESCE(p.phone, '') ILIKE $1)
       ${followUpFilter}
     ORDER BY b.created_at DESC
     LIMIT $2 OFFSET $3`,
    [search, pageSize, offset],
  );
  return { rows: result.rows, page, pageSize, total: Number(result.rows[0]?.total_count ?? 0) };
}

export async function updateStaffBooking(input: { id: string; status?: string; note?: string; appointmentDate?: string; appointmentTime?: string }) {
  requireStaffSession();
  await dbQuery(
    `UPDATE bookings
     SET status = COALESCE($2, status), note = COALESCE($3, note),
         appointment_date = COALESCE($4::date, appointment_date),
         appointment_time = COALESCE($5::time, appointment_time)
     WHERE id = $1`,
    [input.id, input.status ?? null, input.note ?? null, input.appointmentDate ?? null, input.appointmentTime ?? null],
  );
}

export async function linkBookingToExistingPatient(input: { bookingId: string; patientId: string }) {
  requireStaffSession();
  await dbQuery('UPDATE bookings SET patient_id = $2 WHERE id = $1', [input.bookingId, input.patientId]);
}

export async function getPatientRecord(patientId: string) {
  requireStaffSession();
  const patient = await dbQuery<{ id: string; name: string; age: number; phone: string | null }>(
    'SELECT id, name, age, phone FROM patients WHERE id = $1',
    [patientId],
  );
  const bookings = await dbQuery(
    `SELECT id, source, status, area, booking_reason, appointment_date, appointment_time, note, created_at
     FROM bookings WHERE patient_id = $1 ORDER BY created_at DESC`,
    [patientId],
  );
  const nextFollowUp = await dbQuery(
    `SELECT id, booking_id, follow_up_date, note
     FROM follow_ups WHERE patient_id = $1 AND follow_up_date >= CURRENT_DATE
     ORDER BY follow_up_date ASC LIMIT 1`,
    [patientId],
  );
  return { patient: patient.rows[0] ?? null, bookings: bookings.rows, nextFollowUp: nextFollowUp.rows[0] ?? null };
}
