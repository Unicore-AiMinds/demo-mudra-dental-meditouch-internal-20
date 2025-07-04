
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { usePermissions } from '@/contexts/PermissionContext';
import { useClinic } from '@/contexts/ClinicContext';
import { getDefaultAccessibleRoute } from '@/utils/navigation';

const Unauthorized = () => {
  const navigate = useNavigate();
  const { userPermissions, hasAnyPermission, hasAllPermissions } = usePermissions();
  const { activeClinic } = useClinic();

  const handleReturnToMain = () => {
    // Always try to find an accessible route, never stay on unauthorized
    const defaultRoute = getDefaultAccessibleRoute(hasAnyPermission, hasAllPermissions, activeClinic);
    
    // If getDefaultAccessibleRoute returns unauthorized (which it shouldn't anymore), 
    // go to appointments as fallback
    if (defaultRoute === '/unauthorized') {
      console.log('⚠️ Unauthorized return button: Fallback to appointments');
      navigate('/appointments');
    } else {
      navigate(defaultRoute);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md p-6">
        <h1 className="text-6xl font-display font-bold text-gray-800">403</h1>
        <h2 className="text-2xl font-display font-medium mt-4 mb-2">Access Denied</h2>
        <p className="text-gray-600 mb-6">
          You don't have permission to access this page. Please contact the administrator if you believe this is an error.
        </p>
        <Button onClick={handleReturnToMain}>
          Return to Main Page
        </Button>
      </div>
    </div>
  );
};

export default Unauthorized;
