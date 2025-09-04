'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Home, ArrowLeft } from 'lucide-react';

function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case 'Configuration':
        return {
          title: 'Configuration Error',
          message: 'There is a problem with the server configuration. Please contact support.',
          details: 'This usually happens when environment variables are not properly configured.'
        };
      case 'AccessDenied':
        return {
          title: 'Access Denied',
          message: 'You do not have permission to sign in.',
          details: 'Your account may be inactive or you may not have the required permissions.'
        };
      case 'Verification':
        return {
          title: 'Verification Error',
          message: 'The verification token has expired or is invalid.',
          details: 'Please try signing in again or request a new verification email.'
        };
      case 'Default':
      default:
        return {
          title: 'Authentication Error',
          message: 'An error occurred during authentication.',
          details: 'Please try signing in again. If the problem persists, contact support.'
        };
    }
  };

  const errorInfo = getErrorMessage(error);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="w-6 h-6 text-red-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            {errorInfo.title}
          </CardTitle>
          <CardDescription className="text-gray-600">
            {errorInfo.message}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {errorInfo.details}
            </AlertDescription>
          </Alert>

          {error === 'Configuration' && (
            <Alert className="border-blue-200 bg-blue-50">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <strong>Demo Mode Available:</strong> You can try the demo with these credentials:
                <br />
                <strong>Email:</strong> demo@zoconut.com
                <br />
                <strong>Password:</strong> demo123
              </AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col space-y-2">
            <Button asChild className="w-full">
              <Link href="/auth/signin">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Try Again
              </Link>
            </Button>
            
            <Button variant="outline" asChild className="w-full">
              <Link href="/">
                <Home className="w-4 h-4 mr-2" />
                Go Home
              </Link>
            </Button>
          </div>

          {process.env.NODE_ENV === 'development' && (
            <div className="mt-4 p-3 bg-gray-100 rounded-md">
              <p className="text-xs text-gray-600">
                <strong>Debug Info:</strong> Error type: {error || 'Unknown'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    }>
      <ErrorContent />
    </Suspense>
  );
}
