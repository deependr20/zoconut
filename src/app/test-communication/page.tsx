'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  AlertCircle,
  MessageCircle,
  Users,
  User,
  Calendar
} from 'lucide-react';

export default function TestCommunicationPage() {
  const { data: session } = useSession();
  const [testResults, setTestResults] = useState<any>({});
  const [loading, setLoading] = useState(false);

  const runTests = async () => {
    setLoading(true);
    const results: any = {};

    try {
      // Test 1: Check user session
      results.session = {
        status: session?.user ? 'pass' : 'fail',
        data: session?.user ? {
          id: session.user.id,
          role: session.user.role,
          name: session.user.name
        } : null
      };

      // Test 2: Check available users API
      try {
        const availableResponse = await fetch('/api/users/available');
        const availableData = await availableResponse.json();
        results.availableUsers = {
          status: availableResponse.ok ? 'pass' : 'fail',
          data: availableData,
          count: availableData.users?.length || 0
        };
      } catch (error) {
        results.availableUsers = {
          status: 'fail',
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }

      // Test 3: Check conversations API
      try {
        const conversationsResponse = await fetch('/api/messages/conversations');
        const conversationsData = await conversationsResponse.json();
        results.conversations = {
          status: conversationsResponse.ok ? 'pass' : 'fail',
          data: conversationsData,
          count: conversationsData.conversations?.length || 0
        };
      } catch (error) {
        results.conversations = {
          status: 'fail',
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }

      // Test 4: Check assigned dietitian (for clients only)
      if (session?.user?.role === 'client') {
        try {
          const dietitianResponse = await fetch('/api/users/dietitian');
          const dietitianData = await dietitianResponse.json();
          results.assignedDietitian = {
            status: dietitianResponse.ok ? 'pass' : 'fail',
            data: dietitianData,
            hasAssigned: !!dietitianData.dietitian
          };
        } catch (error) {
          results.assignedDietitian = {
            status: 'fail',
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      }

      // Test 5: Check appointments API
      try {
        const appointmentsResponse = await fetch('/api/appointments');
        const appointmentsData = await appointmentsResponse.json();
        results.appointments = {
          status: appointmentsResponse.ok ? 'pass' : 'fail',
          data: appointmentsData,
          count: appointmentsData.appointments?.length || 0
        };
      } catch (error) {
        results.appointments = {
          status: 'fail',
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }

    } catch (error) {
      console.error('Test error:', error);
    }

    setTestResults(results);
    setLoading(false);
  };

  useEffect(() => {
    if (session?.user) {
      runTests();
    }
  }, [session]);

  const getStatusIcon = (status: string) => {
    return status === 'pass' ? (
      <CheckCircle className="h-5 w-5 text-green-500" />
    ) : (
      <AlertCircle className="h-5 w-5 text-red-500" />
    );
  };

  const getStatusBadge = (status: string) => {
    return (
      <Badge className={status === 'pass' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
        {status === 'pass' ? 'PASS' : 'FAIL'}
      </Badge>
    );
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Communication System Test</h1>
          <p className="text-gray-600 mt-1">Test all communication features and APIs</p>
        </div>

        <div className="flex justify-between items-center">
          <Button onClick={runTests} disabled={loading}>
            {loading ? (
              <>
                <LoadingSpinner className="mr-2 h-4 w-4" />
                Running Tests...
              </>
            ) : (
              'Run Tests'
            )}
          </Button>
          
          {Object.keys(testResults).length > 0 && (
            <div className="text-sm text-gray-600">
              Tests completed: {Object.keys(testResults).length}
            </div>
          )}
        </div>

        {Object.keys(testResults).length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Session Test */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <User className="h-5 w-5" />
                    <span>User Session</span>
                  </CardTitle>
                  {getStatusBadge(testResults.session?.status)}
                </div>
              </CardHeader>
              <CardContent>
                {testResults.session?.status === 'pass' ? (
                  <div className="space-y-2 text-sm">
                    <p><strong>ID:</strong> {testResults.session.data.id}</p>
                    <p><strong>Role:</strong> {testResults.session.data.role}</p>
                    <p><strong>Name:</strong> {testResults.session.data.name}</p>
                  </div>
                ) : (
                  <Alert variant="destructive">
                    <AlertDescription>No active session found</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Available Users Test */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-5 w-5" />
                    <span>Available Users</span>
                  </CardTitle>
                  {getStatusBadge(testResults.availableUsers?.status)}
                </div>
              </CardHeader>
              <CardContent>
                {testResults.availableUsers?.status === 'pass' ? (
                  <div className="space-y-2 text-sm">
                    <p><strong>Count:</strong> {testResults.availableUsers.count} users</p>
                    {testResults.availableUsers.data.users?.slice(0, 3).map((user: any, index: number) => (
                      <p key={index}>• {user.firstName} {user.lastName} ({user.role})</p>
                    ))}
                  </div>
                ) : (
                  <Alert variant="destructive">
                    <AlertDescription>
                      {testResults.availableUsers?.error || 'Failed to load available users'}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Conversations Test */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <MessageCircle className="h-5 w-5" />
                    <span>Conversations</span>
                  </CardTitle>
                  {getStatusBadge(testResults.conversations?.status)}
                </div>
              </CardHeader>
              <CardContent>
                {testResults.conversations?.status === 'pass' ? (
                  <div className="space-y-2 text-sm">
                    <p><strong>Count:</strong> {testResults.conversations.count} conversations</p>
                    {testResults.conversations.data.conversations?.slice(0, 3).map((conv: any, index: number) => (
                      <p key={index}>• {conv.user?.firstName} {conv.user?.lastName}</p>
                    ))}
                  </div>
                ) : (
                  <Alert variant="destructive">
                    <AlertDescription>
                      {testResults.conversations?.error || 'Failed to load conversations'}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Assigned Dietitian Test (Clients only) */}
            {session?.user?.role === 'client' && testResults.assignedDietitian && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center space-x-2">
                      <User className="h-5 w-5" />
                      <span>Assigned Dietitian</span>
                    </CardTitle>
                    {getStatusBadge(testResults.assignedDietitian?.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  {testResults.assignedDietitian?.status === 'pass' ? (
                    <div className="space-y-2 text-sm">
                      {testResults.assignedDietitian.hasAssigned ? (
                        <>
                          <p><strong>Name:</strong> Dr. {testResults.assignedDietitian.data.dietitian.firstName} {testResults.assignedDietitian.data.dietitian.lastName}</p>
                          <p><strong>Email:</strong> {testResults.assignedDietitian.data.dietitian.email}</p>
                        </>
                      ) : (
                        <p>No dietitian assigned yet</p>
                      )}
                    </div>
                  ) : (
                    <Alert variant="destructive">
                      <AlertDescription>
                        {testResults.assignedDietitian?.error || 'Failed to load assigned dietitian'}
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Appointments Test */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5" />
                    <span>Appointments</span>
                  </CardTitle>
                  {getStatusBadge(testResults.appointments?.status)}
                </div>
              </CardHeader>
              <CardContent>
                {testResults.appointments?.status === 'pass' ? (
                  <div className="space-y-2 text-sm">
                    <p><strong>Count:</strong> {testResults.appointments.count} appointments</p>
                    {testResults.appointments.data.appointments?.slice(0, 3).map((apt: any, index: number) => (
                      <p key={index}>• {apt.type} - {apt.status}</p>
                    ))}
                  </div>
                ) : (
                  <Alert variant="destructive">
                    <AlertDescription>
                      {testResults.appointments?.error || 'Failed to load appointments'}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>How to Test Communication</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">For Clients:</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
                <li>Go to Dashboard → Contact Dietitian card</li>
                <li>Click "Send Message" to open chat</li>
                <li>Go to Messages page to see conversations</li>
                <li>Book appointment and message from appointment details</li>
              </ol>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">For Dietitians:</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
                <li>Go to Clients page → Click message button</li>
                <li>Go to Messages page to see all client conversations</li>
                <li>View appointments and message clients from there</li>
                <li>Use client profiles to start conversations</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
