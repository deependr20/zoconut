'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useParams } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { 
  User, 
  MessageCircle, 
  Calendar,
  Heart,
  Target,
  TrendingUp,
  Utensils,
  Activity,
  Phone,
  Mail,
  MapPin
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

interface Client {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatar?: string;
  status: string;
  dateOfBirth?: string;
  gender?: string;
  height?: number;
  weight?: number;
  activityLevel?: string;
  healthGoals?: string[];
  medicalConditions?: string[];
  allergies?: string[];
  dietaryRestrictions?: string[];
  createdAt: string;
}

interface ProgressEntry {
  _id: string;
  type: string;
  value: number;
  unit: string;
  recordedAt: string;
}

interface Appointment {
  _id: string;
  type: string;
  status: string;
  scheduledAt: string;
  duration: number;
  notes?: string;
}

export default function ClientDetailPage() {
  const { data: session } = useSession();
  const params = useParams();
  const clientId = params.id as string;
  
  const [client, setClient] = useState<Client | null>(null);
  const [progressEntries, setProgressEntries] = useState<ProgressEntry[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (clientId) {
      fetchClientData();
    }
  }, [clientId]);

  const fetchClientData = async () => {
    try {
      setLoading(true);
      
      // Fetch client details
      const clientResponse = await fetch(`/api/users/${clientId}`);
      if (clientResponse.ok) {
        const clientData = await clientResponse.json();
        setClient(clientData);
      }

      // Fetch progress entries
      const progressResponse = await fetch(`/api/progress?clientId=${clientId}`);
      if (progressResponse.ok) {
        const progressData = await progressResponse.json();
        setProgressEntries(progressData.progressEntries);
      }

      // Fetch appointments
      const appointmentsResponse = await fetch(`/api/appointments?clientId=${clientId}`);
      if (appointmentsResponse.ok) {
        const appointmentsData = await appointmentsResponse.json();
        setAppointments(appointmentsData.appointments);
      }
      
    } catch (error) {
      console.error('Error fetching client data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getWeightData = () => {
    return progressEntries
      .filter(entry => entry.type === 'weight')
      .sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime())
      .map(entry => ({
        date: format(new Date(entry.recordedAt), 'MMM dd'),
        weight: entry.value,
        fullDate: entry.recordedAt
      }));
  };

  const getUpcomingAppointments = () => {
    const now = new Date();
    return appointments
      .filter(apt => apt.status === 'scheduled' && new Date(apt.scheduledAt) > now)
      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
      .slice(0, 3);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
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

  if (!client) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <Card>
            <CardContent className="text-center py-12">
              <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Client Not Found</h3>
              <p className="text-gray-600">The requested client could not be found.</p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const weightData = getWeightData();
  const upcomingAppointments = getUpcomingAppointments();

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={client.avatar} />
              <AvatarFallback className="text-lg">
                {client.firstName[0]}{client.lastName[0]}
              </AvatarFallback>
            </Avatar>
            
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {client.firstName} {client.lastName}
              </h1>
              <div className="flex items-center space-x-2 mt-1">
                <Badge className={getStatusColor(client.status)}>
                  {client.status}
                </Badge>
                <span className="text-gray-600">
                  Client since {format(new Date(client.createdAt), 'MMM yyyy')}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <Button variant="outline" asChild>
              <Link href={`/messages?user=${client._id}`}>
                <MessageCircle className="h-4 w-4 mr-2" />
                Message
              </Link>
            </Button>
            
            <Button asChild>
              <Link href={`/appointments/book?client=${client._id}`}>
                <Calendar className="h-4 w-4 mr-2" />
                Book Appointment
              </Link>
            </Button>
          </div>
        </div>

        {/* Client Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Basic Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-2 text-sm">
                <Mail className="h-4 w-4 text-gray-400" />
                <span>{client.email}</span>
              </div>
              
              {client.phone && (
                <div className="flex items-center space-x-2 text-sm">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span>{client.phone}</span>
                </div>
              )}
              
              {client.dateOfBirth && (
                <div className="text-sm">
                  <span className="text-gray-600">Age: </span>
                  <span>{calculateAge(client.dateOfBirth)} years old</span>
                </div>
              )}
              
              {client.gender && (
                <div className="text-sm">
                  <span className="text-gray-600">Gender: </span>
                  <span className="capitalize">{client.gender}</span>
                </div>
              )}
              
              {client.height && (
                <div className="text-sm">
                  <span className="text-gray-600">Height: </span>
                  <span>{client.height} cm</span>
                </div>
              )}
              
              {client.weight && (
                <div className="text-sm">
                  <span className="text-gray-600">Current Weight: </span>
                  <span>{client.weight} kg</span>
                </div>
              )}
              
              {client.activityLevel && (
                <div className="text-sm">
                  <span className="text-gray-600">Activity Level: </span>
                  <span className="capitalize">{client.activityLevel.replace('_', ' ')}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Health Goals */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="h-5 w-5" />
                <span>Health Goals</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {client.healthGoals && client.healthGoals.length > 0 ? (
                <div className="space-y-2">
                  {client.healthGoals.map((goal, index) => (
                    <Badge key={index} variant="outline" className="mr-2 mb-2">
                      {goal}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No health goals specified</p>
              )}
            </CardContent>
          </Card>

          {/* Medical Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Heart className="h-5 w-5" />
                <span>Medical Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {client.medicalConditions && client.medicalConditions.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Medical Conditions</h4>
                  <div className="space-y-1">
                    {client.medicalConditions.map((condition, index) => (
                      <Badge key={index} variant="outline" className="mr-2 mb-1 text-xs">
                        {condition}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {client.allergies && client.allergies.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Allergies</h4>
                  <div className="space-y-1">
                    {client.allergies.map((allergy, index) => (
                      <Badge key={index} variant="outline" className="mr-2 mb-1 text-xs bg-red-50 text-red-700">
                        {allergy}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {client.dietaryRestrictions && client.dietaryRestrictions.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Dietary Restrictions</h4>
                  <div className="space-y-1">
                    {client.dietaryRestrictions.map((restriction, index) => (
                      <Badge key={index} variant="outline" className="mr-2 mb-1 text-xs bg-orange-50 text-orange-700">
                        {restriction}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {(!client.medicalConditions || client.medicalConditions.length === 0) &&
               (!client.allergies || client.allergies.length === 0) &&
               (!client.dietaryRestrictions || client.dietaryRestrictions.length === 0) && (
                <p className="text-gray-500 text-sm">No medical information provided</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Tabs for detailed information */}
        <Tabs defaultValue="progress" className="space-y-4">
          <TabsList>
            <TabsTrigger value="progress">Progress</TabsTrigger>
            <TabsTrigger value="appointments">Appointments</TabsTrigger>
            <TabsTrigger value="meal-plans">Meal Plans</TabsTrigger>
          </TabsList>

          <TabsContent value="progress" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5" />
                  <span>Weight Progress</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {weightData.length > 0 ? (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={weightData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip 
                          labelFormatter={(label, payload) => {
                            if (payload && payload[0]) {
                              return format(new Date(payload[0].payload.fullDate), 'MMMM d, yyyy');
                            }
                            return label;
                          }}
                          formatter={(value) => [`${value} kg`, 'Weight']}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="weight" 
                          stroke="#16a34a" 
                          strokeWidth={2}
                          dot={{ fill: '#16a34a', strokeWidth: 2, r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No progress data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appointments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5" />
                  <span>Upcoming Appointments</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {upcomingAppointments.length > 0 ? (
                  <div className="space-y-3">
                    {upcomingAppointments.map((appointment) => (
                      <div key={appointment._id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium capitalize">{appointment.type.replace('_', ' ')}</p>
                          <p className="text-sm text-gray-600">
                            {format(new Date(appointment.scheduledAt), 'EEEE, MMMM d, yyyy')} at{' '}
                            {format(new Date(appointment.scheduledAt), 'h:mm a')}
                          </p>
                        </div>
                        <Badge variant="outline">{appointment.duration} min</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No upcoming appointments</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="meal-plans" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Utensils className="h-5 w-5" />
                  <span>Meal Plans</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Utensils className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Meal plans feature coming soon</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
