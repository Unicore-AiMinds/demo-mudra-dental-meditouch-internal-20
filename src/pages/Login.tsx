
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
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
      toast({
        title: "Login successful",
        description: "Welcome to Mudra Clinic",
      });
    } catch (error) {
      toast({
        title: "Login failed",
        description: "Invalid email or password",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="w-full max-w-md p-6 animate-fade-in">
        <div className="flex flex-col items-center mb-8">
          <MudraClinicLogo />
          <p className="mt-2 text-sm text-muted-foreground">Staff Portal for Dental Metrix Clinic & Meditouch Clinic</p>
        </div>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-display">Sign in</CardTitle>
            <CardDescription>Enter your credentials to access your account</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input 
                  id="email"
                  type="email" 
                  placeholder="name@mudraclinic.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="focus:border-dental-primary focus:ring-dental-primary"
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <a 
                    href="#" 
                    className="text-sm text-dental-primary hover:text-dental-dark transition-colors"
                  >
                    Forgot password?
                  </a>
                </div>
                <Input 
                  id="password"
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="focus:border-dental-primary focus:ring-dental-primary"
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-dental-primary hover:bg-dental-dark" 
                disabled={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 pt-0">
            <div className="text-center w-full text-sm text-muted-foreground">
              Demo Accounts (password: password)
            </div>
            <div className="grid grid-cols-2 gap-2 w-full">
              <Button variant="outline" onClick={() => setEmail('admin@mudraclinic.com')} className="text-xs">Admin</Button>
              <Button variant="outline" onClick={() => setEmail('doctor@mudraclinic.com')} className="text-xs">Doctor</Button>
              <Button variant="outline" onClick={() => setEmail('receptionist@mudraclinic.com')} className="text-xs">Receptionist</Button>
              <Button variant="outline" onClick={() => setEmail('inventory@mudraclinic.com')} className="text-xs">Inventory</Button>
            </div>
          </CardFooter>
        </Card>

        <div className="mt-8 flex justify-center space-x-4">
          <div className="flex flex-col items-center">
            <DentalMetrixLogo />
          </div>
          <div className="w-px bg-gray-200 h-14"></div>
          <div className="flex flex-col items-center">
            <MeditouchLogo />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
