import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { usePermissions } from '@/contexts/PermissionContext';
import { Plus, Edit, Trash2, Shield, Users, Settings } from 'lucide-react';
import { Role, roleOperations, rolePermissionOperations } from '@/lib/database/roles';
import { RoleDialog } from './RoleDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { initializeSystem } from '@/utils/initializeSystem';
import supabase from '@/lib/supabase';
import { useAuditLog } from '@/contexts/AuditLogContext';
import { AuditLogTemplates } from '@/utils/auditLogger';

export const RolesTab: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentRole, setCurrentRole] = useState<Role | null>(null);
  const [rolePermissionCounts, setRolePermissionCounts] = useState<Record<string, number>>({});
  const [isInitializing, setIsInitializing] = useState(false);
  const { toast } = useToast();
  const { hasPermission } = usePermissions();
  const { logAction } = useAuditLog();

  // Load roles
  const loadRoles = async () => {
    try {
      setIsLoading(true);
      const rolesData = await roleOperations.getAll();
      setRoles(rolesData);

      // Load permission counts for each role
      const counts: Record<string, number> = {};
      for (const role of rolesData) {
        const permissions = await rolePermissionOperations.getRolePermissions(role.id);
        counts[role.id] = permissions.length;
      }
      setRolePermissionCounts(counts);
    } catch (error) {
      console.error('Error loading roles:', error);
      toast({
        title: 'Error',
        description: 'Failed to load roles. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRoles();
  }, []);

  // Handle add role
  const handleAddRole = () => {
    setCurrentRole(null);
    setIsAddDialogOpen(true);
  };

  // Handle edit role
  const handleEditRole = (role: Role) => {
    setCurrentRole(role);
    setIsEditDialogOpen(true);
  };

  // Handle delete role
  const handleDeleteRole = (role: Role) => {
    setCurrentRole(role);
    setIsDeleteDialogOpen(true);
  };

  // Confirm delete role
  const confirmDeleteRole = async () => {
    if (!currentRole) return;

    try {
      // Get role permissions before deletion for audit logging
      const rolePermissions = await rolePermissionOperations.getRolePermissions(currentRole.id);
      const permissionNames = rolePermissions.map(p => p.display_name);

      // Get user count for this role (using the custom supabase wrapper)
      let userCount = 0;
      let usersWithRole = [];
      try {
        const users = await supabase.from('users').getAll({
          filters: { role_id: currentRole.id }
        });
        usersWithRole = users || [];
        userCount = usersWithRole.length;
      } catch (countError) {
        console.warn('Could not get user count for role deletion audit:', countError);
      }

      // Check if users are still assigned to this role
      if (userCount > 0) {
        toast({
          title: 'Cannot Delete Role',
          description: `This role cannot be deleted because ${userCount} user${userCount > 1 ? 's are' : ' is'} still assigned to it. Please reassign the user${userCount > 1 ? 's' : ''} to a different role first.`,
          variant: 'destructive',
        });
        setIsDeleteDialogOpen(false);
        setCurrentRole(null);
        return;
      }

      await roleOperations.delete(currentRole.id);

      // Log audit action
      try {
        const auditEntry = AuditLogTemplates.role.delete(
          currentRole.id,
          currentRole.display_name,
          permissionNames,
          userCount
        );
        await logAction({ ...auditEntry, clinic_type: 'dental' });
      } catch (auditError) {
        console.error('Failed to log role deletion audit:', auditError);
      }

      setIsDeleteDialogOpen(false);
      setCurrentRole(null);
      await loadRoles();
      
      toast({
        title: 'Role Deleted',
        description: `${currentRole.display_name} has been deleted successfully.`,
      });
    } catch (error) {
      console.error('Error deleting role:', error);
      
      // Check if this is a foreign key constraint error
      const errorMessage = error instanceof Error ? error.message : String(error);
      const isForeignKeyError = errorMessage.includes('23503') || errorMessage.includes('foreign key constraint') || errorMessage.includes('still referenced');
      
      toast({
        title: 'Error',
        description: isForeignKeyError 
          ? 'Cannot delete role because users are still assigned to it. Please reassign the users to a different role first.'
          : 'Failed to delete role. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Handle dialog success
  const handleDialogSuccess = async () => {
    setIsAddDialogOpen(false);
    setIsEditDialogOpen(false);
    setCurrentRole(null);
    await loadRoles();
  };

  // Debug function to check role permissions
  const debugRolePermissions = async (roleId: string) => {
    try {
      console.log('🔍 DEBUG: Checking role permissions for:', roleId);

      // Check role_permissions table directly
      const rolePermissions = await supabase.from('role_permissions').getAll({
        filters: { role_id: roleId }
      });
      console.log('🔍 DEBUG: Raw role_permissions records:', rolePermissions);

      // Check using our function
      const permissions = await rolePermissionOperations.getRolePermissions(roleId);
      console.log('🔍 DEBUG: Processed permissions:', permissions);

    } catch (error) {
      console.error('🔍 DEBUG: Error checking permissions:', error);
    }
  };

  // Handle system initialization
  const handleInitializeSystem = async () => {
    try {
      setIsInitializing(true);
      const success = await initializeSystem();

      if (success) {
        toast({
          title: 'System Initialized',
          description: 'Permissions and default roles have been set up successfully.',
        });
        await loadRoles();
      } else {
        toast({
          title: 'Initialization Failed',
          description: 'Failed to initialize the permission system. Check console for details.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error initializing system:', error);
      toast({
        title: 'Initialization Error',
        description: 'An error occurred during system initialization.',
        variant: 'destructive',
      });
    } finally {
      setIsInitializing(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-dental-primary mx-auto"></div>
            <p className="mt-2 text-sm text-muted-foreground">Loading roles...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <Shield className="mr-2 h-5 w-5" />
                Roles & Permissions
              </CardTitle>
              <CardDescription>
                Manage user roles and their permissions. Control what users can access and do in the system.
              </CardDescription>
            </div>
            <div className="flex space-x-2">
              {/* <Button
                onClick={handleInitializeSystem}
                disabled={isInitializing}
                variant="outline"
                className="border-green-600 text-green-600 hover:bg-green-50"
              >
                {isInitializing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600 mr-2"></div>
                    Initializing...
                  </>
                ) : (
                  <>
                    <Settings className="mr-2 h-4 w-4" />
                    Initialize System
                  </>
                )}
              </Button> */}
              {hasPermission('settings.manage_roles') && (
                <Button onClick={handleAddRole} className="bg-dental-primary hover:bg-dental-dark">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Role
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {roles.map((role) => (
              <div
                key={role.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    {role.is_system_role ? (
                      <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                        <Settings className="h-5 w-5 text-red-600" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Users className="h-5 w-5 text-blue-600" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-medium">{role.display_name}</h3>
                      {role.is_system_role && (
                        <Badge variant="destructive" className="text-xs">
                          System Role
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{role.description}</p>
                    <div className="flex items-center space-x-4 mt-1">
                      <span className="text-xs text-muted-foreground">
                        {rolePermissionCounts[role.id] || 0} permissions
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Role: {role.name}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {/* <Button
                    variant="outline"
                    size="sm"
                    onClick={() => debugRolePermissions(role.id)}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    🔍
                  </Button> */}
                  {hasPermission('settings.manage_roles') && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditRole(role)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                  {hasPermission('settings.manage_roles') && role.is_deletable && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteRole(role)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {roles.length === 0 && (
            <div className="text-center py-8">
              <Shield className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No roles found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating your first role.
              </p>
              <div className="mt-6">
                <Button onClick={handleAddRole} className="bg-dental-primary hover:bg-dental-dark">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Role
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Role Dialog */}
      <RoleDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSuccess={handleDialogSuccess}
        mode="add"
      />

      {/* Edit Role Dialog */}
      <RoleDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSuccess={handleDialogSuccess}
        mode="edit"
        role={currentRole}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Role</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this role? This action cannot be undone.
              {currentRole && (
                <div className="mt-4 p-3 bg-gray-50 rounded-md">
                  <p className="font-medium">{currentRole.display_name}</p>
                  <p className="text-sm text-gray-600">{currentRole.description}</p>
                  <p className="text-sm text-gray-600">
                    Permissions: {rolePermissionCounts[currentRole.id] || 0}
                  </p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteRole}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Role
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
