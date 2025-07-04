import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Role, roleOperations, Permission, permissionOperations, rolePermissionOperations } from '@/lib/database/roles';
import { PermissionMatrix } from './PermissionMatrix';
import { triggerGlobalPermissionRefresh } from '@/contexts/PermissionContext';
import { useAuth } from '@/contexts/AuthContext';

interface RoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  mode: 'add' | 'edit';
  role?: Role | null;
}

export const RoleDialog: React.FC<RoleDialogProps> = ({
  open,
  onOpenChange,
  onSuccess,
  mode,
  role
}) => {
  const [formData, setFormData] = useState({
    name: '',
    display_name: '',
    description: ''
  });
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // Load permissions
  const loadPermissions = async () => {
    try {
      setIsLoadingPermissions(true);
      const permissions = await permissionOperations.getAll();
      setAllPermissions(permissions);

      // If editing, load role permissions
      if (mode === 'edit' && role) {
        console.log('📝 Loading permissions for role:', role.name, role.id);
        const rolePermissions = await rolePermissionOperations.getRolePermissions(role.id);
        console.log('📝 Loaded role permissions:', rolePermissions);
        const permissionIds = rolePermissions.map(p => p.id);
        console.log('📝 Setting selected permissions:', permissionIds);
        setSelectedPermissions(permissionIds);
      }
    } catch (error) {
      console.error('Error loading permissions:', error);
      toast({
        title: 'Error',
        description: 'Failed to load permissions.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingPermissions(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      display_name: '',
      description: ''
    });
    setSelectedPermissions([]);
  };

  // Load data when dialog opens
  useEffect(() => {
    if (open) {
      loadPermissions();
      
      if (mode === 'edit' && role) {
        setFormData({
          name: role.name,
          display_name: role.display_name,
          description: role.description || ''
        });
      } else {
        resetForm();
      }
    }
  }, [open, mode, role]);

  // Generate unique role name
  const generateUniqueRoleName = async (displayName: string): Promise<string> => {
    const baseName = displayName
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '') // Remove special characters
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .replace(/^_+|_+$/g, '') // Remove leading/trailing underscores
      .replace(/_+/g, '_') // Replace multiple underscores with single
      .trim();

    // Ensure we have a valid base name
    if (!baseName) {
      return 'role_' + Date.now(); // Fallback if no valid characters
    }

    // Check if base name exists
    const existingRoles = await roleOperations.getAll();
    const existingNames = existingRoles.map(r => r.name);

    console.log('🔍 Checking name uniqueness for:', baseName);
    console.log('🔍 Existing role names:', existingNames);

    if (!existingNames.includes(baseName)) {
      console.log('✅ Base name is unique:', baseName);
      return baseName;
    }

    // If exists, try with numbers
    let counter = 1;
    let uniqueName = `${baseName}_${counter}`;

    while (existingNames.includes(uniqueName)) {
      counter++;
      uniqueName = `${baseName}_${counter}`;
    }

    console.log('✅ Generated unique name:', uniqueName);
    return uniqueName;
  };

  // Handle input change
  const handleInputChange = async (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Auto-generate name from display_name for new roles
    if (field === 'display_name' && mode === 'add' && value.trim()) {
      try {
        const uniqueName = await generateUniqueRoleName(value);
        setFormData(prev => ({
          ...prev,
          name: uniqueName
        }));
      } catch (error) {
        console.error('Error generating unique role name:', error);
        // Fallback to simple generation with proper cleanup
        const fallbackName = value
          .toLowerCase()
          .replace(/[^a-z0-9\s]/g, '') // Remove special characters
          .replace(/\s+/g, '_') // Replace spaces with underscores
          .replace(/^_+|_+$/g, '') // Remove leading/trailing underscores
          .replace(/_+/g, '_') // Replace multiple underscores with single
          .trim() || 'role_' + Date.now(); // Fallback if empty
        setFormData(prev => ({
          ...prev,
          name: fallbackName
        }));
      }
    }
  };

  // Handle permission change
  const handlePermissionChange = (permissionIds: string[]) => {
    setSelectedPermissions(permissionIds);
  };

  // Validate form
  const validateForm = async (): Promise<boolean> => {
    if (!formData.name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Role name is required.',
        variant: 'destructive',
      });
      return false;
    }

    if (!formData.display_name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Display name is required.',
        variant: 'destructive',
      });
      return false;
    }

    // Check name format
    if (!/^[a-z0-9_]+$/.test(formData.name)) {
      toast({
        title: 'Validation Error',
        description: 'Role name can only contain lowercase letters, numbers, and underscores.',
        variant: 'destructive',
      });
      return false;
    }

    // Check for duplicate names (only for new roles or when name changed)
    if (mode === 'add' || (mode === 'edit' && role && formData.name !== role.name)) {
      try {
        const existingRoles = await roleOperations.getAll();
        const nameExists = existingRoles.some(r => r.name === formData.name && r.id !== role?.id);

        if (nameExists) {
          toast({
            title: 'Validation Error',
            description: 'A role with this name already exists. Please choose a different name.',
            variant: 'destructive',
          });
          return false;
        }
      } catch (error) {
        console.error('Error checking for duplicate role names:', error);
        toast({
          title: 'Validation Error',
          description: 'Unable to validate role name. Please try again.',
          variant: 'destructive',
        });
        return false;
      }
    }

    return true;
  };

  // Handle submit
  const handleSubmit = async () => {
    if (!(await validateForm())) return;

    try {
      setIsLoading(true);

      let savedRole: Role;

      if (mode === 'add') {
        // Create new role
        console.log('🆕 Creating new role with data:', {
          name: formData.name.trim(),
          display_name: formData.display_name.trim(),
          description: formData.description.trim() || undefined,
          is_system_role: false,
          is_deletable: true
        });

        savedRole = await roleOperations.create({
          name: formData.name.trim(),
          display_name: formData.display_name.trim(),
          description: formData.description.trim() || undefined,
          is_system_role: false,
          is_deletable: true
        });

        console.log('🆕 Created role response:', savedRole);

        toast({
          title: 'Role Created',
          description: `${formData.display_name} has been created successfully.`,
        });
      } else {
        // Update existing role
        if (!role) return;

        savedRole = await roleOperations.update(role.id, {
          display_name: formData.display_name.trim(),
          description: formData.description.trim() || undefined
        });

        // Ensure we have the role ID for permission updates
        savedRole.id = role.id;

        toast({
          title: 'Role Updated',
          description: `${formData.display_name} has been updated successfully.`,
        });
      }

      // Update role permissions
      console.log('🎯 Updating permissions for role:', savedRole.id);
      console.log('🎯 Role object:', savedRole);
      console.log('🎯 Selected permissions:', selectedPermissions);

      if (!savedRole.id) {
        throw new Error('Role ID is missing after save operation');
      }

      await rolePermissionOperations.updateRolePermissions(savedRole.id, selectedPermissions);

      // Trigger global permission refresh for all users
      console.log('🔄 Triggering permission refresh after role update');
      console.log('🔄 Current user role:', user?.role, 'Updated role:', savedRole.name);
      triggerGlobalPermissionRefresh();

      // Show additional message if current user's role was updated
      if (user?.role === savedRole.name) {
        toast({
          title: 'Permissions Updated',
          description: 'Your permissions have been updated. Changes will take effect immediately.',
        });
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving role:', error);
      toast({
        title: 'Error',
        description: `Failed to ${mode === 'add' ? 'create' : 'update'} role. Please try again.`,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'add' ? 'Add New Role' : 'Edit Role'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'add' 
              ? 'Create a new role and assign permissions. All permissions are unchecked by default for security.'
              : 'Update role details and modify permissions.'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="display_name">Display Name*</Label>
              <Input
                id="display_name"
                value={formData.display_name}
                onChange={(e) => handleInputChange('display_name', e.target.value)}
                placeholder="e.g., Clinic Manager"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Role Name*</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="e.g., clinic_manager"
                disabled={mode === 'edit'} // Don't allow changing name for existing roles
              />
              <p className="text-xs text-muted-foreground">
                Lowercase letters, numbers, and underscores only
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe what this role is for..."
              rows={3}
            />
          </div>

          {/* Permissions */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium">Permissions</h3>
              <p className="text-sm text-muted-foreground">
                Select the permissions this role should have. Users with this role will only be able to access the selected features.
              </p>
            </div>

            {isLoadingPermissions ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-dental-primary"></div>
              </div>
            ) : (
              <PermissionMatrix
                permissions={allPermissions}
                selectedPermissions={selectedPermissions}
                onPermissionChange={handlePermissionChange}
              />
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || isLoadingPermissions}
            className="bg-dental-primary hover:bg-dental-dark"
          >
            {isLoading ? 'Saving...' : mode === 'add' ? 'Create Role' : 'Update Role'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
