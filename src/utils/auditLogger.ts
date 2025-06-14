import { AuditLog } from '@/contexts/AuditLogContext';

// Helper function to create audit log entries
export const createAuditLogEntry = (
  action_category: AuditLog['action_category'],
  action_type: string,
  target_entity: string,
  details: string,
  target_id?: string,
  changes?: any
): Omit<AuditLog, 'id' | 'timestamp' | 'user_id' | 'user_name' | 'user_role' | 'created_at' | 'ip_address' | 'user_agent' | 'clinic_type'> => {
  return {
    action_category,
    action_type,
    target_entity,
    target_id,
    details,
    changes,
  };
};

// Common audit log templates
export const AuditLogTemplates = {
  // Authentication
  auth: {
    login: (userEmail: string) => createAuditLogEntry(
      'auth',
      'User Login',
      'System',
      `User logged in: ${userEmail}`
    ),
    logout: (userEmail: string) => createAuditLogEntry(
      'auth',
      'User Logout',
      'System',
      `User logged out: ${userEmail}`
    ),
    loginFailed: (userEmail: string) => createAuditLogEntry(
      'auth',
      'Login Failed',
      'System',
      `Failed login attempt for: ${userEmail}`
    ),
  },

  // Appointments
  appointment: {
    create: (appointmentId: string, patientName: string, service: string, date: string, time: string, doctor?: string) => createAuditLogEntry(
      'appointment',
      'Create Appointment',
      'Appointment',
      `Created appointment for ${patientName} - Service: ${service}, Date: ${date}, Time: ${time}${doctor ? `, Doctor: ${doctor}` : ''}`,
      appointmentId
    ),
    update: (appointmentId: string, patientName: string, changes: any, updateType?: 'status' | 'details' | 'cancel') => {
      let actionType = 'Update Appointment';
      let details = `Updated appointment for ${patientName}`;

      if (updateType === 'cancel') {
        actionType = 'Cancel Appointment';
        details = `Cancelled appointment for ${patientName}`;
      } else if (updateType === 'status') {
        actionType = 'Update Appointment Status';
        details = `Updated appointment status for ${patientName}`;
      }

      return createAuditLogEntry(
        'appointment',
        actionType,
        'Appointment',
        details,
        appointmentId,
        changes
      );
    },
    updateDetailed: (appointmentId: string, patientName: string, service: string, date: string, time: string, doctor: string | undefined, changes: any, updateType?: 'status' | 'details' | 'cancel') => {
      const before = changes.before;
      const after = changes.after;

      // Build detailed change description
      const changedFields: string[] = [];

      // Check for patient changes
      if (before.patient_id !== after.patient_id || before.patient_name !== after.patient_name) {
        changedFields.push(`Patient: "${before.patient_name || 'Unknown'}" → "${after.patient_name || 'Unknown'}"`);
      }

      // Check for service changes
      if (before.service !== after.service) {
        changedFields.push(`Service: "${before.service || 'None'}" → "${after.service || 'None'}"`);
      }

      // Check for date changes
      if (before.date !== after.date) {
        changedFields.push(`Date: "${before.date || 'None'}" → "${after.date || 'None'}"`);
      }

      // Check for time changes
      if (before.time !== after.time) {
        changedFields.push(`Time: "${before.time || 'None'}" → "${after.time || 'None'}"`);
      }

      // Check for doctor/therapist changes
      const beforeDoctor = before.doctor || before.therapist || 'None';
      const afterDoctor = after.doctor || after.therapist || 'None';
      if (beforeDoctor !== afterDoctor) {
        changedFields.push(`Doctor: "${beforeDoctor}" → "${afterDoctor}"`);
      }

      // Check for status changes
      if (before.status !== after.status) {
        changedFields.push(`Status: "${before.status || 'None'}" → "${after.status || 'None'}"`);
      }

      // Check for notes changes
      if (before.notes !== after.notes) {
        const beforeNotes = before.notes ? 'Added' : 'None';
        const afterNotes = after.notes ? 'Added' : 'None';
        changedFields.push(`Notes: "${beforeNotes}" → "${afterNotes}"`);
      }

      // Determine action type and base details
      let actionType = 'Update Appointment';
      let baseDetails = `Updated appointment for ${patientName}`;

      if (updateType === 'cancel') {
        actionType = 'Cancel Appointment';
        baseDetails = `Cancelled appointment for ${patientName}`;
      } else if (updateType === 'status') {
        actionType = 'Update Appointment Status';
        baseDetails = `Updated appointment status for ${patientName}`;
      }

      // Build final details text
      const detailsText = changedFields.length > 0
        ? `${baseDetails}: ${changedFields.join(', ')}`
        : `${baseDetails} - Service: ${service}, Date: ${date}, Time: ${time}${doctor ? `, Doctor: ${doctor}` : ''}`;

      return createAuditLogEntry(
        'appointment',
        actionType,
        'Appointment',
        detailsText,
        appointmentId,
        changes
      );
    },
    delete: (appointmentId: string, patientName: string, service?: string, date?: string) => createAuditLogEntry(
      'appointment',
      'Delete Appointment',
      'Appointment',
      `Deleted appointment for ${patientName}${service ? ` - Service: ${service}` : ''}${date ? `, Date: ${date}` : ''}`,
      appointmentId
    ),
    reschedule: (appointmentId: string, patientName: string, oldDate: string, newDate: string) => createAuditLogEntry(
      'appointment',
      'Reschedule Appointment',
      'Appointment',
      `Rescheduled appointment for ${patientName} from ${oldDate} to ${newDate}`,
      appointmentId
    ),
    complete: (appointmentId: string, patientName: string, service: string, date: string, time: string) => createAuditLogEntry(
      'appointment',
      'Complete Appointment',
      'Appointment',
      `Completed appointment for ${patientName} - Service: ${service}, Date: ${date}, Time: ${time}`,
      appointmentId
    ),
    updatePaymentStatus: (appointmentId: string, patientName: string, service: string, date: string, time: string, oldStatus: 'paid' | 'unpaid', newStatus: 'paid' | 'unpaid', doctor?: string) => createAuditLogEntry(
      'appointment',
      'Update Payment Status',
      'Appointment',
      `Updated payment status for ${patientName} - Service: ${service}, Date: ${date}, Time: ${time}${doctor ? `, Doctor: ${doctor}` : ''}: "${oldStatus}" → "${newStatus}"`,
      appointmentId,
      {
        before: { payment_status: oldStatus },
        after: { payment_status: newStatus }
      }
    ),
  },

  // Patients
  patient: {
    create: (patientId: string, patientName: string) => createAuditLogEntry(
      'patient',
      'Create Patient',
      'Patient',
      `Created new patient record for ${patientName}`,
      patientId
    ),
    update: (patientId: string, patientName: string, changes: any) => createAuditLogEntry(
      'patient',
      'Update Patient',
      'Patient',
      `Updated patient information for ${patientName}`,
      patientId,
      changes
    ),
    delete: (patientId: string, patientName: string) => createAuditLogEntry(
      'patient',
      'Delete Patient',
      'Patient',
      `Deleted patient record for ${patientName}`,
      patientId
    ),
  },

  // Doctors
  doctor: {
    create: (doctorId: string, doctorName: string, specialization?: string, clinic?: string) => createAuditLogEntry(
      'doctor',
      'Create Doctor',
      'Doctor',
      `Added new doctor: ${doctorName}${specialization ? ` - Specialization: ${specialization}` : ''}${clinic ? `, Clinic: ${clinic}` : ''}`,
      doctorId
    ),
    update: (doctorId: string, doctorName: string, changes: any) => {
      const before = changes.before;
      const after = changes.after;

      // Build detailed change description
      const changedFields: string[] = [];

      if (before.name !== after.name) {
        changedFields.push(`Name: "${before.name}" → "${after.name}"`);
      }
      if (before.specialization !== after.specialization) {
        changedFields.push(`Specialization: "${before.specialization || 'None'}" → "${after.specialization || 'None'}"`);
      }
      if (before.phone !== after.phone) {
        changedFields.push(`Phone: "${before.phone || 'None'}" → "${after.phone || 'None'}"`);
      }
      if (before.email !== after.email) {
        changedFields.push(`Email: "${before.email || 'None'}" → "${after.email || 'None'}"`);
      }
      if (before.clinic !== after.clinic) {
        changedFields.push(`Clinic: "${before.clinic || 'None'}" → "${after.clinic || 'None'}"`);
      }
      if (before.experience !== after.experience) {
        changedFields.push(`Experience: "${before.experience || 'None'}" → "${after.experience || 'None'}"`);
      }
      if (before.qualification !== after.qualification) {
        changedFields.push(`Qualification: "${before.qualification || 'None'}" → "${after.qualification || 'None'}"`);
      }
      if (before.license_number !== after.license_number) {
        changedFields.push(`License Number: "${before.license_number || 'None'}" → "${after.license_number || 'None'}"`);
      }

      // Check for document changes
      if (before.aadhar_card_url !== after.aadhar_card_url) {
        const beforeDoc = before.aadhar_card_url ? 'Uploaded' : 'None';
        const afterDoc = after.aadhar_card_url ? 'Uploaded' : 'None';
        changedFields.push(`Aadhar Card: "${beforeDoc}" → "${afterDoc}"`);
      }
      if (before.pan_card_url !== after.pan_card_url) {
        const beforeDoc = before.pan_card_url ? 'Uploaded' : 'None';
        const afterDoc = after.pan_card_url ? 'Uploaded' : 'None';
        changedFields.push(`PAN Card: "${beforeDoc}" → "${afterDoc}"`);
      }

      const detailsText = changedFields.length > 0
        ? `Updated doctor ${doctorName}: ${changedFields.join(', ')}`
        : `Updated doctor information for ${doctorName}`;

      return createAuditLogEntry(
        'doctor',
        'Update Doctor',
        'Doctor',
        detailsText,
        doctorId,
        changes
      );
    },
    delete: (doctorId: string, doctorName: string, specialization?: string) => createAuditLogEntry(
      'doctor',
      'Delete Doctor',
      'Doctor',
      `Deleted doctor: ${doctorName}${specialization ? ` - Specialization: ${specialization}` : ''}`,
      doctorId
    ),
  },

  // Stock Management
  stock: {
    create: (itemId: string, itemName: string, quantity: number) => createAuditLogEntry(
      'stock',
      'Create Stock Item',
      'Stock Item',
      `Added new stock item: ${itemName} (Quantity: ${quantity})`,
      itemId
    ),
    update: (itemId: string, itemName: string, changes: any) => createAuditLogEntry(
      'stock',
      'Update Stock',
      'Stock Item',
      `Updated stock for ${itemName}`,
      itemId,
      changes
    ),
    consume: (itemId: string, itemName: string, quantity: number) => createAuditLogEntry(
      'stock',
      'Consume Stock',
      'Stock Item',
      `Consumed ${quantity} units of ${itemName}`,
      itemId
    ),
  },

  // Lab Work (Tracker)
  lab_work: {
    create: (labWorkId: string, labJobId: string, patientName: string, service: string, workType: string, assignedLab: string, dateSent: string, expectedDelivery: string, status: string, paymentStatus: string, materialSpecs?: string, notes?: string) => createAuditLogEntry(
      'lab',
      'Create Lab Work',
      'Lab Work',
      `Created lab work ${labJobId} for ${patientName} - Service: ${service}, Type: ${workType}, Lab: ${assignedLab}, Date Sent: ${dateSent}, Expected: ${expectedDelivery}, Status: ${status}, Payment: ${paymentStatus}${materialSpecs ? `, Material: ${materialSpecs}` : ''}${notes ? `, Notes: ${notes}` : ''}`,
      labWorkId
    ),

    update: (labWorkId: string, labJobId: string, patientName: string, changes: { before: any, after: any }) => {
      const fieldChanges: string[] = [];

      // Helper function to safely get field value
      const getFieldValue = (obj: any, field: string): string => {
        const value = obj?.[field];
        return (value !== null && value !== undefined && value !== '') ? value.toString() : 'Not specified';
      };

      // Helper function to format date
      const formatDate = (dateStr: string): string => {
        if (!dateStr) return 'Not specified';
        try {
          return new Date(dateStr).toLocaleDateString('en-GB');
        } catch {
          return dateStr;
        }
      };

      // Compare each field and build detailed change description
      if (changes.before.patient !== changes.after.patient) {
        fieldChanges.push(`Patient: "${changes.before.patient}" → "${changes.after.patient}"`);
      }

      if (changes.before.service !== changes.after.service) {
        fieldChanges.push(`Service: "${changes.before.service}" → "${changes.after.service}"`);
      }

      if (changes.before.labWorkType !== changes.after.labWorkType) {
        fieldChanges.push(`Work Type: "${changes.before.labWorkType}" → "${changes.after.labWorkType}"`);
      }

      if (changes.before.assignedLab !== changes.after.assignedLab) {
        fieldChanges.push(`Assigned Lab: "${changes.before.assignedLab}" → "${changes.after.assignedLab}"`);
      }

      if (changes.before.dateSent !== changes.after.dateSent) {
        fieldChanges.push(`Date Sent: "${formatDate(changes.before.dateSent)}" → "${formatDate(changes.after.dateSent)}"`);
      }

      if (changes.before.expectedDelivery !== changes.after.expectedDelivery) {
        fieldChanges.push(`Expected Delivery: "${formatDate(changes.before.expectedDelivery)}" → "${formatDate(changes.after.expectedDelivery)}"`);
      }

      if (changes.before.status !== changes.after.status) {
        fieldChanges.push(`Status: "${changes.before.status}" → "${changes.after.status}"`);
      }

      if (changes.before.paymentStatus !== changes.after.paymentStatus) {
        fieldChanges.push(`Payment Status: "${changes.before.paymentStatus}" → "${changes.after.paymentStatus}"`);
      }

      const beforeMaterial = getFieldValue(changes.before, 'materialSpecs');
      const afterMaterial = getFieldValue(changes.after, 'materialSpecs');
      if (beforeMaterial !== afterMaterial) {
        fieldChanges.push(`Material Specs: "${beforeMaterial}" → "${afterMaterial}"`);
      }

      const beforeNotes = getFieldValue(changes.before, 'notes');
      const afterNotes = getFieldValue(changes.after, 'notes');
      if (beforeNotes !== afterNotes) {
        fieldChanges.push(`Notes: "${beforeNotes}" → "${afterNotes}"`);
      }

      const changesText = fieldChanges.length > 0 ? fieldChanges.join(', ') : 'No changes detected';

      return createAuditLogEntry(
        'lab',
        'Update Lab Work',
        'Lab Work',
        `Updated lab work ${labJobId} for ${patientName}: ${changesText}`,
        labWorkId,
        changes
      );
    },

    statusChange: (labWorkId: string, labJobId: string, patientName: string, oldStatus: string, newStatus: string) => createAuditLogEntry(
      'lab',
      'Update Lab Status',
      'Lab Work',
      `Changed lab work status for ${labJobId} (${patientName}) from "${oldStatus}" to "${newStatus}"`,
      labWorkId
    ),

    delete: (labWorkId: string, labJobId: string, patientName: string, service: string, workType: string, assignedLab: string, status: string) => createAuditLogEntry(
      'lab',
      'Delete Lab Work',
      'Lab Work',
      `Deleted lab work ${labJobId} for ${patientName} - Service: ${service}, Type: ${workType}, Lab: ${assignedLab}, Status: ${status}`,
      labWorkId
    ),
  },

  // Dental Labs (Settings)
  dental_lab: {
    create: (labId: string, labName: string, contact: string, address?: string, city?: string, specialization?: string) => createAuditLogEntry(
      'lab',
      'Add Dental Lab',
      'Lab Work',
      `Added new dental lab: ${labName} - Contact: ${contact}${address ? `, Address: ${address}` : ''}${city ? `, City: ${city}` : ''}${specialization ? `, Specialization: ${specialization}` : ''}`,
      labId
    ),

    update: (labId: string, labName: string, changes: { before: any, after: any }) => {
      const fieldChanges: string[] = [];

      // Helper function to safely get field value
      const getFieldValue = (obj: any, field: string): string => {
        const value = obj?.[field];
        return (value !== null && value !== undefined && value !== '') ? value : 'Not specified';
      };

      // Compare each field and build detailed change description
      if (changes.before.name !== changes.after.name) {
        fieldChanges.push(`Name: "${changes.before.name}" → "${changes.after.name}"`);
      }
      if (changes.before.contact !== changes.after.contact) {
        fieldChanges.push(`Contact: "${changes.before.contact}" → "${changes.after.contact}"`);
      }

      const beforeAddress = getFieldValue(changes.before, 'address');
      const afterAddress = getFieldValue(changes.after, 'address');
      if (beforeAddress !== afterAddress) {
        fieldChanges.push(`Address: "${beforeAddress}" → "${afterAddress}"`);
      }

      const beforeCity = getFieldValue(changes.before, 'city');
      const afterCity = getFieldValue(changes.after, 'city');
      if (beforeCity !== afterCity) {
        fieldChanges.push(`City: "${beforeCity}" → "${afterCity}"`);
      }

      const beforePincode = getFieldValue(changes.before, 'pincode');
      const afterPincode = getFieldValue(changes.after, 'pincode');
      if (beforePincode !== afterPincode) {
        fieldChanges.push(`Pincode: "${beforePincode}" → "${afterPincode}"`);
      }

      const beforeSpecialization = getFieldValue(changes.before, 'specialization');
      const afterSpecialization = getFieldValue(changes.after, 'specialization');
      if (beforeSpecialization !== afterSpecialization) {
        fieldChanges.push(`Specialization: "${beforeSpecialization}" → "${afterSpecialization}"`);
      }

      const changesText = fieldChanges.length > 0 ? fieldChanges.join(', ') : 'No changes detected';

      return createAuditLogEntry(
        'lab',
        'Update Dental Lab',
        'Lab Work',
        `Updated dental lab ${labName}: ${changesText}`,
        labId,
        changes
      );
    },

    delete: (labId: string, labName: string, contact: string, address?: string, city?: string, specialization?: string) => createAuditLogEntry(
      'lab',
      'Delete Dental Lab',
      'Lab Work',
      `Deleted dental lab: ${labName} - Contact: ${contact}${address ? `, Address: ${address}` : ''}${city ? `, City: ${city}` : ''}${specialization ? `, Specialization: ${specialization}` : ''}`,
      labId
    ),
  },

  // Lab Work Types (Settings)
  lab_work_type: {
    create: (workTypeId: string, workTypeName: string, duration: number, unit: string) => createAuditLogEntry(
      'lab',
      'Add Lab Work Type',
      'Lab Work',
      `Added new lab work type: ${workTypeName} - Turnaround: ${duration} ${unit}`,
      workTypeId
    ),

    update: (workTypeId: string, workTypeName: string, changes: { before: any, after: any }) => {
      const fieldChanges: string[] = [];

      // Helper function to safely get field value
      const getFieldValue = (obj: any, field: string): string => {
        const value = obj?.[field];
        return (value !== null && value !== undefined && value !== '') ? value.toString() : 'Not specified';
      };

      // Compare each field and build detailed change description
      if (changes.before.name !== changes.after.name) {
        fieldChanges.push(`Name: "${changes.before.name}" → "${changes.after.name}"`);
      }

      if (changes.before.turnaround_duration !== changes.after.turnaround_duration) {
        fieldChanges.push(`Duration: "${changes.before.turnaround_duration}" → "${changes.after.turnaround_duration}"`);
      }

      if (changes.before.turnaround_unit !== changes.after.turnaround_unit) {
        fieldChanges.push(`Unit: "${changes.before.turnaround_unit}" → "${changes.after.turnaround_unit}"`);
      }

      // Create a readable turnaround time comparison
      const beforeTurnaround = `${changes.before.turnaround_duration} ${changes.before.turnaround_unit}`;
      const afterTurnaround = `${changes.after.turnaround_duration} ${changes.after.turnaround_unit}`;

      if (beforeTurnaround !== afterTurnaround) {
        fieldChanges.push(`Turnaround Time: "${beforeTurnaround}" → "${afterTurnaround}"`);
      }

      const changesText = fieldChanges.length > 0 ? fieldChanges.join(', ') : 'No changes detected';

      return createAuditLogEntry(
        'lab',
        'Update Lab Work Type',
        'Lab Work',
        `Updated lab work type ${workTypeName}: ${changesText}`,
        workTypeId,
        changes
      );
    },

    delete: (workTypeId: string, workTypeName: string, duration: number, unit: string) => createAuditLogEntry(
      'lab',
      'Delete Lab Work Type',
      'Lab Work',
      `Deleted lab work type: ${workTypeName} - Turnaround: ${duration} ${unit}`,
      workTypeId
    ),
  },

  // Settings
  settings: {
    update: (settingName: string, details: string) => createAuditLogEntry(
      'settings',
      'Update Settings',
      settingName,
      details
    ),
    clinicInfo: (clinicType: string) => createAuditLogEntry(
      'settings',
      'Update Clinic Info',
      `${clinicType} Clinic Settings`,
      `Updated ${clinicType} clinic information`
    ),
  },

  // Services
  service: {
    create: (serviceId: string, serviceName: string, duration?: number, price?: number, description?: string, clinic?: string) => createAuditLogEntry(
      'service',
      'Create Service',
      'Service',
      `Added new service: ${serviceName}${duration ? ` - Duration: ${duration} minutes` : ''}${price ? `, Price: ₹${price}` : ''}${description ? `, Description: ${description}` : ''}${clinic ? `, Clinic: ${clinic}` : ''}`,
      serviceId
    ),
    update: (serviceId: string, serviceName: string, changes: any) => {
      const before = changes.before;
      const after = changes.after;

      // Build detailed change description
      const changedFields: string[] = [];

      if (before.name !== after.name) {
        changedFields.push(`Name: "${before.name}" → "${after.name}"`);
      }
      if (before.duration !== after.duration) {
        changedFields.push(`Duration: "${before.duration || 'None'} minutes" → "${after.duration || 'None'} minutes"`);
      }
      if (before.price !== after.price) {
        changedFields.push(`Price: "₹${before.price || 'None'}" → "₹${after.price || 'None'}"`);
      }
      if (before.description !== after.description) {
        const beforeDesc = before.description ? 'Added' : 'None';
        const afterDesc = after.description ? 'Added' : 'None';
        changedFields.push(`Description: "${beforeDesc}" → "${afterDesc}"`);
      }
      if (before.clinic_type !== after.clinic_type) {
        changedFields.push(`Clinic Type: "${before.clinic_type || 'None'}" → "${after.clinic_type || 'None'}"`);
      }
      if (before.follow_up_required !== after.follow_up_required) {
        changedFields.push(`Follow-up Required: "${before.follow_up_required ? 'Yes' : 'No'}" → "${after.follow_up_required ? 'Yes' : 'No'}"`);
      }
      if (before.follow_up_days !== after.follow_up_days) {
        changedFields.push(`Follow-up Days: "${before.follow_up_days || 'None'}" → "${after.follow_up_days || 'None'}"`);
      }
      if (before.is_active !== after.is_active) {
        changedFields.push(`Status: "${before.is_active ? 'Active' : 'Inactive'}" → "${after.is_active ? 'Active' : 'Inactive'}"`);
      }

      const detailsText = changedFields.length > 0
        ? `Updated service ${serviceName}: ${changedFields.join(', ')}`
        : `Updated service: ${serviceName}`;

      return createAuditLogEntry(
        'service',
        'Update Service',
        'Service',
        detailsText,
        serviceId,
        changes
      );
    },
    delete: (serviceId: string, serviceName: string, duration?: number, price?: number, clinic?: string) => createAuditLogEntry(
      'service',
      'Delete Service',
      'Service',
      `Deleted service: ${serviceName}${duration ? ` - Duration: ${duration} minutes` : ''}${price ? `, Price: ₹${price}` : ''}${clinic ? `, Clinic: ${clinic}` : ''}`,
      serviceId
    ),
  },

  // Prescriptions
  prescription: {
    create: (prescriptionId: string, patientName: string, diagnosis: string, prescribedBy: string, medicationCount: number) => createAuditLogEntry(
      'prescription',
      'Create Prescription',
      'Prescription',
      `Created prescription for ${patientName} - Diagnosis: ${diagnosis}, Prescribed by: ${prescribedBy}, Medications: ${medicationCount}`,
      prescriptionId
    ),
    update: (prescriptionId: string, patientName: string, changes: any) => {
      const changedFields: string[] = [];

      if (changes.before && changes.after) {
        if (changes.before.diagnosis !== changes.after.diagnosis) {
          changedFields.push(`Diagnosis: "${changes.before.diagnosis}" → "${changes.after.diagnosis}"`);
        }
        if (changes.before.prescribed_by !== changes.after.prescribed_by) {
          changedFields.push(`Prescribed By: "${changes.before.prescribed_by}" → "${changes.after.prescribed_by}"`);
        }
        if (changes.before.doctor_reg_no !== changes.after.doctor_reg_no) {
          changedFields.push(`Doctor Reg No: "${changes.before.doctor_reg_no || '(empty)'}" → "${changes.after.doctor_reg_no || '(empty)'}"`);
        }
        if (changes.before.status !== changes.after.status) {
          changedFields.push(`Status: "${changes.before.status}" → "${changes.after.status}"`);
        }
        if (changes.before.notes !== changes.after.notes) {
          const beforeNotes = changes.before.notes || '(empty)';
          const afterNotes = changes.after.notes || '(empty)';
          changedFields.push(`Notes: "${beforeNotes}" → "${afterNotes}"`);
        }
      }

      const detailsText = changedFields.length > 0
        ? `Updated prescription for ${patientName}: ${changedFields.join(', ')}`
        : `Updated prescription for ${patientName}`;

      return createAuditLogEntry(
        'prescription',
        'Update Prescription',
        'Prescription',
        detailsText,
        prescriptionId,
        changes
      );
    },
    delete: (prescriptionId: string, patientName: string, diagnosis: string, prescribedBy: string) => createAuditLogEntry(
      'prescription',
      'Delete Prescription',
      'Prescription',
      `Deleted prescription for ${patientName} - Diagnosis: ${diagnosis}, Prescribed by: ${prescribedBy}`,
      prescriptionId
    ),
    addMedication: (prescriptionId: string, patientName: string, medicationName: string, dosage: string, duration: string) => createAuditLogEntry(
      'prescription',
      'Add Medication',
      'Prescription',
      `Added medication to prescription for ${patientName}: ${medicationName} (${dosage}) for ${duration}`,
      prescriptionId
    ),
    removeMedication: (prescriptionId: string, patientName: string, medicationName: string, dosage: string) => createAuditLogEntry(
      'prescription',
      'Remove Medication',
      'Prescription',
      `Removed medication from prescription for ${patientName}: ${medicationName} (${dosage})`,
      prescriptionId
    ),
  },

  // Dental History
  dental_history: {
    create: (historyId: string, patientName: string, service: string) => createAuditLogEntry(
      'dental_history',
      'Create Dental History',
      'Dental History',
      `Added dental history entry for ${patientName} - ${service}`,
      historyId
    ),
    update: (historyId: string, patientName: string, changes: any) => createAuditLogEntry(
      'dental_history',
      'Update Dental History',
      'Dental History',
      `Updated dental history for ${patientName}`,
      historyId,
      changes
    ),
  },

  // Medicines
  medicine: {
    create: (medicineId: string, name: string, dosage: string, description?: string) => createAuditLogEntry(
      'settings',
      'Create Medicine',
      'Prescription',
      `Created medicine: ${name} (${dosage})${description ? ` - ${description}` : ''}`,
      medicineId
    ),
    update: (medicineId: string, name: string, changes: any) => {
      const changedFields: string[] = [];

      if (changes.before && changes.after) {
        if (changes.before.name !== changes.after.name) {
          changedFields.push(`Name: "${changes.before.name}" → "${changes.after.name}"`);
        }
        if (changes.before.dosage !== changes.after.dosage) {
          changedFields.push(`Dosage: "${changes.before.dosage}" → "${changes.after.dosage}"`);
        }
        if (changes.before.description !== changes.after.description) {
          const beforeDesc = changes.before.description || '(empty)';
          const afterDesc = changes.after.description || '(empty)';
          changedFields.push(`Description: "${beforeDesc}" → "${afterDesc}"`);
        }
      }

      const detailsText = changedFields.length > 0
        ? `Updated medicine ${name}: ${changedFields.join(', ')}`
        : `Updated medicine: ${name}`;

      return createAuditLogEntry(
        'settings',
        'Update Medicine',
        'Prescription',
        detailsText,
        medicineId,
        changes
      );
    },
    delete: (medicineId: string, name: string, dosage: string, description?: string) => createAuditLogEntry(
      'settings',
      'Delete Medicine',
      'Prescription',
      `Deleted medicine: ${name} (${dosage})${description ? ` - ${description}` : ''}`,
      medicineId
    ),
  },

  // Dental Charting
  dental_charting: {
    create: (chartId: string, patientName: string, entryData: any) => {
      const toothNumbers = Array.isArray(entryData.tooth_numbers) ? entryData.tooth_numbers.join(', ') : entryData.tooth_numbers || 'Unknown';
      const surfaces = Array.isArray(entryData.surfaces) && entryData.surfaces.length > 0 ? ` (Surfaces: ${entryData.surfaces.join(', ')})` : '';
      const treatmentInfo = entryData.status === 'Existing'
        ? (entryData.finding ? ` - Finding: ${entryData.finding}` : '')
        : (entryData.service ? ` - Service: ${entryData.service}` : '');

      return createAuditLogEntry(
        'dental_charting',
        'Create Dental Chart Entry',
        'Dental Chart Entry',
        `Created ${entryData.status?.toLowerCase() || 'dental'} chart entry for ${patientName} - Tooth ${toothNumbers}${surfaces}${treatmentInfo}`,
        chartId
      );
    },

    update: (chartId: string, patientName: string, changes: any) => {
      const before = changes.before;
      const after = changes.after;

      // Build detailed change description
      const changedFields: string[] = [];

      // Check for patient changes
      if (before.patient_id !== after.patient_id) {
        changedFields.push(`Patient: "${before.patient_name || 'Unknown'}" → "${after.patient_name || 'Unknown'}"`);
      }

      // Check for tooth number changes
      if (JSON.stringify(before.tooth_numbers) !== JSON.stringify(after.tooth_numbers)) {
        const beforeTeeth = Array.isArray(before.tooth_numbers) ? before.tooth_numbers.join(', ') : before.tooth_numbers || 'None';
        const afterTeeth = Array.isArray(after.tooth_numbers) ? after.tooth_numbers.join(', ') : after.tooth_numbers || 'None';
        changedFields.push(`Tooth Numbers: "${beforeTeeth}" → "${afterTeeth}"`);
      }

      // Check for surface changes
      if (JSON.stringify(before.surfaces) !== JSON.stringify(after.surfaces)) {
        const beforeSurfaces = Array.isArray(before.surfaces) && before.surfaces.length > 0 ? before.surfaces.join(', ') : 'None';
        const afterSurfaces = Array.isArray(after.surfaces) && after.surfaces.length > 0 ? after.surfaces.join(', ') : 'None';
        changedFields.push(`Surfaces: "${beforeSurfaces}" → "${afterSurfaces}"`);
      }

      // Check for finding changes
      if (before.finding !== after.finding) {
        changedFields.push(`Finding: "${before.finding || 'None'}" → "${after.finding || 'None'}"`);
      }

      // Check for service changes
      if (before.service !== after.service) {
        changedFields.push(`Service: "${before.service || 'None'}" → "${after.service || 'None'}"`);
      }

      // Check for status changes
      if (before.status !== after.status) {
        changedFields.push(`Status: "${before.status || 'None'}" → "${after.status || 'None'}"`);
      }

      // Check for notes changes
      if (before.notes !== after.notes) {
        const beforeNotes = before.notes ? (before.notes.length > 50 ? before.notes.substring(0, 50) + '...' : before.notes) : 'None';
        const afterNotes = after.notes ? (after.notes.length > 50 ? after.notes.substring(0, 50) + '...' : after.notes) : 'None';
        changedFields.push(`Notes: "${beforeNotes}" → "${afterNotes}"`);
      }

      // Check for doctor changes
      if (before.doctor !== after.doctor) {
        changedFields.push(`Doctor: "${before.doctor || 'None'}" → "${after.doctor || 'None'}"`);
      }

      // Check for date recorded changes
      if (before.date_recorded !== after.date_recorded) {
        changedFields.push(`Date Recorded: "${before.date_recorded || 'None'}" → "${after.date_recorded || 'None'}"`);
      }

      // Check for appointment link changes
      if (before.scheduled_appointment_id !== after.scheduled_appointment_id) {
        changedFields.push(`Appointment Link: "${before.scheduled_appointment_id || 'None'}" → "${after.scheduled_appointment_id || 'None'}"`);
      }

      // Check for snooze changes
      if (before.snoozed_until !== after.snoozed_until) {
        changedFields.push(`Snoozed Until: "${before.snoozed_until || 'None'}" → "${after.snoozed_until || 'None'}"`);
      }

      // Check for follow-up changes
      if (JSON.stringify(before.follow_up_ids) !== JSON.stringify(after.follow_up_ids)) {
        const beforeFollowUps = Array.isArray(before.follow_up_ids) && before.follow_up_ids.length > 0 ? before.follow_up_ids.join(', ') : 'None';
        const afterFollowUps = Array.isArray(after.follow_up_ids) && after.follow_up_ids.length > 0 ? after.follow_up_ids.join(', ') : 'None';
        changedFields.push(`Follow-up IDs: "${beforeFollowUps}" → "${afterFollowUps}"`);
      }

      // Build final details text
      const toothNumbers = Array.isArray(after.tooth_numbers) ? after.tooth_numbers.join(', ') : after.tooth_numbers || 'Unknown';
      const baseDetails = `Updated dental chart entry for ${patientName} - Tooth ${toothNumbers}`;
      const detailsText = changedFields.length > 0
        ? `${baseDetails}: ${changedFields.join(', ')}`
        : `${baseDetails} - No specific field changes detected`;

      return createAuditLogEntry(
        'dental_charting',
        'Update Dental Chart Entry',
        'Dental Chart Entry',
        detailsText,
        chartId,
        changes
      );
    },

    statusChange: (chartId: string, patientName: string, toothNumbers: string[], oldStatus: string, newStatus: string, service?: string, finding?: string) => {
      const teeth = Array.isArray(toothNumbers) ? toothNumbers.join(', ') : 'Unknown';
      const treatmentInfo = newStatus === 'Existing'
        ? (finding ? ` - Finding: ${finding}` : '')
        : (service ? ` - Service: ${service}` : '');

      return createAuditLogEntry(
        'dental_charting',
        'Update Dental Chart Status',
        'Dental Chart Entry',
        `Changed status for ${patientName} - Tooth ${teeth}${treatmentInfo}: "${oldStatus}" → "${newStatus}"`,
        chartId
      );
    },

    linkToAppointment: (chartId: string, patientName: string, toothNumbers: string[], appointmentId: string, service?: string) => {
      const teeth = Array.isArray(toothNumbers) ? toothNumbers.join(', ') : 'Unknown';
      const serviceInfo = service ? ` - Service: ${service}` : '';

      return createAuditLogEntry(
        'dental_charting',
        'Link Chart to Appointment',
        'Dental Chart Entry',
        `Linked dental chart entry for ${patientName} - Tooth ${teeth}${serviceInfo} to appointment ${appointmentId}`,
        chartId
      );
    },

    snooze: (chartId: string, patientName: string, toothNumbers: string[], snoozeDate: string, notes?: string, service?: string) => {
      const teeth = Array.isArray(toothNumbers) ? toothNumbers.join(', ') : 'Unknown';
      const serviceInfo = service ? ` - Service: ${service}` : '';
      const notesInfo = notes ? ` with notes: "${notes}"` : '';

      return createAuditLogEntry(
        'dental_charting',
        'Snooze Dental Chart Entry',
        'Dental Chart Entry',
        `Snoozed dental chart entry for ${patientName} - Tooth ${teeth}${serviceInfo} until ${snoozeDate}${notesInfo}`,
        chartId
      );
    },

    delete: (chartId: string, patientName: string, toothNumbers: string[], status?: string, service?: string, finding?: string) => {
      const teeth = Array.isArray(toothNumbers) ? toothNumbers.join(', ') : 'Unknown';
      const treatmentInfo = status === 'Existing'
        ? (finding ? ` - Finding: ${finding}` : '')
        : (service ? ` - Service: ${service}` : '');

      return createAuditLogEntry(
        'dental_charting',
        'Delete Dental Chart Entry',
        'Dental Chart Entry',
        `Deleted ${status?.toLowerCase() || 'dental'} chart entry for ${patientName} - Tooth ${teeth}${treatmentInfo}`,
        chartId
      );
    },
  },

  // Vital Signs
  vital_signs: {
    create: (vitalId: string, patientName: string, weight: string, bloodPressure: string, pulse: string, temperature: string, respiratoryRate: string, notes?: string) => createAuditLogEntry(
      'vital_signs',
      'Record Vital Signs',
      'Vital Signs',
      `Recorded vital signs for ${patientName} - Weight: ${weight}kg, Blood Pressure: ${bloodPressure}mmHg, Pulse: ${pulse}bpm, Temperature: ${temperature}°C, Respiratory Rate: ${respiratoryRate}/min${notes ? `, Notes: ${notes}` : ''}`,
      vitalId
    ),

    update: (vitalId: string, patientName: string, changes: { before: any, after: any }) => {
      const fieldChanges: string[] = [];

      // Compare each field and build detailed change description
      if (changes.before.weight !== changes.after.weight) {
        fieldChanges.push(`Weight: "${changes.before.weight}kg" → "${changes.after.weight}kg"`);
      }
      if (changes.before.blood_pressure !== changes.after.blood_pressure) {
        fieldChanges.push(`Blood Pressure: "${changes.before.blood_pressure}mmHg" → "${changes.after.blood_pressure}mmHg"`);
      }
      if (changes.before.pulse !== changes.after.pulse) {
        fieldChanges.push(`Pulse: "${changes.before.pulse}bpm" → "${changes.after.pulse}bpm"`);
      }
      if (changes.before.temperature !== changes.after.temperature) {
        fieldChanges.push(`Temperature: "${changes.before.temperature}°C" → "${changes.after.temperature}°C"`);
      }
      if (changes.before.respiratory_rate !== changes.after.respiratory_rate) {
        fieldChanges.push(`Respiratory Rate: "${changes.before.respiratory_rate}/min" → "${changes.after.respiratory_rate}/min"`);
      }
      if ((changes.before.notes || '') !== (changes.after.notes || '')) {
        const beforeNotes = changes.before.notes || 'No notes';
        const afterNotes = changes.after.notes || 'No notes';
        fieldChanges.push(`Notes: "${beforeNotes}" → "${afterNotes}"`);
      }

      const changesText = fieldChanges.length > 0 ? fieldChanges.join(', ') : 'No changes detected';

      return createAuditLogEntry(
        'vital_signs',
        'Update Vital Signs',
        'Vital Signs',
        `Updated vital signs for ${patientName}: ${changesText}`,
        vitalId,
        changes
      );
    },

    delete: (vitalId: string, patientName: string, weight: string, bloodPressure: string, pulse: string, temperature: string, respiratoryRate: string, recordDate: string) => createAuditLogEntry(
      'vital_signs',
      'Delete Vital Signs',
      'Vital Signs',
      `Deleted vital signs record for ${patientName} (recorded on ${recordDate}) - Weight: ${weight}kg, Blood Pressure: ${bloodPressure}mmHg, Pulse: ${pulse}bpm, Temperature: ${temperature}°C, Respiratory Rate: ${respiratoryRate}/min`,
      vitalId
    ),
  },

  // Service Follow-up Rules
  serviceFollowUpRule: {
    create: (ruleId: string, triggeringService: string, followUpSteps: any[]) => {
      const stepsDescription = followUpSteps.map((step, index) => {
        let stepService = step.suggested_service_name || step.suggestedServiceName || step.service_name || step.serviceName;
        let stepInterval = step.interval_days || step.intervalDays || step.interval;
        const stepSequence = step.sequence || step.step || index + 1;

        // Enhanced field extraction for service name
        if (!stepService || stepService.includes('undefined')) {
          for (const [key, value] of Object.entries(step)) {
            if (typeof value === 'string' && value.length > 0 && !value.includes('undefined') &&
                (key.toLowerCase().includes('service') || key.toLowerCase().includes('name'))) {
              stepService = value;
              break;
            }
          }
          if (!stepService || stepService.includes('undefined')) {
            stepService = `Follow-up Step ${stepSequence}`;
          }
        }

        // Enhanced field extraction for interval
        if (!stepInterval || stepInterval === 0) {
          for (const [key, value] of Object.entries(step)) {
            if (typeof value === 'number' && value > 0 &&
                (key.toLowerCase().includes('interval') || key.toLowerCase().includes('days'))) {
              stepInterval = value;
              break;
            }
          }
          if (!stepInterval || stepInterval === 0) {
            stepInterval = 30; // Default to 30 days
          }
        }

        return `Step ${stepSequence}: ${stepService} (${stepInterval} days)`;
      }).join(', ');

      return createAuditLogEntry(
        'service',
        'Create Follow-up Rule',
        'Service',
        `Created follow-up rule for ${triggeringService} - Steps: ${stepsDescription}`,
        ruleId
      );
    },
    update: (ruleId: string, triggeringService: string, changes: any) => {
      const before = changes.before;
      const after = changes.after;

      // Build detailed change description
      const changedFields: string[] = [];

      if (before.triggering_service_name !== after.triggering_service_name) {
        changedFields.push(`Triggering Service: "${before.triggering_service_name}" → "${after.triggering_service_name}"`);
      }

      // Compare follow-up steps (check both possible field names)
      const beforeSteps = before.followUps || before.follow_up_steps || [];
      const afterSteps = after.followUps || after.follow_up_steps || [];



      if (beforeSteps.length !== afterSteps.length) {
        changedFields.push(`Number of Steps: "${beforeSteps.length}" → "${afterSteps.length}"`);
      }

      // Check for step changes
      const stepChanges: string[] = [];
      const maxSteps = Math.max(beforeSteps.length, afterSteps.length);

      for (let i = 0; i < maxSteps; i++) {
        const beforeStep = beforeSteps[i];
        const afterStep = afterSteps[i];

        if (!beforeStep && afterStep) {

          // Try multiple field extraction approaches
          let stepService = afterStep.suggested_service_name || afterStep.suggestedServiceName || afterStep.service_name || afterStep.serviceName;
          let stepInterval = afterStep.interval_days || afterStep.intervalDays || afterStep.interval || afterStep.days || afterStep.intervalInDays || afterStep.follow_up_days || afterStep.followUpDays;
          const stepSequence = afterStep.sequence || afterStep.step || i + 1;



          // If service name is still undefined or contains "undefined", try to extract from other fields
          if (!stepService || stepService.includes('undefined')) {
            // Look for any field that might contain the service name
            for (const [key, value] of Object.entries(afterStep)) {
              if (typeof value === 'string' && value.length > 0 && !value.includes('undefined') &&
                  (key.toLowerCase().includes('service') || key.toLowerCase().includes('name'))) {
                stepService = value;
                break;
              }
            }
            // Final fallback
            if (!stepService || stepService.includes('undefined')) {
              stepService = `Follow-up Step ${stepSequence}`;
            }
          }

          // If interval is still 0 or undefined, try to extract from other fields
          if (!stepInterval || stepInterval === 0) {
            for (const [key, value] of Object.entries(afterStep)) {
              if (typeof value === 'number' && value > 0) {
                if (key.toLowerCase().includes('interval') || key.toLowerCase().includes('days')) {
                  stepInterval = value;
                  break;
                }
              }
              // Also check for string values that might be numeric
              if (typeof value === 'string' && !isNaN(Number(value)) && Number(value) > 0) {
                if (key.toLowerCase().includes('interval') || key.toLowerCase().includes('days')) {
                  stepInterval = Number(value);
                  break;
                }
              }
            }
            // If still no valid interval, use a reasonable default
            if (!stepInterval || stepInterval === 0) {
              stepInterval = 30; // Default to 30 days
            }
          }

          stepChanges.push(`Added Step ${stepSequence}: ${stepService} (${stepInterval} days)`);
        } else if (beforeStep && !afterStep) {
          const stepService = beforeStep.suggested_service_name || beforeStep.suggestedServiceName || beforeStep.service_name || beforeStep.serviceName || 'Unknown Service';
          const stepSequence = beforeStep.sequence || beforeStep.step || i + 1;
          stepChanges.push(`Removed Step ${stepSequence}: ${stepService}`);
        } else if (beforeStep && afterStep) {
          const stepFieldChanges: string[] = [];

          // Check interval_days field with multiple possible field names
          const beforeInterval = beforeStep.interval_days || beforeStep.intervalDays || beforeStep.interval || 0;
          const afterInterval = afterStep.interval_days || afterStep.intervalDays || afterStep.interval || 0;

          // Only log interval changes if both values are valid (not 0 or undefined)
          if (beforeInterval !== afterInterval && beforeInterval > 0 && afterInterval > 0) {
            stepFieldChanges.push(`interval: ${beforeInterval} → ${afterInterval} days`);
          }

          // Check suggested_service_name field with multiple possible field names
          const beforeService = beforeStep.suggested_service_name || beforeStep.suggestedServiceName || beforeStep.service_name || beforeStep.serviceName || '';
          const afterService = afterStep.suggested_service_name || afterStep.suggestedServiceName || afterStep.service_name || afterStep.serviceName || '';

          // Only log service changes if both values are valid (not empty or containing "undefined")
          if (beforeService !== afterService &&
              beforeService && afterService &&
              !afterService.includes('undefined') &&
              !beforeService.includes('undefined')) {
            stepFieldChanges.push(`service: "${beforeService}" → "${afterService}"`);
          }

          // Check notes field
          const beforeNotes = beforeStep.notes || beforeStep.note || '';
          const afterNotes = afterStep.notes || afterStep.note || '';
          if (beforeNotes !== afterNotes) {
            const beforeNotesDesc = beforeNotes ? 'Added' : 'None';
            const afterNotesDesc = afterNotes ? 'Added' : 'None';
            stepFieldChanges.push(`notes: ${beforeNotesDesc} → ${afterNotesDesc}`);
          }

          if (stepFieldChanges.length > 0) {
            const stepSequence = afterStep.sequence || beforeStep.sequence || afterStep.step || beforeStep.step || i + 1;
            stepChanges.push(`Step ${stepSequence}: ${stepFieldChanges.join(', ')}`);
          }
        }
      }

      if (stepChanges.length > 0) {
        changedFields.push(`Steps: ${stepChanges.join('; ')}`);
      }

      // If no meaningful changes were detected, provide a simple update message
      const detailsText = changedFields.length > 0
        ? `Updated follow-up rule for ${triggeringService}: ${changedFields.join(', ')}`
        : `Updated follow-up rule for ${triggeringService}`;

      return createAuditLogEntry(
        'service',
        'Update Follow-up Rule',
        'Service',
        detailsText,
        ruleId,
        changes
      );
    },
    delete: (ruleId: string, triggeringService: string, followUpSteps?: any[]) => {
      const stepsDescription = followUpSteps ? followUpSteps.map((step, index) => {
        let stepService = step.suggested_service_name || step.suggestedServiceName || step.service_name || step.serviceName;
        let stepInterval = step.interval_days || step.intervalDays || step.interval;
        const stepSequence = step.sequence || step.step || index + 1;

        // Enhanced field extraction for service name
        if (!stepService || stepService.includes('undefined')) {
          for (const [key, value] of Object.entries(step)) {
            if (typeof value === 'string' && value.length > 0 && !value.includes('undefined') &&
                (key.toLowerCase().includes('service') || key.toLowerCase().includes('name'))) {
              stepService = value;
              break;
            }
          }
          if (!stepService || stepService.includes('undefined')) {
            stepService = `Follow-up Step ${stepSequence}`;
          }
        }

        // Enhanced field extraction for interval
        if (!stepInterval || stepInterval === 0) {
          for (const [key, value] of Object.entries(step)) {
            if (typeof value === 'number' && value > 0 &&
                (key.toLowerCase().includes('interval') || key.toLowerCase().includes('days'))) {
              stepInterval = value;
              break;
            }
          }
          if (!stepInterval || stepInterval === 0) {
            stepInterval = 30; // Default to 30 days
          }
        }

        return `Step ${stepSequence}: ${stepService} (${stepInterval} days)`;
      }).join(', ') : '';

      return createAuditLogEntry(
        'service',
        'Delete Follow-up Rule',
        'Service',
        `Deleted follow-up rule for ${triggeringService}${stepsDescription ? ` - Steps: ${stepsDescription}` : ''}`,
        ruleId
      );
    },
  },

  // User Management
  user: {
    create: (userId: string, userName: string, role: string) => createAuditLogEntry(
      'user',
      'Create User',
      'User',
      `Created new user: ${userName} (Role: ${role})`,
      userId
    ),
    update: (userId: string, userName: string, changes: any) => createAuditLogEntry(
      'user',
      'Update User',
      'User',
      `Updated user: ${userName}`,
      userId,
      changes
    ),
    delete: (userId: string, userName: string) => createAuditLogEntry(
      'user',
      'Delete User',
      'User',
      `Deleted user: ${userName}`,
      userId
    ),
    roleChange: (userId: string, userName: string, oldRole: string, newRole: string) => createAuditLogEntry(
      'user',
      'Change User Role',
      'User',
      `Changed role for ${userName} from ${oldRole} to ${newRole}`,
      userId
    ),
  },
};
