import { initializePermissionSystem } from '@/lib/database/seedPermissions';

// Initialize the entire system
export const initializeSystem = async () => {
  try {
    console.log('🚀 Starting system initialization...');
    
    // Initialize permission system (roles, permissions, default data)
    await initializePermissionSystem();
    
    console.log('✅ System initialization completed successfully!');
    return true;
  } catch (error) {
    console.error('❌ System initialization failed:', error);
    return false;
  }
};

// Check if system needs initialization
export const checkSystemInitialization = async () => {
  try {
    // You can add checks here to see if the system is already initialized
    // For now, we'll just return false to allow manual initialization
    return false;
  } catch (error) {
    console.error('Error checking system initialization:', error);
    return false;
  }
};
