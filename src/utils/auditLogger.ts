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

  // Lab Work
  lab: {
    create: (labWorkId: string, patientName: string, workType: string) => createAuditLogEntry(
      'lab',
      'Create Lab Work',
      'Lab Work',
      `Created lab work for ${patientName} - ${workType}`,
      labWorkId
    ),
    update: (labWorkId: string, patientName: string, changes: any) => createAuditLogEntry(
      'lab',
      'Update Lab Work',
      'Lab Work',
      `Updated lab work for ${patientName}`,
      labWorkId,
      changes
    ),
    statusChange: (labWorkId: string, patientName: string, oldStatus: string, newStatus: string) => createAuditLogEntry(
      'lab',
      'Update Lab Status',
      'Lab Work',
      `Changed lab work status for ${patientName} from ${oldStatus} to ${newStatus}`,
      labWorkId
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
    create: (prescriptionId: string, patientName: string) => createAuditLogEntry(
      'prescription',
      'Create Prescription',
      'Prescription',
      `Created prescription for ${patientName}`,
      prescriptionId
    ),
    update: (prescriptionId: string, patientName: string, changes: any) => createAuditLogEntry(
      'prescription',
      'Update Prescription',
      'Prescription',
      `Updated prescription for ${patientName}`,
      prescriptionId,
      changes
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

  // Dental Charting
  dental_charting: {
    create: (chartId: string, patientName: string, toothNumber: string) => createAuditLogEntry(
      'dental_charting',
      'Create Dental Chart',
      'Dental Chart',
      `Added dental chart entry for ${patientName} - Tooth ${toothNumber}`,
      chartId
    ),
    update: (chartId: string, patientName: string, toothNumber: string, changes: any) => createAuditLogEntry(
      'dental_charting',
      'Update Dental Chart',
      'Dental Chart',
      `Updated dental chart for ${patientName} - Tooth ${toothNumber}`,
      chartId,
      changes
    ),
  },

  // Vital Signs
  vital_signs: {
    create: (vitalId: string, patientName: string) => createAuditLogEntry(
      'vital_signs',
      'Record Vital Signs',
      'Vital Signs',
      `Recorded vital signs for ${patientName}`,
      vitalId
    ),
    update: (vitalId: string, patientName: string, changes: any) => createAuditLogEntry(
      'vital_signs',
      'Update Vital Signs',
      'Vital Signs',
      `Updated vital signs for ${patientName}`,
      vitalId,
      changes
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
