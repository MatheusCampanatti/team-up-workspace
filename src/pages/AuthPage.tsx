
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const AuthPage = () => {
  const { user, signIn, signUp, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form states for Sign In
  const [signInData, setSignInData] = useState({
    email: '',
    password: ''
  });

  // Form states for Sign Up
  const [signUpData, setSignUpData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (user && !loading) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string) => {
    return password.length >= 6;
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!validateEmail(signInData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (!signInData.password) {
      setError('Password is required');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await signIn(signInData.email, signInData.password);
      if (error) {
        setError(error.message);
      } else {
        toast({
          title: "Welcome back!",
          description: "You have successfully signed in.",
        });
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!signUpData.name.trim()) {
      setError('Name is required');
      return;
    }

    if (!validateEmail(signUpData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (!validatePassword(signUpData.password)) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (signUpData.password !== signUpData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await signUp(signUpData.email, signUpData.password, signUpData.name);
      if (error) {
        setError(error.message);
      } else {
        toast({
          title: "Account created successfully!",
          description: "You can now sign in with your credentials.",
        });
        // Reset form and switch to sign in tab
        setSignUpData({ name: '', email: '', password: '', confirmPassword: '' });
        // Auto-switch to sign in tab
        const signInTab = document.querySelector('[value="signin"]') as HTMLElement;
        signInTab?.click();
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">Welcome</h2>
          <p className="mt-2 text-gray-600">Sign in to your account or create a new one</p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <CardHeader>
                <CardTitle>Sign In</CardTitle>
                <CardDescription>Enter your credentials to access your account</CardDescription>
              </CardHeader>
              <form onSubmit={handleSignIn}>
                <CardContent className="space-y-4">
                  <div>
                    <Input
                      type="email"
                      placeholder="Email"
                      value={signInData.email}
                      onChange={(e) => setSignInData(prev => ({ ...prev, email: e.target.value }))}
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Password"
                      value={signInData.password}
                      onChange={(e) => setSignInData(prev => ({ ...prev, password: e.target.value }))}
                      disabled={isSubmitting}
                      required
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 flex items-center pr-3"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing In...
                      </>
                    ) : (
                      'Sign In'
                    )}
                  </Button>
                </CardFooter>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <CardHeader>
                <CardTitle>Create Account</CardTitle>
                <CardDescription>Fill in your details to create a new account</CardDescription>
              </CardHeader>
              <form onSubmit={handleSignUp}>
                <CardContent className="space-y-4">
                  <div>
                    <Input
                      type="text"
                      placeholder="Full Name"
                      value={signUpData.name}
                      onChange={(e) => setSignUpData(prev => ({ ...prev, name: e.target.value }))}
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                  <div>
                    <Input
                      type="email"
                      placeholder="Email"
                      value={signUpData.email}
                      onChange={(e) => setSignUpData(prev => ({ ...prev, email: e.target.value }))}
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Password"
                      value={signUpData.password}
                      onChange={(e) => setSignUpData(prev => ({ ...prev, password: e.target.value }))}
                      disabled={isSubmitting}
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 flex items-center pr-3"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                  <div className="relative">
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm Password"
                      value={signUpData.confirmPassword}
                      onChange={(e) => setSignUpData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      disabled={isSubmitting}
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 flex items-center pr-3"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                  <p className="text-sm text-gray-500">
                    Password must be at least 6 characters long
                  </p>
                </CardContent>
                <CardFooter>
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Account...
                      </>
                    ) : (
                      'Create Account'
                    )}
                  </Button>
                </CardFooter>
              </form>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default AuthPage;
