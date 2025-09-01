'use client';

import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { StatsCard } from '@/components/ui/stats-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  TrendingUp, 
  DollarSign,
  Activity,
  UserCheck,
  AlertTriangle,
  Calendar,
  MessageSquare
} from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboard() {
  const { data: session } = useSession();

  // Mock data - in real app, this would come from API
  const stats = {
    totalUsers: 1247,
    totalDietitians: 89,
    totalClients: 1158,
    activeUsers: 892,
    monthlyRevenue: 45780,
    totalAppointments: 2341,
    completionRate: 94.2
  };

  const recentActivity = [
    {
      id: 1,
      type: 'user_signup',
      message: 'New client registered: Sarah Johnson',
      time: '2 minutes ago',
      status: 'success'
    },
    {
      id: 2,
      type: 'appointment',
      message: 'Appointment completed: Dr. Smith & Mike Wilson',
      time: '15 minutes ago',
      status: 'success'
    },
    {
      id: 3,
      type: 'payment',
      message: 'Payment processed: $150 from Emma Davis',
      time: '1 hour ago',
      status: 'success'
    },
    {
      id: 4,
      type: 'issue',
      message: 'Support ticket created: Login issues',
      time: '2 hours ago',
      status: 'warning'
    }
  ];

  const systemAlerts = [
    {
      id: 1,
      type: 'warning',
      message: 'Server response time increased by 15%',
      time: '30 minutes ago'
    },
    {
      id: 2,
      type: 'info',
      message: 'Scheduled maintenance tonight at 2 AM',
      time: '2 hours ago'
    },
    {
      id: 3,
      type: 'success',
      message: 'Database backup completed successfully',
      time: '4 hours ago'
    }
  ];

  const topDietitians = [
    {
      id: 1,
      name: 'Dr. Sarah Johnson',
      clients: 45,
      rating: 4.9,
      revenue: 8750
    },
    {
      id: 2,
      name: 'Dr. Michael Chen',
      clients: 38,
      rating: 4.8,
      revenue: 7200
    },
    {
      id: 3,
      name: 'Dr. Emily Davis',
      clients: 42,
      rating: 4.7,
      revenue: 6950
    }
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user_signup':
        return <UserCheck className="h-4 w-4" />;
      case 'appointment':
        return <Calendar className="h-4 w-4" />;
      case 'payment':
        return <DollarSign className="h-4 w-4" />;
      case 'issue':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      case 'success':
        return 'border-green-200 bg-green-50';
      default:
        return 'border-blue-200 bg-blue-50';
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Admin Dashboard
            </h1>
            <p className="text-gray-600 mt-1">
              System overview and management
            </p>
          </div>
          <Button asChild>
            <Link href="/admin/reports">Generate Report</Link>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Users"
            value={stats.totalUsers.toLocaleString()}
            description={`${stats.activeUsers} active`}
            icon={<Users className="h-4 w-4" />}
            trend={{ value: 12.5, isPositive: true }}
          />
          <StatsCard
            title="Dietitians"
            value={stats.totalDietitians}
            description="Certified professionals"
            icon={<UserCheck className="h-4 w-4" />}
            trend={{ value: 8.2, isPositive: true }}
          />
          <StatsCard
            title="Monthly Revenue"
            value={`$${stats.monthlyRevenue.toLocaleString()}`}
            description="This month"
            icon={<DollarSign className="h-4 w-4" />}
            trend={{ value: 15.3, isPositive: true }}
          />
          <StatsCard
            title="Appointments"
            value={stats.totalAppointments.toLocaleString()}
            description={`${stats.completionRate}% completion rate`}
            icon={<Calendar className="h-4 w-4" />}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-5 w-5 text-green-600" />
                <span>Recent Activity</span>
              </CardTitle>
              <CardDescription>
                Latest system activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                    <div className="flex-shrink-0 mt-1">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {activity.message}
                      </p>
                      <p className="text-xs text-gray-500">{activity.time}</p>
                    </div>
                    <Badge className={getStatusColor(activity.status)}>
                      {activity.status}
                    </Badge>
                  </div>
                ))}
                
                <Button variant="outline" className="w-full mt-4">
                  View All Activity
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* System Alerts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <span>System Alerts</span>
              </CardTitle>
              <CardDescription>
                Important system notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {systemAlerts.map((alert) => (
                  <div key={alert.id} className={`p-3 border rounded-lg ${getAlertColor(alert.type)}`}>
                    <p className="text-sm font-medium">{alert.message}</p>
                    <p className="text-xs text-gray-500 mt-1">{alert.time}</p>
                  </div>
                ))}
                
                <Button variant="outline" className="w-full mt-4">
                  View All Alerts
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Performing Dietitians */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <span>Top Performing Dietitians</span>
              </CardTitle>
              <CardDescription>
                Based on client count and ratings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topDietitians.map((dietitian, index) => (
                  <div key={dietitian.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-green-600">
                            #{index + 1}
                          </span>
                        </div>
                      </div>
                      <div>
                        <p className="font-medium">{dietitian.name}</p>
                        <p className="text-sm text-gray-600">
                          {dietitian.clients} clients • {dietitian.rating}★
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">${dietitian.revenue.toLocaleString()}</p>
                      <p className="text-xs text-gray-500">revenue</p>
                    </div>
                  </div>
                ))}
                
                <Button variant="outline" className="w-full mt-4" asChild>
                  <Link href="/admin/dietitians">View All Dietitians</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Admin Actions</CardTitle>
              <CardDescription>
                Common administrative tasks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="h-20 flex flex-col space-y-2" asChild>
                  <Link href="/admin/users">
                    <Users className="h-6 w-6" />
                    <span>Manage Users</span>
                  </Link>
                </Button>
                
                <Button variant="outline" className="h-20 flex flex-col space-y-2" asChild>
                  <Link href="/admin/analytics">
                    <TrendingUp className="h-6 w-6" />
                    <span>Analytics</span>
                  </Link>
                </Button>
                
                <Button variant="outline" className="h-20 flex flex-col space-y-2" asChild>
                  <Link href="/admin/support">
                    <MessageSquare className="h-6 w-6" />
                    <span>Support Tickets</span>
                  </Link>
                </Button>
                
                <Button variant="outline" className="h-20 flex flex-col space-y-2" asChild>
                  <Link href="/admin/settings">
                    <Activity className="h-6 w-6" />
                    <span>System Settings</span>
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
