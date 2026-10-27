export type PatientClinic = 'dental' | 'meditouch' | 'both';

// The patient page tabs a user may see, in desktop order with desktop labels and the same
// permission and clinic rules as the desktop tab bar (pages/PatientDetails.tsx). Used by
// the phone/tablet tab drop-down.
export function getVisiblePatientTabs(
  clinic: PatientClinic,
  hasPermission: (permission: string) => boolean
): { value: string; label: string }[] {
  const tabs: { value: string; label: string; show: boolean }[] = [
    { value: 'overview', label: 'Patient Info', show: hasPermission('patients.view_patient_info') },
    { value: 'appointments', label: 'Appointments', show: hasPermission('patients.view_appointments') },
    {
      value: 'dental-charting',
      label: 'Dental Charting',
      show: (clinic === 'dental' || clinic === 'both') && hasPermission('patients.view_dental_chart'),
    },
    {
      value: 'appointment-history',
      label: clinic === 'dental' ? 'Dental History' : 'Appointment History',
      show: hasPermission('patients.view_treatment_history'),
    },
    { value: 'prescriptions', label: 'Prescriptions', show: hasPermission('patients.view_prescriptions') },
    { value: 'vital-signs', label: 'Vital Signs', show: hasPermission('patients.view_vital_signs') },
  ];
  return tabs.filter(t => t.show).map(({ value, label }) => ({ value, label }));
}
