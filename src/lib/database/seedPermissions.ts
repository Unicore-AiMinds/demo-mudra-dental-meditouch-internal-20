import { supabase } from '../supabase';
import { PERMISSION_DEFINITIONS } from '../permissions/definitions';
import { roleOperations, permissionOperations, rolePermissionOperations } from './roles';

// Seed permissions into database
export const seedPermissions = async () => {
  try {
    console.log('🌱 Starting permission seeding...');

    // Get existing permissions
    const existingPermissions = await permissionOperations.getAll();
    const existingPermissionKeys = existingPermissions.map(p => `${p.module}.${p.action}`);

    // Insert new permissions
    for (const permissionDef of PERMISSION_DEFINITIONS) {
      const key = `${permissionDef.module}.${permissionDef.action}`;
      
      if (!existingPermissionKeys.includes(key)) {
        await supabase.from('permissions').insert({
          module: permissionDef.module,
          action: permissionDef.action,
          display_name: permissionDef.display_name,
          description: permissionDef.description
        });
        console.log(`✅ Added permission: ${permissionDef.display_name}`);
      }
    }

    console.log('✅ Permission seeding completed');
  } catch (error) {
    console.error('❌ Error seeding permissions:', error);
    throw error;
  }
};

// Seed default roles
export const seedDefaultRoles = async () => {
  try {
    console.log('🌱 Starting role seeding...');

    // Check if Super Admin role exists
    const existingRoles = await roleOperations.getAll();
    const superAdminExists = existingRoles.some(role => role.name === 'super_admin');

    if (!superAdminExists) {
      // Create Super Admin role
      const superAdminRole = await roleOperations.create({
        name: 'super_admin',
        display_name: 'Super Administrator',
        description: 'System administrator with full access to all features',
        is_system_role: true,
        is_deletable: false
      });

      // Give Super Admin all permissions
      const allPermissions = await permissionOperations.getAll();
      const allPermissionIds = allPermissions.map(p => p.id);
      await rolePermissionOperations.updateRolePermissions(superAdminRole.id, allPermissionIds);

      console.log('✅ Created Super Administrator role with all permissions');
    }

    // Create other default roles if they don't exist
    const defaultRoles = [
      {
        name: 'doctor',
        display_name: 'Doctor',
        description: 'Medical professional with patient care access',
        permissions: [
          'dashboard.view',
          'appointments.view', 'appointments.create', 'appointments.edit',
          'patients.view', 'patients.create', 'patients.edit',
          'patients.view_patient_info', 'patients.view_appointments',
          'patients.view_dental_charting', 'patients.edit_dental_charting',
          'patients.view_dental_history', 'patients.view_prescriptions',
          'patients.create_prescriptions', 'patients.edit_prescriptions',
          'patients.view_vital_signs', 'patients.edit_vital_signs',
          'recall_list.view', 'recall_list.schedule',
          'lab_work.view', 'lab_work.create', 'lab_work.edit'
        ]
      },
      {
        name: 'receptionist',
        display_name: 'Receptionist',
        description: 'Front desk staff with appointment and basic patient access',
        permissions: [
          'dashboard.view',
          'appointments.view', 'appointments.create', 'appointments.edit',
          'patients.view', 'patients.create', 'patients.edit',
          'patients.view_patient_info', 'patients.view_appointments',
          'recall_list.view', 'recall_list.schedule'
        ]
      },
      {
        name: 'inventory_manager',
        display_name: 'Inventory Manager',
        description: 'Staff member responsible for stock and inventory management',
        permissions: [
          'dashboard.view',
          'stock.view', 'stock.create', 'stock.edit', 'stock.delete',
          'stock.view_batches', 'stock.manage_batches', 'stock.consume',
          'lab_work.view', 'lab_work.create', 'lab_work.edit', 'lab_work.change_status',
          'settings.view_stock_settings', 'settings.view_dealers'
        ]
      }
    ];

    for (const roleData of defaultRoles) {
      const roleExists = existingRoles.some(role => role.name === roleData.name);
      
      if (!roleExists) {
        // Create role
        const newRole = await roleOperations.create({
          name: roleData.name,
          display_name: roleData.display_name,
          description: roleData.description,
          is_system_role: false,
          is_deletable: true
        });

        // Assign permissions
        const allPermissions = await permissionOperations.getAll();
        const rolePermissionIds = allPermissions
          .filter(p => roleData.permissions.includes(`${p.module}.${p.action}`))
          .map(p => p.id);

        await rolePermissionOperations.updateRolePermissions(newRole.id, rolePermissionIds);

        console.log(`✅ Created ${roleData.display_name} role with ${rolePermissionIds.length} permissions`);
      }
    }

    console.log('✅ Role seeding completed');
  } catch (error) {
    console.error('❌ Error seeding roles:', error);
    throw error;
  }
};

// Initialize the permission system
export const initializePermissionSystem = async () => {
  try {
    console.log('🚀 Initializing permission system...');
    
    await seedPermissions();
    await seedDefaultRoles();
    
    console.log('🎉 Permission system initialized successfully!');
  } catch (error) {
    console.error('❌ Failed to initialize permission system:', error);
    throw error;
  }
};
