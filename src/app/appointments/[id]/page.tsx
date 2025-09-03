'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Calendar, 
  Clock, 
  User,
  Video,
  MessageCircle,
  ArrowLeft,
  Edit,
  Trash2,
  CreditCard,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';

interface Appointment {
  _id: string;
  type: string;
  status: string;
  scheduledAt: string;
  duration: number;
  notes?: string;
  meetingLink?: string;
  dietitian: {
    _id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    consultationFee?: number;
  };
  client: {
    _id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  createdAt: string;
}

export default function AppointmentDetailPage() {
  const { data: session } = useSession();
  const params = useParams();
  const router = useRouter();
  const appointmentId = params.id as string;
  
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (appointmentId) {
      fetchAppointment();
    }
  }, [appointmentId]);

  const fetchAppointment = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/appointments/${appointmentId}`);
      if (response.ok) {
        const data = await response.json();
        setAppointment(data);
      } else {
        setError('Failed to load appointment');
      }
    } catch (error) {
      console.error('Error fetching appointment:', error);
      setError('Failed to load appointment');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAppointment = async () => {
    if (!appointment) return;
    
    setCancelling(true);
    try {
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setMessage('Appointment cancelled successfully');
        setTimeout(() => {
          router.push('/appointments');
        }, 2000);
      } else {
        setError('Failed to cancel appointment');
      }
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      setError('Failed to cancel appointment');
    } finally {
      setCancelling(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'no-show':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const isUpcoming = (scheduledAt: string) => {
    return new Date(scheduledAt) > new Date();
  };

  const canCancel = (appointment: Appointment) => {
    return appointment.status === 'scheduled' && isUpcoming(appointment.scheduledAt);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner />
        </div>
      </DashboardLayout>
    );
  }

  if (!appointment) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <Card>
            <CardContent className="text-center py-12">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Appointment Not Found</h3>
              <p className="text-gray-600">The requested appointment could not be found.</p>
              <Button asChild className="mt-4">
                <Link href="/appointments">Back to Appointments</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/appointments">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
          
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Appointment Details</h1>
            <p className="text-gray-600 mt-1">View and manage appointment information</p>
          </div>
        </div>

        {/* Messages */}
        {message && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Appointment Info */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl capitalize">
                      {appointment.type.replace('_', ' ')}
                    </CardTitle>
                    <CardDescription>
                      Appointment #{appointment._id.slice(-8)}
                    </CardDescription>
                  </div>
                  <Badge className={getStatusColor(appointment.status)}>
                    {appointment.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Date & Time */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-medium">Date</p>
                      <p className="text-sm text-gray-600">
                        {format(new Date(appointment.scheduledAt), 'EEEE, MMMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Clock className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-medium">Time</p>
                      <p className="text-sm text-gray-600">
                        {format(new Date(appointment.scheduledAt), 'h:mm a')} ({appointment.duration} min)
                      </p>
                    </div>
                  </div>
                </div>

                {/* Participants */}
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900">Participants</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Dietitian */}
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={appointment.dietitian.avatar} />
                        <AvatarFallback>
                          {appointment.dietitian.firstName[0]}{appointment.dietitian.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          Dr. {appointment.dietitian.firstName} {appointment.dietitian.lastName}
                        </p>
                        <p className="text-sm text-gray-600">Dietitian</p>
                      </div>
                    </div>

                    {/* Client */}
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={appointment.client.avatar} />
                        <AvatarFallback>
                          {appointment.client.firstName[0]}{appointment.client.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {appointment.client.firstName} {appointment.client.lastName}
                        </p>
                        <p className="text-sm text-gray-600">Client</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {appointment.notes && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Notes</h3>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-700">{appointment.notes}</p>
                    </div>
                  </div>
                )}

                {/* Meeting Link */}
                {appointment.meetingLink && isUpcoming(appointment.scheduledAt) && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Meeting Link</h3>
                    <Button asChild>
                      <a href={appointment.meetingLink} target="_blank" rel="noopener noreferrer">
                        <Video className="h-4 w-4 mr-2" />
                        Join Video Call
                      </a>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Actions Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Message */}
                <Button variant="outline" className="w-full" asChild>
                  <Link href={`/messages?user=${
                    session?.user?.role === 'client' 
                      ? appointment.dietitian._id 
                      : appointment.client._id
                  }`}>
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Send Message
                  </Link>
                </Button>

                {/* Payment (for clients) */}
                {session?.user?.role === 'client' && appointment.status === 'scheduled' && (
                  <Button className="w-full" asChild>
                    <Link href={`/appointments/${appointment._id}/payment`}>
                      <CreditCard className="h-4 w-4 mr-2" />
                      Make Payment
                    </Link>
                  </Button>
                )}

                {/* Edit (for dietitians) */}
                {session?.user?.role === 'dietitian' && canCancel(appointment) && (
                  <Button variant="outline" className="w-full">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Appointment
                  </Button>
                )}

                {/* Cancel */}
                {canCancel(appointment) && (
                  <Button 
                    variant="destructive" 
                    className="w-full"
                    onClick={handleCancelAppointment}
                    disabled={cancelling}
                  >
                    {cancelling ? (
                      <>
                        <LoadingSpinner className="h-4 w-4 mr-2" />
                        Cancelling...
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Cancel Appointment
                      </>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Appointment Info */}
            <Card>
              <CardHeader>
                <CardTitle>Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Created:</span>
                  <span>{format(new Date(appointment.createdAt), 'MMM d, yyyy')}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Duration:</span>
                  <span>{appointment.duration} minutes</span>
                </div>
                
                {appointment.dietitian.consultationFee && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Fee:</span>
                    <span>${appointment.dietitian.consultationFee}</span>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <Badge className={getStatusColor(appointment.status)}>
                    {appointment.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
