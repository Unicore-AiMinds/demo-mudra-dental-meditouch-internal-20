import React, { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Permission } from '@/lib/database/roles';
import { PERMISSION_MODULES, getPermissionsByModule } from '@/lib/permissions/definitions';
import { ChevronDown, ChevronRight, CheckSquare, Square } from 'lucide-react';

interface PermissionMatrixProps {
  permissions: Permission[];
  selectedPermissions: string[];
  onPermissionChange: (permissionIds: string[]) => void;
}

export const PermissionMatrix: React.FC<PermissionMatrixProps> = ({
  permissions,
  selectedPermissions,
  onPermissionChange
}) => {
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

  // Group permissions by module
  const permissionsByModule = permissions.reduce((acc, permission) => {
    if (!acc[permission.module]) {
      acc[permission.module] = [];
    }
    acc[permission.module].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

  // Toggle module expansion
  const toggleModule = (module: string) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(module)) {
      newExpanded.delete(module);
    } else {
      newExpanded.add(module);
    }
    setExpandedModules(newExpanded);
  };

  // Handle individual permission change
  const handlePermissionToggle = (permissionId: string) => {
    const newSelected = selectedPermissions.includes(permissionId)
      ? selectedPermissions.filter(id => id !== permissionId)
      : [...selectedPermissions, permissionId];
    
    onPermissionChange(newSelected);
  };

  // Handle module-level toggle (select/deselect all permissions in module)
  const handleModuleToggle = (module: string) => {
    const modulePermissions = permissionsByModule[module] || [];
    const modulePermissionIds = modulePermissions.map(p => p.id);
    
    const allSelected = modulePermissionIds.every(id => selectedPermissions.includes(id));
    
    let newSelected: string[];
    if (allSelected) {
      // Deselect all permissions in this module
      newSelected = selectedPermissions.filter(id => !modulePermissionIds.includes(id));
    } else {
      // Select all permissions in this module
      const toAdd = modulePermissionIds.filter(id => !selectedPermissions.includes(id));
      newSelected = [...selectedPermissions, ...toAdd];
    }
    
    onPermissionChange(newSelected);
  };

  // Handle select all / deselect all
  const handleSelectAll = () => {
    const allPermissionIds = permissions.map(p => p.id);
    const allSelected = allPermissionIds.length === selectedPermissions.length;
    
    onPermissionChange(allSelected ? [] : allPermissionIds);
  };

  // Get module selection state
  const getModuleState = (module: string) => {
    const modulePermissions = permissionsByModule[module] || [];
    const modulePermissionIds = modulePermissions.map(p => p.id);
    const selectedCount = modulePermissionIds.filter(id => selectedPermissions.includes(id)).length;
    
    if (selectedCount === 0) return 'none';
    if (selectedCount === modulePermissionIds.length) return 'all';
    return 'partial';
  };

  const totalPermissions = permissions.length;
  const selectedCount = selectedPermissions.length;

  return (
    <div className="space-y-4">
      {/* Summary and Controls */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-4">
          <div className="text-sm">
            <span className="font-medium">{selectedCount}</span> of{' '}
            <span className="font-medium">{totalPermissions}</span> permissions selected
          </div>
          <Badge variant={selectedCount === 0 ? 'secondary' : 'default'}>
            {selectedCount === 0 ? 'No Access' : selectedCount === totalPermissions ? 'Full Access' : 'Limited Access'}
          </Badge>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleSelectAll}
          className="text-xs"
        >
          {selectedCount === totalPermissions ? (
            <>
              <Square className="mr-1 h-3 w-3" />
              Deselect All
            </>
          ) : (
            <>
              <CheckSquare className="mr-1 h-3 w-3" />
              Select All
            </>
          )}
        </Button>
      </div>

      {/* Permission Modules */}
      <div className="space-y-2">
        {Object.entries(permissionsByModule).map(([module, modulePermissions]) => {
          const isExpanded = expandedModules.has(module);
          const moduleState = getModuleState(module);
          const moduleDisplayName = PERMISSION_MODULES[module] || module;

          return (
            <Card key={module} className="overflow-hidden">
              <CardHeader 
                className="py-3 cursor-pointer hover:bg-gray-50"
                onClick={() => toggleModule(module)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center">
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-gray-500" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-gray-500" />
                      )}
                    </div>
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        checked={moduleState === 'all'}
                        ref={(el) => {
                          if (el) {
                            el.indeterminate = moduleState === 'partial';
                          }
                        }}
                        onCheckedChange={() => handleModuleToggle(module)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <CardTitle className="text-base">{moduleDisplayName}</CardTitle>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-xs">
                      {modulePermissions.filter(p => selectedPermissions.includes(p.id)).length} / {modulePermissions.length}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              {isExpanded && (
                <CardContent className="pt-0">
                  <div className="grid gap-3">
                    {modulePermissions.map((permission) => (
                      <div
                        key={permission.id}
                        className="flex items-start space-x-3 p-3 rounded-md hover:bg-gray-50"
                      >
                        <Checkbox
                          checked={selectedPermissions.includes(permission.id)}
                          onCheckedChange={() => handlePermissionToggle(permission.id)}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <h4 className="text-sm font-medium">{permission.display_name}</h4>
                            <Badge variant="outline" className="text-xs">
                              {permission.action}
                            </Badge>
                          </div>
                          {permission.description && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {permission.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* Security Notice */}
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <div className="flex items-start space-x-2">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-medium text-amber-800">Security Notice</h3>
            <p className="text-sm text-amber-700 mt-1">
              Only grant the minimum permissions necessary for users to perform their job functions. 
              All permissions are unchecked by default for security.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
