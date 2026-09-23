-- Book-to-Confirm: allow the new 'booked' status on appointments.
-- Run in Supabase SQL Editor for the DEV project now, and for PRODUCTION at deploy time.
-- Safe to run once; drops the old CHECK constraint and re-adds it with 'booked' included.

ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_status_check;

ALTER TABLE appointments
  ADD CONSTRAINT appointments_status_check
  CHECK (status IN ('booked', 'confirmed', 'arrived', 'completed', 'cancelled'));
