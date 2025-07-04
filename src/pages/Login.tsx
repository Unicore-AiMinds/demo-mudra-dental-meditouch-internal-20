
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { MudraClinicLogo, DentalMetrixLogo, MeditouchLogo } from '@/assets/logos';


const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(email, password);
      // Success toast is already handled in AuthContext
    } catch (error) {
      // Error toasts are already handled in AuthContext for specific cases:
      // - "Account Disabled" for inactive accounts
      // - "Account Locked" for locked accounts  
      // - "Invalid email or password" for wrong credentials
      // So we don't need to show a generic error here
      console.log('Login error caught in Login component:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 px-4 relative overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-dental-primary rounded-full mix-blend-multiply filter blur-3xl animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-64 h-64 bg-dental-primary rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>
      
      <div className="w-full max-w-lg relative z-10">
        {/* Logo section with glow effect */}
        <div className="flex flex-col items-center mb-8 animate-fade-in">
          <div className="relative group">
            <div className="absolute -inset-2 bg-gradient-to-r from-dental-primary/20 to-dental-dark/20 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative">
              <MudraClinicLogo />
            </div>
          </div>
          <p className="mt-4 text-base text-muted-foreground text-center leading-relaxed font-medium tracking-wide animate-fade-in" style={{ animationDelay: '0.2s' }}>
            Staff Portal for Dental Metrix Clinic & Meditouch Clinic
          </p>
        </div>

        {/* Enhanced card with glassmorphism */}
        <Card className="shadow-2xl border border-white/30 backdrop-blur-xl bg-white/90 relative overflow-hidden animate-fade-in" style={{ animationDelay: '0.4s' }}>
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/50 via-transparent to-dental-primary/5 pointer-events-none"></div>
          
          <CardHeader className="space-y-3 pb-8 relative z-10">
            <CardTitle className="text-3xl font-display text-center bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent font-semibold">
              Sign in
            </CardTitle>
            <CardDescription className="text-center text-base text-gray-600 font-medium">
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          
          <CardContent className="px-8 pb-8 relative z-10">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email field with floating label effect */}
              <div className="space-y-2 group">
                <Label 
                  htmlFor="email" 
                  className="text-sm font-semibold text-gray-700 transition-colors duration-200 group-focus-within:text-dental-primary"
                >
                  Email Address
                </Label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@mudraclinic.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-12 px-4 rounded-xl border-2 border-gray-200 bg-white/70 backdrop-blur-sm focus:border-dental-primary focus:ring-dental-primary/30 focus:ring-4 transition-all duration-300 hover:border-gray-300 focus:bg-white text-base font-medium placeholder:text-gray-400"
                  />
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-dental-primary/0 via-dental-primary/5 to-dental-primary/0 opacity-0 focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                </div>
              </div>

              {/* Password field with floating label effect */}
              <div className="space-y-2 group">
                <Label 
                  htmlFor="password" 
                  className="text-sm font-semibold text-gray-700 transition-colors duration-200 group-focus-within:text-dental-primary"
                >
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-12 px-4 rounded-xl border-2 border-gray-200 bg-white/70 backdrop-blur-sm focus:border-dental-primary focus:ring-dental-primary/30 focus:ring-4 transition-all duration-300 hover:border-gray-300 focus:bg-white text-base font-medium"
                  />
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-dental-primary/0 via-dental-primary/5 to-dental-primary/0 opacity-0 focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                </div>
              </div>

              {/* Enhanced button with micro-interactions */}
              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-dental-primary to-dental-dark hover:from-dental-dark hover:to-dental-primary rounded-xl font-semibold text-base transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-dental-primary/25 mt-8 transform hover:scale-[1.02] active:scale-[0.98] focus:ring-4 focus:ring-dental-primary/30 disabled:transform-none disabled:hover:scale-100"
                disabled={isLoading}
              >
                <span className="flex items-center justify-center space-x-2">
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <span>Sign In</span>
                  )}
                </span>
              </Button>
            </form>

            {/* Enhanced help section */}
            <div className="mt-6 p-4 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 border border-blue-200/50 rounded-xl text-center backdrop-blur-sm relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-100/20 to-transparent"></div>
              <p className="text-sm text-blue-800 relative z-10 font-medium">
                <span className="font-semibold">Forgot password?</span> Contact administrator for assistance.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced bottom logos with subtle animations */}
        <div className="mt-8 flex justify-center items-center space-x-8 animate-fade-in" style={{ animationDelay: '0.6s' }}>
          <div className="flex flex-col items-center group cursor-pointer">
            <div className="transform transition-transform duration-300 group-hover:scale-110 group-hover:rotate-1">
              <DentalMetrixLogo />
            </div>
          </div>
          <div className="w-px bg-gradient-to-b from-transparent via-gray-300 to-transparent h-12 opacity-60"></div>
          <div className="flex flex-col items-center group cursor-pointer">
            <div className="transform transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-1">
              <MeditouchLogo />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
