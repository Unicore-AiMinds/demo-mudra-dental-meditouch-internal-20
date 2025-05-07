-- Supabase SQL Schema for Mudra Clinic Application

-- Users Table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'doctor', 'receptionist', 'inventory')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Clinics Table
CREATE TABLE clinics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('dental', 'meditouch')),
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  pincode TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Clinic Operating Hours Table
CREATE TABLE clinic_operating_hours (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  monday TEXT,
  tuesday TEXT,
  wednesday TEXT,
  thursday TEXT,
  friday TEXT,
  saturday TEXT,
  sunday TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Doctors Table
CREATE TABLE doctors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  specialization TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  aadhar_doc TEXT,
  pan_doc TEXT,
  color TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Patients Table
CREATE TABLE patients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_code TEXT UNIQUE NOT NULL, -- e.g., PT001
  name TEXT NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female', 'other')),
  age INTEGER,
  date_of_birth DATE,
  email TEXT,
  phone TEXT NOT NULL,
  alt_phone TEXT,
  address TEXT,
  city TEXT,
  pincode TEXT,
  blood_group TEXT,
  referred_by TEXT,
  clinic TEXT NOT NULL CHECK (clinic IN ('dental', 'meditouch', 'both')),
  last_visit DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Appointments Table
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_code TEXT UNIQUE NOT NULL, -- e.g., d1, m2
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  time TEXT NOT NULL,
  service TEXT NOT NULL,
  date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('confirmed', 'arrived', 'completed', 'cancelled')),
  payment_status TEXT CHECK (payment_status IN ('paid', 'unpaid')),
  based_on_follow_up_id UUID,
  related_to_charting_entry_id UUID,
  notes TEXT,
  clinic_type TEXT NOT NULL CHECK (clinic_type IN ('dental', 'meditouch')),
  doctor TEXT, -- For dental appointments
  second_patient TEXT, -- For dental appointments
  treatment_type TEXT, -- Different for dental and meditouch
  therapist TEXT, -- For meditouch appointments
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Dental Charting Table
CREATE TABLE dental_charting (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entry_id TEXT UNIQUE NOT NULL, -- e.g., CE001
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  date_recorded TIMESTAMP WITH TIME ZONE NOT NULL,
  tooth_numbers TEXT[] NOT NULL,
  surfaces TEXT[],
  finding TEXT,
  service TEXT,
  status TEXT NOT NULL CHECK (status IN ('Existing', 'Planned', 'Completed')),
  notes TEXT,
  doctor TEXT,
  follow_up_ids TEXT[],
  completed_by_entry_id TEXT,
  completes_entry_id TEXT,
  snoozed_until DATE,
  scheduled_appointment_id UUID REFERENCES appointments(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Dental History Table
CREATE TABLE dental_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  service TEXT NOT NULL,
  doctor TEXT NOT NULL,
  payment_status TEXT CHECK (payment_status IN ('paid', 'unpaid')),
  diagnosis_notes TEXT,
  treatment_plan_suggested TEXT,
  procedure_performed_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Follow-ups Table
CREATE TABLE follow_ups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  follow_up_id TEXT UNIQUE NOT NULL, -- e.g., FU001
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  patient_name TEXT NOT NULL,
  based_on_appointment_id UUID REFERENCES appointments(id),
  tentative_date DATE NOT NULL,
  follow_up_sequence INTEGER NOT NULL,
  total_steps_in_sequence INTEGER NOT NULL,
  sequence_group_id TEXT,
  suggested_service_name TEXT NOT NULL,
  original_service TEXT NOT NULL,
  original_doctor TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Pending', 'Scheduled', 'Completed', 'Cancelled', 'Snoozed')),
  based_on_charting_entry_id TEXT,
  scheduled_appointment_id UUID REFERENCES appointments(id),
  follow_up_type TEXT CHECK (follow_up_type IN ('Treatment', 'Check', 'Maintenance')),
  special_notes TEXT,
  snoozed_until DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Services with Follow-up Table
CREATE TABLE services_with_follow_up (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  duration INTEGER NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  description TEXT,
  requires_follow_up BOOLEAN NOT NULL DEFAULT false,
  default_follow_up_interval_days INTEGER,
  number_of_follow_ups INTEGER,
  follow_up_service_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Vital Signs Table
CREATE TABLE vital_signs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vital_sign_id TEXT UNIQUE NOT NULL, -- e.g., VS001
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  weight TEXT,
  blood_pressure TEXT,
  pulse TEXT,
  temperature TEXT,
  respiratory_rate TEXT,
  notes TEXT,
  recorded_by TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Medications Table
CREATE TABLE medications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  medication_id TEXT UNIQUE NOT NULL, -- e.g., MED001
  name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  duration TEXT NOT NULL,
  timing_morning BOOLEAN NOT NULL DEFAULT false,
  timing_afternoon BOOLEAN NOT NULL DEFAULT false,
  timing_night BOOLEAN NOT NULL DEFAULT false,
  food_instructions TEXT,
  instructions TEXT,
  dispense_quantity TEXT NOT NULL,
  frequency TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Prescriptions Table
CREATE TABLE prescriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prescription_id TEXT UNIQUE NOT NULL, -- e.g., PR001
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  diagnosis TEXT NOT NULL,
  notes TEXT,
  prescribed_by TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Active', 'Completed', 'Cancelled')),
  doctor_reg_no TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Prescription Medications (Junction Table)
CREATE TABLE prescription_medications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prescription_id UUID REFERENCES prescriptions(id) ON DELETE CASCADE,
  medication_id UUID REFERENCES medications(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Medicines Table
CREATE TABLE medicines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(name, dosage)
);

-- Stock Items Table
CREATE TABLE stock_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  sub_item TEXT,
  item_type TEXT NOT NULL CHECK (item_type IN ('Consumable', 'Inventory')),
  dealer TEXT,
  rate DECIMAL(10, 2),
  description TEXT NOT NULL,
  unit TEXT NOT NULL,
  current_quantity INTEGER NOT NULL,
  minimum_threshold INTEGER NOT NULL,
  nearest_expiry_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Lab Jobs Table
CREATE TABLE lab_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lab_job_id TEXT UNIQUE NOT NULL, -- e.g., LJ001
  patient TEXT NOT NULL,
  service TEXT NOT NULL,
  lab_work_type TEXT NOT NULL,
  date_sent DATE NOT NULL,
  assigned_lab TEXT NOT NULL,
  expected_delivery DATE NOT NULL,
  payment_status TEXT NOT NULL CHECK (payment_status IN ('paid', 'unpaid')),
  status TEXT NOT NULL CHECK (status IN ('pending-send', 'sent', 'received', 'ready', 'completed')),
  material_specs TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Lab Work Types Table
CREATE TABLE lab_work_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  turnaround TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
