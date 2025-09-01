'use client';

import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { StatsCard } from '@/components/ui/stats-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Calendar, 
  TrendingUp, 
  DollarSign,
  Clock,
  MessageCircle,
  Heart,
  CheckCircle
} from 'lucide-react';
import Link from 'next/link';

export default function DietitianDashboard() {
  const { data: session } = useSession();

  // Mock data - in real app, this would come from API
  const stats = {
    totalClients: 24,
    activeClients: 18,
    appointmentsToday: 5,
    monthlyRevenue: 4250,
    completedSessions: 156,
    averageRating: 4.8
  };

  const todayAppointments = [
    {
      id: 1,
      time: '9:00 AM',
      client: 'Sarah Wilson',
      type: 'Initial Consultation',
      status: 'confirmed'
    },
    {
      id: 2,
      time: '11:00 AM',
      client: 'Mike Johnson',
      type: 'Follow-up',
      status: 'confirmed'
    },
    {
      id: 3,
      time: '2:00 PM',
      client: 'Emma Davis',
      type: 'Progress Review',
      status: 'pending'
    },
    {
      id: 4,
      time: '4:00 PM',
      client: 'John Smith',
      type: 'Meal Plan Review',
      status: 'confirmed'
    }
  ];

  const recentClients = [
    {
      id: 1,
      name: 'Sarah Wilson',
      lastSeen: '2 days ago',
      progress: 'On track',
      status: 'active'
    },
    {
      id: 2,
      name: 'Mike Johnson',
      lastSeen: '1 week ago',
      progress: 'Excellent',
      status: 'active'
    },
    {
      id: 3,
      name: 'Emma Davis',
      lastSeen: '3 days ago',
      progress: 'Needs attention',
      status: 'active'
    }
  ];

  const pendingTasks = [
    { id: 1, task: 'Review Sarah\'s food log', priority: 'high' },
    { id: 2, task: 'Create meal plan for new client', priority: 'medium' },
    { id: 3, task: 'Update Mike\'s progress notes', priority: 'low' },
    { id: 4, task: 'Respond to Emma\'s message', priority: 'high' }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Good morning, Dr. {session?.user?.lastName}!
            </h1>
            <p className="text-gray-600 mt-1">
              You have {stats.appointmentsToday} appointments scheduled for today
            </p>
          </div>
          <Button asChild>
            <Link href="/clients/new">Add New Client</Link>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Clients"
            value={stats.totalClients}
            description={`${stats.activeClients} active`}
            icon={<Users className="h-4 w-4" />}
            trend={{ value: 12, isPositive: true }}
          />
          <StatsCard
            title="Today's Appointments"
            value={stats.appointmentsToday}
            description="2 confirmed, 1 pending"
            icon={<Calendar className="h-4 w-4" />}
          />
          <StatsCard
            title="Monthly Revenue"
            value={`$${stats.monthlyRevenue.toLocaleString()}`}
            description="This month"
            icon={<DollarSign className="h-4 w-4" />}
            trend={{ value: 8.5, isPositive: true }}
          />
          <StatsCard
            title="Completed Sessions"
            value={stats.completedSessions}
            description={`${stats.averageRating}★ avg rating`}
            icon={<CheckCircle className="h-4 w-4" />}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Today's Schedule */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-green-600" />
                <span>Today's Schedule</span>
              </CardTitle>
              <CardDescription>
                Your appointments for today
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {todayAppointments.map((appointment) => (
                  <div key={appointment.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <p className="font-medium">{appointment.time}</p>
                        <Badge className={getStatusColor(appointment.status)}>
                          {appointment.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">{appointment.client}</p>
                      <p className="text-xs text-gray-500">{appointment.type}</p>
                    </div>
                    <Button variant="outline" size="sm">
                      View
                    </Button>
                  </div>
                ))}
                
                <Button variant="outline" className="w-full mt-4" asChild>
                  <Link href="/appointments">View All Appointments</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Clients */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-green-600" />
                <span>Recent Clients</span>
              </CardTitle>
              <CardDescription>
                Latest client activity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentClients.map((client) => (
                  <div key={client.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{client.name}</p>
                      <p className="text-sm text-gray-600">Last seen: {client.lastSeen}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="text-xs">
                        {client.progress}
                      </Badge>
                    </div>
                  </div>
                ))}
                
                <Button variant="outline" className="w-full mt-4" asChild>
                  <Link href="/clients">View All Clients</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pending Tasks */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-green-600" />
                <span>Pending Tasks</span>
              </CardTitle>
              <CardDescription>
                Items that need your attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pendingTasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{task.task}</p>
                    </div>
                    <Badge className={getPriorityColor(task.priority)}>
                      {task.priority}
                    </Badge>
                  </div>
                ))}
                
                <Button variant="outline" className="w-full mt-4">
                  View All Tasks
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common tasks and shortcuts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="h-20 flex flex-col space-y-2" asChild>
                  <Link href="/meal-plans/create">
                    <Heart className="h-6 w-6" />
                    <span>Create Meal Plan</span>
                  </Link>
                </Button>
                
                <Button variant="outline" className="h-20 flex flex-col space-y-2" asChild>
                  <Link href="/messages">
                    <MessageCircle className="h-6 w-6" />
                    <span>Messages</span>
                  </Link>
                </Button>
                
                <Button variant="outline" className="h-20 flex flex-col space-y-2" asChild>
                  <Link href="/analytics">
                    <TrendingUp className="h-6 w-6" />
                    <span>Analytics</span>
                  </Link>
                </Button>
                
                <Button variant="outline" className="h-20 flex flex-col space-y-2" asChild>
                  <Link href="/appointments/schedule">
                    <Calendar className="h-6 w-6" />
                    <span>Schedule</span>
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
