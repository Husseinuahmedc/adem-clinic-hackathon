CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  age integer NOT NULL CHECK (age BETWEEN 0 AND 120),
  phone text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES patients(id) ON DELETE SET NULL,
  source text NOT NULL CHECK (source IN ('web', 'whatsapp', 'staff')),
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'confirmed', 'complaint', 'closed')),
  area text NOT NULL,
  booking_reason text,
  appointment_date date,
  appointment_time time,
  note text,
  confirmation_sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS follow_ups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  booking_id uuid REFERENCES bookings(id) ON DELETE SET NULL,
  follow_up_date date NOT NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS patients_name_search_idx ON patients USING gin (to_tsvector('simple', name));
CREATE INDEX IF NOT EXISTS patients_phone_idx ON patients (phone);
CREATE INDEX IF NOT EXISTS bookings_patient_created_idx ON bookings (patient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS follow_ups_date_idx ON follow_ups (follow_up_date, patient_id);
