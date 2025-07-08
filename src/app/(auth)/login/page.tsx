'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2, AlertTriangle } from 'lucide-react';
import { useAdminAuth } from '@/components/auth/AdminAuthProvider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const auth = useAdminAuth();

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  });

  // Redirect if already authenticated
  React.useEffect(() => {
    if (auth.isAuthenticated && !auth.isLoading) {
      router.push('/dashboard');
    }
  }, [auth.isAuthenticated, auth.isLoading, router]);

  const onSubmit = async (data: LoginFormData) => {
    try {
      setIsLoading(true);
      setError(null);
      
      await auth.login(data.email, data.password);
      
      // Redirect to dashboard on successful login
      router.push('/dashboard');
    } catch (err) {
      console.error('Login error:', err);
      setError(
        err instanceof Error 
          ? err.message 
          : 'An unexpected error occurred. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (auth.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
          <p className="text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side - Login Form */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div>
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">KB</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">KoraBuild</h1>
                <p className="text-sm text-gray-500">Admin Dashboard</p>
              </div>
            </div>
            
            <h2 className="text-3xl font-bold text-gray-900">
              Welcome back
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Sign in to your admin account to access the dashboard
            </p>
          </div>

          <div className="mt-8">
            {error && (
              <Alert className="mb-6 border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email address
                </label>
                <div className="mt-1">
                  <input
                    {...register('email')}
                    type="email"
                    autoComplete="email"
                    className={cn(
                      "appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm",
                      errors.email
                        ? "border-red-300 text-red-900 placeholder-red-300"
                        : "border-gray-300"
                    )}
                    placeholder="Enter your email"
                  />
                  {errors.email && (
                    <p className="mt-2 text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="mt-1 relative">
                  <input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    className={cn(
                      "appearance-none block w-full px-3 py-2 pr-10 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm",
                      errors.password
                        ? "border-red-300 text-red-900 placeholder-red-300"
                        : "border-gray-300"
                    )}
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                  {errors.password && (
                    <p className="mt-2 text-sm text-red-600">{errors.password.message}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                    Remember me
                  </label>
                </div>

                <div className="text-sm">
                  <a href="#" className="font-medium text-orange-600 hover:text-orange-500">
                    Forgot your password?
                  </a>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className={cn(
                    "group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500",
                    isLoading
                      ? "bg-orange-400 cursor-not-allowed"
                      : "bg-orange-600 hover:bg-orange-700"
                  )}
                >
                  {isLoading && (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  )}
                  Sign in
                </button>
              </div>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Admin Access Only</span>
                </div>
              </div>
            </div>

            {/* Demo credentials for development */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="text-sm font-medium text-blue-800 mb-2">Demo Credentials</h3>
                <div className="text-xs text-blue-700 space-y-1">
                  <div>Email: admin@korabuild.com</div>
                  <div>Password: admin123</div>
                  <p className="mt-2 text-blue-600">
                    Note: These are demo credentials for development only
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right side - Branding */}
      <div className="hidden lg:block relative w-0 flex-1">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-orange-600">
          <div className="absolute inset-0 bg-black bg-opacity-20" />
          <div className="relative h-full flex flex-col justify-center items-center text-white p-12">
            <div className="max-w-md text-center">
              <h1 className="text-4xl font-bold mb-6">
                Construction Management Excellence
              </h1>
              <p className="text-lg text-orange-100 mb-8">
                Comprehensive oversight and control of all construction projects, contractors, and operations.
              </p>
              <div className="space-y-4 text-sm text-orange-100">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-orange-200 rounded-full"></div>
                  <span>Real-time project monitoring</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-orange-200 rounded-full"></div>
                  <span>Financial oversight and control</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-orange-200 rounded-full"></div>
                  <span>Contractor management system</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-orange-200 rounded-full"></div>
                  <span>Quality assurance workflows</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 