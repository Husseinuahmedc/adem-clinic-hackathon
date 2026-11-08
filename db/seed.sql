BEGIN;

WITH generated AS (
  SELECT i, gen_random_uuid() AS id
  FROM generate_series(1, 5000) AS series(i)
)
INSERT INTO patients (id, name, age, phone)
SELECT id,
       format('مراجع تجريبي %s', i),
       (i % 81),
       CASE WHEN i % 4 = 0 THEN NULL ELSE format('964770%07s', i) END
FROM generated;

INSERT INTO bookings (patient_id, source, status, area, booking_reason, appointment_date, appointment_time, note)
SELECT p.id,
       CASE WHEN row_number() OVER (ORDER BY p.created_at) % 2 = 0 THEN 'web' ELSE 'whatsapp' END,
       CASE WHEN row_number() OVER (ORDER BY p.created_at) % 5 = 0 THEN 'confirmed' ELSE 'new' END,
       (ARRAY['المنصور', 'الكرادة', 'الأعظمية', 'زيونة', 'الدورة'])[((row_number() OVER (ORDER BY p.created_at) - 1) % 5) + 1],
       CASE WHEN row_number() OVER (ORDER BY p.created_at) % 3 = 0 THEN 'متابعة علاج جلدي' ELSE NULL END,
       CASE WHEN row_number() OVER (ORDER BY p.created_at) % 5 = 0 THEN current_date + ((row_number() OVER (ORDER BY p.created_at) % 14)::int) ELSE NULL END,
       CASE WHEN row_number() OVER (ORDER BY p.created_at) % 5 = 0 THEN time '10:30' ELSE NULL END,
       'بيانات خيالية للاختبار'
FROM patients p
WHERE p.name LIKE 'مراجع تجريبي %';

INSERT INTO follow_ups (patient_id, booking_id, follow_up_date, note)
SELECT b.patient_id, b.id, current_date, 'متابعة خيالية للاختبار'
FROM bookings b
WHERE b.patient_id IN (SELECT id FROM patients WHERE name LIKE 'مراجع تجريبي %')
  AND b.id IN (SELECT id FROM bookings ORDER BY created_at LIMIT 500);

COMMIT;
