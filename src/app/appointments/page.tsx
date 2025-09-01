'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { 
  Calendar, 
  Clock, 
  Video,
  User,
  Plus
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
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  client: {
    firstName: string;
    lastName: string;
    avatar?: string;
  };
}

export default function AppointmentsPage() {
  const { data: session } = useSession();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming');

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/appointments');
      if (response.ok) {
        const data = await response.json();
        setAppointments(data.appointments);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAppointmentsByStatus = () => {
    const now = new Date();
    
    return {
      upcoming: appointments.filter(apt => 
        apt.status === 'scheduled' && new Date(apt.scheduledAt) > now
      ),
      past: appointments.filter(apt => 
        apt.status === 'completed' || 
        (apt.status === 'scheduled' && new Date(apt.scheduledAt) < now)
      ),
      cancelled: appointments.filter(apt => apt.status === 'cancelled')
    };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video_consultation':
        return <Video className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const handleCancelAppointment = async (appointmentId: string) => {
    try {
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        fetchAppointments(); // Refresh the list
      }
    } catch (error) {
      console.error('Error cancelling appointment:', error);
    }
  };

  const appointmentGroups = getAppointmentsByStatus();

  const AppointmentCard = ({ appointment }: { appointment: Appointment }) => {
    const isUpcoming = appointment.status === 'scheduled' && new Date(appointment.scheduledAt) > new Date();
    const isPast = new Date(appointment.scheduledAt) < new Date();
    const canCancel = isUpcoming && appointment.status === 'scheduled';
    
    return (
      <Card key={appointment._id}>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                {getTypeIcon(appointment.type)}
                <h3 className="font-semibold capitalize">
                  {appointment.type.replace('_', ' ')}
                </h3>
                <Badge className={getStatusColor(appointment.status)}>
                  {appointment.status}
                </Badge>
              </div>
              
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4" />
                  <span>{format(new Date(appointment.scheduledAt), 'EEEE, MMMM d, yyyy')}</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4" />
                  <span>
                    {format(new Date(appointment.scheduledAt), 'h:mm a')} 
                    ({appointment.duration} minutes)
                  </span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span>
                    {session?.user?.role === 'client' 
                      ? `Dr. ${appointment.dietitian.firstName} ${appointment.dietitian.lastName}`
                      : `${appointment.client.firstName} ${appointment.client.lastName}`
                    }
                  </span>
                </div>
              </div>
              
              {appointment.notes && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700">{appointment.notes}</p>
                </div>
              )}
            </div>
            
            <div className="flex flex-col space-y-2 ml-4">
              {appointment.meetingLink && isUpcoming && (
                <Button size="sm" asChild>
                  <a href={appointment.meetingLink} target="_blank" rel="noopener noreferrer">
                    <Video className="h-4 w-4 mr-2" />
                    Join Call
                  </a>
                </Button>
              )}
              
              {canCancel && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleCancelAppointment(appointment._id)}
                >
                  Cancel
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Appointments</h1>
            <p className="text-gray-600 mt-1">Manage your consultations</p>
          </div>
          
          <Button asChild>
            <Link href="/appointments/book">
              <Plus className="h-4 w-4 mr-2" />
              Book Appointment
            </Link>
          </Button>
        </div>

        {/* Appointments Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="upcoming">
              Upcoming ({appointmentGroups.upcoming.length})
            </TabsTrigger>
            <TabsTrigger value="past">
              Past ({appointmentGroups.past.length})
            </TabsTrigger>
            <TabsTrigger value="cancelled">
              Cancelled ({appointmentGroups.cancelled.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <LoadingSpinner />
              </div>
            ) : appointmentGroups.upcoming.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Upcoming Appointments</h3>
                  <p className="text-gray-600 mb-4">
                    You don't have any scheduled appointments.
                  </p>
                  <Button asChild>
                    <Link href="/appointments/book">Book Your First Appointment</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {appointmentGroups.upcoming.map((appointment) => (
                  <AppointmentCard key={appointment._id} appointment={appointment} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="past" className="space-y-4">
            {appointmentGroups.past.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Past Appointments</h3>
                  <p className="text-gray-600">
                    Your completed appointments will appear here.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {appointmentGroups.past.map((appointment) => (
                  <AppointmentCard key={appointment._id} appointment={appointment} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="cancelled" className="space-y-4">
            {appointmentGroups.cancelled.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Cancelled Appointments</h3>
                  <p className="text-gray-600">
                    Your cancelled appointments will appear here.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {appointmentGroups.cancelled.map((appointment) => (
                  <AppointmentCard key={appointment._id} appointment={appointment} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
