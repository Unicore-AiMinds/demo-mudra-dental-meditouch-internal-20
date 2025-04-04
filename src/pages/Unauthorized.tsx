
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const Unauthorized = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md p-6">
        <h1 className="text-6xl font-display font-bold text-gray-800">403</h1>
        <h2 className="text-2xl font-display font-medium mt-4 mb-2">Access Denied</h2>
        <p className="text-gray-600 mb-6">
          You don't have permission to access this page. Please contact the administrator if you believe this is an error.
        </p>
        <Button onClick={() => navigate('/dashboard')}>
          Return to Dashboard
        </Button>
      </div>
    </div>
  );
};

export default Unauthorized;
