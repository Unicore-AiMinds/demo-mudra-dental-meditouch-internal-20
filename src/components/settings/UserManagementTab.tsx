import React, { useState, useEffect } from 'react';
import { useUserManagement, User } from '@/contexts/UserManagementContext';
import { useToast } from '@/hooks/use-toast';
import { Role, roleOperations } from '@/lib/database/roles';
import { triggerGlobalPermissionRefresh } from '@/contexts/PermissionContext';
import { usePermissions } from '@/contexts/PermissionContext';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Edit, 
  Trash2, 
  AlertCircle, 
  Users, 
  Shield, 
  ShieldCheck, 
  ShieldX,
  Unlock,
  Key
} from 'lucide-react';
import { capitalizeWords } from '@/utils/string-utils';

const UserManagementTab: React.FC = () => {
  const {
    users,
    isLoading,
    addUser,
    updateUser,
    deleteUser,
    toggleUserStatus,
    resetUserPassword,
    unlockUser
  } = useUserManagement();
  const { hasPermission } = usePermissions();
  const { toast } = useToast();

  // State for dialogs
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isPasswordResetDialogOpen, setIsPasswordResetDialogOpen] = useState(false);
  const [isToggleStatusDialogOpen, setIsToggleStatusDialogOpen] = useState(false);
  const [isPasswordResetConfirmOpen, setIsPasswordResetConfirmOpen] = useState(false);
  const [isUpdateConfirmOpen, setIsUpdateConfirmOpen] = useState(false);
  const [isAddConfirmOpen, setIsAddConfirmOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // State for dynamic roles
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [isLoadingRoles, setIsLoadingRoles] = useState(true);

  // State for form fields
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '', // Will be set to first available role
    phone: '',
    password: '',
    is_active: true
  });

  // State for phone country codes
  const [phoneCountryCode, setPhoneCountryCode] = useState('+91');
  const [editPhoneCountryCode, setEditPhoneCountryCode] = useState('+91');

  // State for password reset
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Load available roles
  const loadRoles = async () => {
    try {
      setIsLoadingRoles(true);
      const roles = await roleOperations.getAll();
      setAvailableRoles(roles);

      // Set default role to first available role if form is empty
      if (!formData.role && roles.length > 0) {
        setFormData(prev => ({ ...prev, role: roles[0].name }));
      }
    } catch (error) {
      console.error('Error loading roles:', error);
      toast({
        title: 'Error',
        description: 'Failed to load roles. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingRoles(false);
    }
  };

  // Load roles on component mount
  useEffect(() => {
    loadRoles();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      role: availableRoles.length > 0 ? availableRoles[0].name : '',
      phone: '',
      password: '',
      is_active: true
    });
    setPhoneCountryCode('+91');
    setEditPhoneCountryCode('+91');
    setNewPassword('');
    setConfirmPassword('');
  };

  // Handle form input changes
  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Validate email
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Check if email is valid for styling
  const isEmailValid = (email: string): boolean => {
    return email === '' || validateEmail(email);
  };

  // Validate password
  const validatePassword = (password: string): boolean => {
    return password.length >= 6;
  };

  // Handle add dialog open
  const handleAddDialogOpen = () => {
    loadRoles(); // Refresh roles in case new ones were added
    setIsAddDialogOpen(true);
  };

  // Handle add user - validate and show confirmation
  const handleAddUser = () => {
    // Validation
    if (!formData.name.trim() || !formData.email.trim() || !formData.password.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Name, email, and password are required fields.',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.role || formData.role === 'loading' || formData.role === 'no-roles') {
      toast({
        title: 'Validation Error',
        description: 'Please select a valid role.',
        variant: 'destructive',
      });
      return;
    }

    if (!validateEmail(formData.email)) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a valid email address.',
        variant: 'destructive',
      });
      return;
    }

    if (!validatePassword(formData.password)) {
      toast({
        title: 'Validation Error',
        description: 'Password must be at least 6 characters long.',
        variant: 'destructive',
      });
      return;
    }

    // Check if email already exists
    const existingUser = users.find(u => u.email.toLowerCase() === formData.email.toLowerCase());
    if (existingUser) {
      toast({
        title: 'Validation Error',
        description: 'A user with this email already exists.',
        variant: 'destructive',
      });
      return;
    }

    // Show confirmation dialog
    setIsAddConfirmOpen(true);
  };

  // Confirm add user
  const confirmAddUser = async () => {
    try {
      // Format phone number with country code
      const formattedPhone = formData.phone.trim()
        ? `${phoneCountryCode} ${formData.phone.trim()}`
        : undefined;

      await addUser({
        name: capitalizeWords(formData.name.trim()),
        email: formData.email.toLowerCase().trim(),
        role: formData.role,
        phone: formattedPhone,
        password: formData.password,
        is_active: formData.is_active
      });

      // Trigger global permission refresh for the new user
      triggerGlobalPermissionRefresh();

      setIsAddDialogOpen(false);
      setIsAddConfirmOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error adding user:', error);
    }
  };

  // Handle edit user
  const handleEditUser = (user: User) => {
    setCurrentUser(user);

    // Extract country code from phone number if it exists
    let phoneNumber = '';
    if (user.phone && user.phone.startsWith('+')) {
      const parts = user.phone.split(' ');
      const countryCode = parts[0];
      if (['+91', '+1', '+44', '+61', '+971', '+65'].includes(countryCode)) {
        setEditPhoneCountryCode(countryCode);
        phoneNumber = parts.slice(1).join(' '); // Get the number without country code
      } else {
        phoneNumber = user.phone;
      } 
    } else {
      phoneNumber = user.phone || '';
    }

    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      phone: phoneNumber,
      password: '', // Don't pre-fill password
      is_active: user.is_active
    });
    setIsEditDialogOpen(true);
  };

  // Handle update user - validate and show confirmation
  const handleUpdateUser = () => {
    if (!currentUser) return;

    // Validation
    if (!formData.name.trim() || !formData.email.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Name and email are required fields.',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.role || formData.role === 'loading' || formData.role === 'no-roles') {
      toast({
        title: 'Validation Error',
        description: 'Please select a valid role.',
        variant: 'destructive',
      });
      return;
    }

    if (!validateEmail(formData.email)) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a valid email address.',
        variant: 'destructive',
      });
      return;
    }

    // Check if email already exists (excluding current user)
    const existingUser = users.find(u =>
      u.email.toLowerCase() === formData.email.toLowerCase() && u.id !== currentUser.id
    );
    if (existingUser) {
      toast({
        title: 'Validation Error',
        description: 'A user with this email already exists.',
        variant: 'destructive',
      });
      return;
    }

    // Validate password if provided
    if (formData.password && !validatePassword(formData.password)) {
      toast({
        title: 'Validation Error',
        description: 'Password must be at least 6 characters long.',
        variant: 'destructive',
      });
      return;
    }

    // Show confirmation dialog
    setIsUpdateConfirmOpen(true);
  };

  // Confirm update user
  const confirmUpdateUser = async () => {
    if (!currentUser) return;

    try {
      // Format phone number with country code
      const formattedPhone = formData.phone.trim()
        ? `${editPhoneCountryCode} ${formData.phone.trim()}`
        : null;

      const updateData: any = {
        name: capitalizeWords(formData.name.trim()),
        email: formData.email.toLowerCase().trim(),
        role: formData.role,
        phone: formattedPhone,
        is_active: formData.is_active
      };

      // Only include password if it's provided
      if (formData.password.trim()) {
        updateData.password = formData.password;
      }

      await updateUser(currentUser.id, updateData);

      // If role was changed, trigger global permission refresh
      if (currentUser.role !== formData.role) {
        triggerGlobalPermissionRefresh();
      }

      setIsEditDialogOpen(false);
      setIsUpdateConfirmOpen(false);
      setCurrentUser(null);
      resetForm();
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  // Handle delete user
  const handleDeleteUser = (user: User) => {
    setCurrentUser(user);
    setIsDeleteDialogOpen(true);
  };

  // Confirm delete user
  const confirmDeleteUser = async () => {
    if (!currentUser) return;

    try {
      await deleteUser(currentUser.id);
      setIsDeleteDialogOpen(false);
      setCurrentUser(null);
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  // Handle toggle user status - show confirmation dialog
  const handleToggleStatus = (user: User) => {
    setCurrentUser(user);
    setIsToggleStatusDialogOpen(true);
  };

  // Confirm toggle user status
  const confirmToggleStatus = async () => {
    if (!currentUser) return;

    try {
      await toggleUserStatus(currentUser.id, !currentUser.is_active);
      setIsToggleStatusDialogOpen(false);
      setCurrentUser(null);
    } catch (error) {
      console.error('Error toggling user status:', error);
    }
  };

  // Handle password reset dialog
  const handlePasswordResetDialog = (user: User) => {
    setCurrentUser(user);
    setNewPassword('');
    setConfirmPassword('');
    setIsPasswordResetDialogOpen(true);
  };

  // Handle password reset - validate and show confirmation
  const handlePasswordReset = () => {
    if (!currentUser) return;

    if (!newPassword || !confirmPassword) {
      toast({
        title: 'Validation Error',
        description: 'Please enter and confirm the new password.',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: 'Validation Error',
        description: 'Passwords do not match.',
        variant: 'destructive',
      });
      return;
    }

    if (!validatePassword(newPassword)) {
      toast({
        title: 'Validation Error',
        description: 'Password must be at least 6 characters long.',
        variant: 'destructive',
      });
      return;
    }

    // Show confirmation dialog
    setIsPasswordResetConfirmOpen(true);
  };

  // Confirm password reset
  const confirmPasswordReset = async () => {
    if (!currentUser) return;

    try {
      await resetUserPassword(currentUser.id, newPassword);
      setIsPasswordResetDialogOpen(false);
      setIsPasswordResetConfirmOpen(false);
      setCurrentUser(null);
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Error resetting password:', error);
    }
  };

  // Handle unlock user
  const handleUnlockUser = async (user: User) => {
    try {
      await unlockUser(user.id);
    } catch (error) {
      console.error('Error unlocking user:', error);
    }
  };

  // Get role badge color
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'doctor':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'receptionist':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'inventory_manager':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Get status badge
  const getStatusBadge = (user: User) => {
    if (!user.is_active) {
      return <Badge variant="destructive">Inactive</Badge>;
    }
    
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      return <Badge variant="destructive">Locked</Badge>;
    }
    
    return <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>;
  };

  // Check if user is locked
  const isUserLocked = (user: User): boolean => {
    return user.locked_until ? new Date(user.locked_until) > new Date() : false;
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <Users className="mr-2 h-5 w-5" />
              User Management
            </CardTitle>
            <CardDescription>
              Manage system users and their access permissions
            </CardDescription>
          </div>
          {hasPermission('settings.manage_users') && (
            <Button onClick={handleAddDialogOpen}>
              <Plus className="mr-2 h-4 w-4" /> Add User
            </Button>
          )}
        </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <p>Loading users...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <AlertCircle className="h-10 w-10 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No Users Found</h3>
            <p className="text-muted-foreground mt-2">
              Add users to manage system access.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={getRoleBadgeColor(user.role)}
                      >
                        {availableRoles.find(r => r.name === user.role)?.display_name || user.role.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>{user.phone || '-'}</TableCell>
                    <TableCell>{getStatusBadge(user)}</TableCell>
                    <TableCell>
                      {user.last_login 
                        ? new Date(user.last_login).toLocaleDateString()
                        : 'Never'
                      }
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {hasPermission('settings.manage_users') && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditUser(user)}
                            title="Edit User"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}

                        {hasPermission('settings.manage_users') && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleToggleStatus(user)}
                            title={user.is_active ? 'Deactivate User' : 'Activate User'}
                          >
                            {user.is_active ? (
                              <ShieldX className="h-4 w-4 text-orange-600" />
                            ) : (
                              <ShieldCheck className="h-4 w-4 text-green-600" />
                            )}
                          </Button>
                        )}

                        {hasPermission('settings.manage_users') && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handlePasswordResetDialog(user)}
                            title="Reset Password"
                          >
                            <Key className="h-4 w-4 text-blue-600" />
                          </Button>
                        )}

                        {isUserLocked(user) && (
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleUnlockUser(user)}
                            title="Unlock Account"
                          >
                            <Unlock className="h-4 w-4 text-purple-600" />
                          </Button>
                        )}
                        
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleDeleteUser(user)}
                          title="Delete User"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>

    {/* Add User Dialog */}
    <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add New User</DialogTitle>
          <DialogDescription>
            Create a new user account with appropriate permissions.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name*
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="col-span-3"
              placeholder="Full Name"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">
              Email*
            </Label>
            <div className="col-span-3 space-y-1">
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={`${!isEmailValid(formData.email) ? 'border-red-500 focus:border-red-500' : ''}`}
                placeholder="email@example.com"
              />
              {!isEmailValid(formData.email) && (
                <p className="text-xs text-red-500">Please enter a valid email address</p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="role" className="text-right">
              Role*
            </Label>
            <Select
              value={formData.role}
              onValueChange={(value) => handleInputChange('role', value)}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {isLoadingRoles ? (
                  <SelectItem value="loading" disabled>Loading roles...</SelectItem>
                ) : availableRoles.length === 0 ? (
                  <SelectItem value="no-roles" disabled>No roles available</SelectItem>
                ) : (
                  availableRoles.map((role) => (
                    <SelectItem key={role.id} value={role.name}>
                      {role.display_name}
                      {role.is_system_role && ' (System)'}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="phone" className="text-right">
              Contact
            </Label>
            <div className="col-span-3 flex gap-2">
              <Select
                value={phoneCountryCode}
                onValueChange={setPhoneCountryCode}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="+91" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="+91">+91 (IN)</SelectItem>
                  <SelectItem value="+1">+1 (US)</SelectItem>
                  <SelectItem value="+44">+44 (UK)</SelectItem>
                  <SelectItem value="+61">+61 (AU)</SelectItem>
                  <SelectItem value="+971">+971 (UAE)</SelectItem>
                  <SelectItem value="+65">+65 (SG)</SelectItem>
                </SelectContent>
              </Select>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className="flex-1"
                placeholder="Contact Number"
                pattern="\d+"
                title="Please enter only digits"
              />
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="password" className="text-right">
              Password*
            </Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              className="col-span-3"
              placeholder="Minimum 6 characters"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleAddUser} className="bg-dental-primary hover:bg-dental-dark">
            Add User
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Edit User Dialog */}
    <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>
            Update user information and permissions.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="edit-name" className="text-right">
              Name*
            </Label>
            <Input
              id="edit-name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="edit-email" className="text-right">
              Email*
            </Label>
            <div className="col-span-3 space-y-1">
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={`${!isEmailValid(formData.email) ? 'border-red-500 focus:border-red-500' : ''}`}
              />
              {!isEmailValid(formData.email) && (
                <p className="text-xs text-red-500">Please enter a valid email address</p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="edit-role" className="text-right">
              Role*
            </Label>
            <Select
              value={formData.role}
              onValueChange={(value) => handleInputChange('role', value)}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {isLoadingRoles ? (
                  <SelectItem value="loading" disabled>Loading roles...</SelectItem>
                ) : availableRoles.length === 0 ? (
                  <SelectItem value="no-roles" disabled>No roles available</SelectItem>
                ) : (
                  availableRoles.map((role) => (
                    <SelectItem key={role.id} value={role.name}>
                      {role.display_name}
                      {role.is_system_role && ' (System)'}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="edit-phone" className="text-right">
              Contact
            </Label>
            <div className="col-span-3 flex gap-2">
              <Select
                value={editPhoneCountryCode}
                onValueChange={setEditPhoneCountryCode}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="+91" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="+91">+91 (IN)</SelectItem>
                  <SelectItem value="+1">+1 (US)</SelectItem>
                  <SelectItem value="+44">+44 (UK)</SelectItem>
                  <SelectItem value="+61">+61 (AU)</SelectItem>
                  <SelectItem value="+971">+971 (UAE)</SelectItem>
                  <SelectItem value="+65">+65 (SG)</SelectItem>
                </SelectContent>
              </Select>
              <Input
                id="edit-phone"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className="flex-1"
                pattern="\d+"
                title="Please enter only digits"
              />
            </div>
          </div>
          {/* <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="edit-password" className="text-right">
              New Password
            </Label>
            <Input
              id="edit-password"
              type="password"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              className="col-span-3"
              placeholder="Leave blank to keep current"
            />
          </div> */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="edit-status" className="text-right">
              Status
            </Label>
            <Select
              value={formData.is_active ? 'active' : 'inactive'}
              onValueChange={(value) => handleInputChange('is_active', value === 'active')}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleUpdateUser} className="bg-dental-primary hover:bg-dental-dark">
            Update User
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Delete User Dialog */}
    <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete User</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this user? This action cannot be undone.
            {currentUser && (
              <div className="mt-4 p-3 bg-gray-50 rounded-md">
                <p className="font-medium">{currentUser.name}</p>
                <p className="text-sm text-gray-600">{currentUser.email}</p>
                <p className="text-sm text-gray-600">Role: {currentUser.role}</p>
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={confirmDeleteUser}
            className="bg-red-600 hover:bg-red-700"
          >
            Delete User
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    {/* Password Reset Dialog */}
    <Dialog open={isPasswordResetDialogOpen} onOpenChange={setIsPasswordResetDialogOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Reset Password</DialogTitle>
          <DialogDescription>
            Set a new password for this user account.
            {currentUser && (
              <div className="mt-2 text-sm">
                User: <span className="font-medium">{currentUser.name}</span>
              </div>
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="new-password" className="text-right">
              New Password*
            </Label>
            <Input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="col-span-3"
              placeholder="Minimum 6 characters"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="confirm-password" className="text-right">
              Confirm Password*
            </Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="col-span-3"
              placeholder="Confirm new password"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsPasswordResetDialogOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handlePasswordReset} className="bg-dental-primary hover:bg-dental-dark">
            Reset Password
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Toggle User Status Confirmation Dialog */}
    <AlertDialog open={isToggleStatusDialogOpen} onOpenChange={setIsToggleStatusDialogOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {currentUser?.is_active ? 'Deactivate User' : 'Activate User'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {currentUser?.is_active
              ? 'Are you sure you want to deactivate this user? They will no longer be able to log in to the system.'
              : 'Are you sure you want to activate this user? They will be able to log in to the system.'
            }
            {currentUser && (
              <div className="mt-4 p-3 bg-gray-50 rounded-md">
                <p className="font-medium">{currentUser.name}</p>
                <p className="text-sm text-gray-600">{currentUser.email}</p>
                <p className="text-sm text-gray-600">Role: {currentUser.role}</p>
                <p className="text-sm text-gray-600">
                  Current Status: {currentUser.is_active ? 'Active' : 'Inactive'}
                </p>
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={confirmToggleStatus}
            className={currentUser?.is_active ? 'bg-orange-600 hover:bg-orange-700' : 'bg-green-600 hover:bg-green-700'}
          >
            {currentUser?.is_active ? 'Deactivate User' : 'Activate User'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    {/* Password Reset Confirmation Dialog */}
    <AlertDialog open={isPasswordResetConfirmOpen} onOpenChange={setIsPasswordResetConfirmOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm Password Reset</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to reset the password for this user? This action cannot be undone.
            {currentUser && (
              <div className="mt-4 p-3 bg-gray-50 rounded-md">
                <p className="font-medium">{currentUser.name}</p>
                <p className="text-sm text-gray-600">{currentUser.email}</p>
                <p className="text-sm text-gray-600">Role: {currentUser.role}</p>
                <div className="mt-2 text-sm">
                  <p className="font-medium text-gray-700">New Password:</p>
                  <p className="text-gray-600 font-mono bg-gray-100 px-2 py-1 rounded">
                    {'•'.repeat(newPassword.length)} ({newPassword.length} characters)
                  </p>
                </div>
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={confirmPasswordReset}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Reset Password
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    {/* Update User Confirmation Dialog */}
    <AlertDialog open={isUpdateConfirmOpen} onOpenChange={setIsUpdateConfirmOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm User Update</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to save these changes to the user account?
            {currentUser && (
              <div className="mt-4 p-3 bg-gray-50 rounded-md">
                <p className="font-medium">{currentUser.name}</p>
                <p className="text-sm text-gray-600">{currentUser.email}</p>
                <div className="mt-2 space-y-1 text-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="font-medium">Name:</span> {formData.name}
                    </div>
                    <div>
                      <span className="font-medium">Email:</span> {formData.email}
                    </div>
                    <div>
                      <span className="font-medium">Role:</span> {availableRoles.find(r => r.name === formData.role)?.display_name || formData.role}
                    </div>
                    <div>
                      <span className="font-medium">Status:</span> {formData.is_active ? 'Active' : 'Inactive'}
                    </div>
                    {formData.phone && (
                      <div className="col-span-2">
                        <span className="font-medium">Contact:</span> {editPhoneCountryCode} {formData.phone}
                      </div>
                    )}
                    {formData.password && (
                      <div className="col-span-2">
                        <span className="font-medium">Password:</span> Will be updated
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={confirmUpdateUser}
            className="bg-dental-primary hover:bg-dental-dark"
          >
            Update User
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    {/* Add User Confirmation Dialog */}
    <AlertDialog open={isAddConfirmOpen} onOpenChange={setIsAddConfirmOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm Add New User</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to create this new user account?
            <div className="mt-4 p-3 bg-gray-50 rounded-md">
              <div className="space-y-1 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="font-medium">Name:</span> {formData.name}
                  </div>
                  <div>
                    <span className="font-medium">Email:</span> {formData.email}
                  </div>
                  <div>
                    <span className="font-medium">Role:</span> {availableRoles.find(r => r.name === formData.role)?.display_name || formData.role}
                  </div>
                  <div>
                    <span className="font-medium">Status:</span> {formData.is_active ? 'Active' : 'Inactive'}
                  </div>
                  {formData.phone && (
                    <div className="col-span-2">
                      <span className="font-medium">Contact:</span> {phoneCountryCode} {formData.phone}
                    </div>
                  )}
                  <div className="col-span-2">
                    <span className="font-medium">Password:</span> Set ({formData.password.length} characters)
                  </div>
                </div>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={confirmAddUser}
            className="bg-green-600 hover:bg-green-700"
          >
            Create User
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
};

export default UserManagementTab;
