export interface PermissionDefinition {
  module: string;
  action: string;
  display_name: string;
  description: string;
}

export const PERMISSION_DEFINITIONS: PermissionDefinition[] = [
  // Dashboard
  {
    module: 'dashboard',
    action: 'view',
    display_name: 'View Dashboard',
    description: 'Access to main dashboard and analytics'
  },

  // Appointments
  {
    module: 'appointments',
    action: 'view',
    display_name: 'View Appointments',
    description: 'View appointment schedules and details'
  },
  {
    module: 'appointments',
    action: 'create',
    display_name: 'Create Appointments',
    description: 'Book new appointments for patients'
  },
  {
    module: 'appointments',
    action: 'edit',
    display_name: 'Edit Appointments',
    description: 'Modify existing appointment details'
  },
  {
    module: 'appointments',
    action: 'delete',
    display_name: 'Delete Appointments',
    description: 'Cancel and remove appointments'
  },


  // Patients
  {
    module: 'patients',
    action: 'view',
    display_name: 'View Patients',
    description: 'Access patient list and basic information'
  },
  {
    module: 'patients',
    action: 'create',
    display_name: 'Add New Patients',
    description: 'Register new patients in the system'
  },
  {
    module: 'patients',
    action: 'edit',
    display_name: 'Edit Patient Information',
    description: 'Modify patient personal and contact details'
  },
  {
    module: 'patients',
    action: 'delete',
    display_name: 'Delete Patients',
    description: 'Remove patient records from system'
  },
  {
    module: 'patients',
    action: 'export',
    display_name: 'Export Patients',
    description: 'Download patient data to CSV/Excel'
  },
  {
    module: 'patients',
    action: 'view_dental_chart',
    display_name: 'View Dental Chart',
    description: 'Access patient dental charting'
  },
  {
    module: 'patients',
    action: 'edit_dental_chart',
    display_name: 'Edit Dental Chart',
    description: 'Modify patient dental chart'
  },
  {
    module: 'patients',
    action: 'view_treatment_history',
    display_name: 'View Treatment History Tab',
    description: 'Access patient treatment history'
  },
  {
    module: 'patients',
    action: 'view_prescriptions',
    display_name: 'View Prescriptions',
    description: 'Access patient prescriptions'
  },
  {
    module: 'patients',
    action: 'create_prescriptions',
    display_name: 'Create Prescriptions',
    description: 'Add new prescriptions for patients'
  },
  {
    module: 'patients',
    action: 'edit_prescriptions',
    display_name: 'Edit Prescriptions',
    description: 'Modify patient prescriptions'
  },
  {
    module: 'patients',
    action: 'delete_prescriptions',
    display_name: 'Delete Prescriptions',
    description: 'Remove patient prescriptions'
  },
  {
    module: 'patients',
    action: 'view_vital_signs',
    display_name: 'View Vital Signs',
    description: 'Access patient vital signs'
  },
  {
    module: 'patients',
    action: 'create_vital_signs',
    display_name: 'Create Vital Signs',
    description: 'Add new vital sign records'
  },
  {
    module: 'patients',
    action: 'edit_vital_signs',
    display_name: 'Edit Vital Signs',
    description: 'Modify vital sign records'
  },
  {
    module: 'patients',
    action: 'delete_vital_signs',
    display_name: 'Delete Vital Signs',
    description: 'Remove vital sign records'
  },


  // Recall List
  {
    module: 'recall_list',
    action: 'view',
    display_name: 'View Recall List',
    description: 'Access patient recall and follow-up list'
  },
  {
    module: 'recall_list',
    action: 'delete',
    display_name: 'Delete Recall Entries',
    description: 'Remove entries from recall list'
  },

  // Lab Work
  {
    module: 'lab_work',
    action: 'view',
    display_name: 'View Lab Work',
    description: 'Access lab work orders and status'
  },
  {
    module: 'lab_work',
    action: 'create',
    display_name: 'Create Lab Work',
    description: 'Create new lab work orders'
  },
  {
    module: 'lab_work',
    action: 'edit',
    display_name: 'Edit Lab Work',
    description: 'Modify lab work order details'
  },
  {
    module: 'lab_work',
    action: 'delete',
    display_name: 'Delete Lab Work',
    description: 'Remove lab work orders'
  },
  {
    module: 'lab_work',
    action: 'change_status',
    display_name: 'Change Lab Work Status',
    description: 'Update lab work progress status'
  },
  {
    module: 'lab_work',
    action: 'export',
    display_name: 'Export Lab Work',
    description: 'Download lab work data to CSV/Excel'
  },

  // Stock Management
  {
    module: 'stock',
    action: 'view',
    display_name: 'View Stock',
    description: 'Access inventory and stock levels'
  },
  {
    module: 'stock',
    action: 'create',
    display_name: 'Add Stock Items',
    description: 'Add new items to inventory'
  },
  {
    module: 'stock',
    action: 'edit',
    display_name: 'Edit Stock Items',
    description: 'Modify stock item details'
  },
  {
    module: 'stock',
    action: 'delete',
    display_name: 'Delete Stock Items',
    description: 'Remove items from inventory'
  },
  {
    module: 'stock',
    action: 'view_batches',
    display_name: 'View Stock Batches',
    description: 'Access stock batch information'
  },
  {
    module: 'stock',
    action: 'manage_batches',
    display_name: 'Manage Stock Batches',
    description: 'Add and modify stock batches'
  },
  {
    module: 'stock',
    action: 'consume',
    display_name: 'Consume Stock',
    description: 'Record stock consumption and usage'
  },
  {
    module: 'stock',
    action: 'export',
    display_name: 'Export Stock',
    description: 'Download stock data to CSV/Excel'
  },

  // Reports
  {
    module: 'reports',
    action: 'view',
    display_name: 'View Reports',
    description: 'Access reporting and analytics'
  },
  {
    module: 'reports',
    action: 'export',
    display_name: 'Export Reports',
    description: 'Download and export report data'
  },
  {
    module: 'reports',
    action: 'view_financial',
    display_name: 'View Financial Reports',
    description: 'Access financial and revenue reports'
  },
  {
    module: 'reports',
    action: 'view_patient',
    display_name: 'View Patient Reports',
    description: 'Access patient-related reports'
  },
  {
    module: 'reports',
    action: 'view_appointment',
    display_name: 'View Appointment Reports',
    description: 'Access appointment and scheduling reports'
  },

  // Audit Logs
  {
    module: 'audit_logs',
    action: 'view',
    display_name: 'View Audit Logs',
    description: 'Access system audit and activity logs'
  },
  {
    module: 'audit_logs',
    action: 'export',
    display_name: 'Export Audit Logs',
    description: 'Download audit log data'
  },

  // Settings
  {
    module: 'settings',
    action: 'view_doctors',
    display_name: 'Manage Doctors',
    description: 'Add, edit, and manage doctor profiles'
  },
  {
    module: 'settings',
    action: 'view_services',
    display_name: 'Manage Services',
    description: 'Configure clinic services and treatments'
  },
  {
    module: 'settings',
    action: 'view_service_followup',
    display_name: 'Manage Service Follow-up',
    description: 'Configure service follow-up rules'
  },
  {
    module: 'settings',
    action: 'view_labs',
    display_name: 'Manage Labs',
    description: 'Configure laboratory settings'
  },
  {
    module: 'settings',
    action: 'view_lab_work_types',
    display_name: 'Manage Lab Work Types',
    description: 'Configure lab work categories'
  },
  {
    module: 'settings',
    action: 'view_stock_settings',
    display_name: 'Manage Stock Settings',
    description: 'Configure inventory settings'
  },
  {
    module: 'settings',
    action: 'view_dealers',
    display_name: 'Manage Dealers',
    description: 'Manage supplier and dealer information'
  },
  {
    module: 'settings',
    action: 'view_medicines',
    display_name: 'Manage Medicines',
    description: 'Configure medicine database'
  },
  {
    module: 'settings',
    action: 'view_user_management',
    display_name: 'Manage Users',
    description: 'Add, edit, and manage user accounts'
  },
  {
    module: 'settings',
    action: 'view_roles',
    display_name: 'Manage Roles & Permissions',
    description: 'Configure user roles and permissions'
  },

  // Additional granular settings permissions
  {
    module: 'settings',
    action: 'manage_users',
    display_name: 'Add/Edit/Delete Users',
    description: 'Full user management capabilities'
  },
  {
    module: 'settings',
    action: 'manage_roles',
    display_name: 'Add/Edit/Delete Roles',
    description: 'Full role management capabilities'
  }
];

// Group permissions by module for UI display
export const PERMISSION_MODULES = {
  dashboard: 'Dashboard',
  appointments: 'Appointments',
  patients: 'Patients',
  recall_list: 'Recall List',
  lab_work: 'Lab Work',
  stock: 'Stock Management',
  reports: 'Reports',
  audit_logs: 'Audit Logs',
  settings: 'Settings'
};

// Get permissions grouped by module
export const getPermissionsByModule = () => {
  const grouped: Record<string, PermissionDefinition[]> = {};

  PERMISSION_DEFINITIONS.forEach(permission => {
    if (!grouped[permission.module]) {
      grouped[permission.module] = [];
    }
    grouped[permission.module].push(permission);
  });

  return grouped;
};
