import { supabase } from '../supabase';

export interface Role {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  is_system_role: boolean;
  is_deletable: boolean;
  created_at: string;
  updated_at: string;
}

export interface Permission {
  id: string;
  module: string;
  action: string;
  display_name: string;
  description?: string;
  created_at: string;
}

export interface RolePermission {
  id: string;
  role_id: string;
  permission_id: string;
  granted: boolean;
  created_at: string;
}

// Role operations
export const roleOperations = {
  // Get all roles
  async getAll(): Promise<Role[]> {
    return await supabase.from('roles').getAll({
      orderBy: [{ field: 'is_system_role', direction: 'desc' }, { field: 'display_name', direction: 'asc' }]
    });
  },

  // Get role by ID
  async getById(id: string): Promise<Role | null> {
    return await supabase.from('roles').getById(id);
  },

  // Create new role
  async create(roleData: Omit<Role, 'id' | 'created_at' | 'updated_at'>): Promise<Role> {
    return await supabase.from('roles').insert(roleData);
  },

  // Update role
  async update(id: string, roleData: Partial<Role>): Promise<Role> {
    return await supabase.from('roles').update(id, roleData);
  },

  // Delete role (only if deletable)
  async delete(id: string): Promise<void> {
    const role = await this.getById(id);
    if (!role?.is_deletable) {
      throw new Error('This role cannot be deleted');
    }
    await supabase.from('roles').delete(id);
  }
};

// Permission operations
export const permissionOperations = {
  // Get all permissions
  async getAll(): Promise<Permission[]> {
    return await supabase.from('permissions').getAll({
      orderBy: [{ field: 'module', direction: 'asc' }, { field: 'action', direction: 'asc' }]
    });
  },

  // Get permissions by module
  async getByModule(module: string): Promise<Permission[]> {
    return await supabase.from('permissions').getAll({
      filters: { module },
      orderBy: [{ field: 'action', direction: 'asc' }]
    });
  }
};

// Role-Permission operations
export const rolePermissionOperations = {
  // Get role permissions
  async getRolePermissions(roleId: string): Promise<Permission[]> {
    console.log('📋 Getting permissions for role:', roleId);

    const rolePermissions = await supabase.from('role_permissions').getAll({
      filters: { role_id: roleId, granted: true }
    });

    console.log('📋 Found role_permissions records:', rolePermissions.length);

    const permissionIds = rolePermissions.map(rp => rp.permission_id);
    console.log('📋 Permission IDs:', permissionIds);

    if (permissionIds.length === 0) {
      console.log('📋 No permissions found for role');
      return [];
    }

    const permissions = await supabase.from('permissions').getAll({
      filters: { id: { in: permissionIds } }
    });

    console.log('📋 Retrieved permissions:', permissions.length);

    return permissions;
  },

  // Update role permissions
  async updateRolePermissions(roleId: string, permissionIds: string[]): Promise<void> {
    console.log('🔄 Updating role permissions for role:', roleId);
    console.log('🔄 New permission IDs:', permissionIds);

    // Validate inputs
    if (!roleId) {
      throw new Error('Role ID is required and cannot be null or empty');
    }

    if (!Array.isArray(permissionIds)) {
      throw new Error('Permission IDs must be an array');
    }

    // First, delete all existing permissions for this role
    const existingPermissions = await supabase.from('role_permissions').getAll({
      filters: { role_id: roleId }
    });

    console.log('🗑️ Found existing permissions to delete:', existingPermissions.length);

    for (const permission of existingPermissions) {
      console.log('🗑️ Deleting permission:', permission.id);
      await supabase.from('role_permissions').delete(permission.id);
    }

    // Then, add new permissions
    console.log('➕ Adding new permissions...');
    for (const permissionId of permissionIds) {
      console.log('➕ Adding permission:', permissionId);

      // Validate permission ID
      if (!permissionId) {
        console.error('❌ Skipping null/empty permission ID');
        continue;
      }

      const insertData = {
        role_id: roleId,
        permission_id: permissionId,
        granted: true
      };
      console.log('➕ Insert data:', insertData);
      console.log('➕ roleId type:', typeof roleId, 'value:', roleId);
      console.log('➕ permissionId type:', typeof permissionId, 'value:', permissionId);

      try {
        await supabase.from('role_permissions').insert(insertData);
        console.log('✅ Successfully inserted role permission');
      } catch (error) {
        console.error('❌ Failed to insert role permission:', error);
        throw error;
      }
    }

    console.log('✅ Role permissions updated successfully');
  },

  // Get user permissions
  async getUserPermissions(userId: string): Promise<Permission[]> {
    console.log('🔍 Getting user permissions for userId:', userId);

    // Get user's role
    const user = await supabase.from('users').getById(userId);
    console.log('🔍 User data:', { id: user?.id, role: user?.role, role_id: user?.role_id });

    if (!user) {
      console.log('❌ User not found');
      return [];
    }

    // Try role_id first, then fallback to role name lookup
    let roleId = user.role_id;

    if (!roleId && user.role) {
      console.log('🔍 No role_id found, looking up role by name:', user.role);
      // Look up role by name
      const roles = await roleOperations.getAll();
      const role = roles.find(r => r.name === user.role);
      if (role) {
        roleId = role.id;
        console.log('🔍 Found role by name:', role.name, 'ID:', roleId);
      }
    }

    if (!roleId) {
      console.log('❌ No role_id or role name found for user');
      return [];
    }

    // Get role permissions
    console.log('🔍 Getting permissions for role ID:', roleId);
    return await this.getRolePermissions(roleId);
  }
};
