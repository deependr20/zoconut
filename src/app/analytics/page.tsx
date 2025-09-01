'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { 
  Users, 
  Calendar,
  DollarSign,
  TrendingUp,
  Activity,
  Target,
  Clock,
  Award
} from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';

interface AnalyticsData {
  totalClients: number;
  activeClients: number;
  totalAppointments: number;
  completedAppointments: number;
  totalRevenue: number;
  monthlyRevenue: number;
  avgSessionDuration: number;
  clientRetentionRate: number;
  appointmentsByMonth: Array<{ month: string; appointments: number; revenue: number }>;
  clientProgress: Array<{ clientName: string; weightLoss: number; adherence: number }>;
  appointmentTypes: Array<{ type: string; count: number; revenue: number }>;
  revenueByMonth: Array<{ month: string; revenue: number }>;
}

export default function AnalyticsPage() {
  const { data: session } = useSession();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('6months');

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      
      // In a real app, you'd have an analytics API endpoint
      // For now, we'll simulate the data
      const mockData: AnalyticsData = {
        totalClients: 45,
        activeClients: 38,
        totalAppointments: 156,
        completedAppointments: 142,
        totalRevenue: 12450,
        monthlyRevenue: 2890,
        avgSessionDuration: 52,
        clientRetentionRate: 84.2,
        appointmentsByMonth: [
          { month: 'Jan', appointments: 18, revenue: 1800 },
          { month: 'Feb', appointments: 22, revenue: 2200 },
          { month: 'Mar', appointments: 25, revenue: 2500 },
          { month: 'Apr', appointments: 28, revenue: 2800 },
          { month: 'May', appointments: 31, revenue: 3100 },
          { month: 'Jun', appointments: 32, revenue: 3200 }
        ],
        clientProgress: [
          { clientName: 'Sarah Johnson', weightLoss: 8.5, adherence: 92 },
          { clientName: 'Mike Chen', weightLoss: 12.2, adherence: 88 },
          { clientName: 'Emma Davis', weightLoss: 6.8, adherence: 95 },
          { clientName: 'John Smith', weightLoss: 15.1, adherence: 85 },
          { clientName: 'Lisa Wilson', weightLoss: 9.3, adherence: 90 }
        ],
        appointmentTypes: [
          { type: 'Initial Consultation', count: 12, revenue: 1800 },
          { type: 'Follow-up', count: 45, revenue: 4500 },
          { type: 'Nutrition Review', count: 28, revenue: 2800 },
          { type: 'Meal Planning', count: 35, revenue: 3500 }
        ],
        revenueByMonth: [
          { month: 'Jan', revenue: 1800 },
          { month: 'Feb', revenue: 2200 },
          { month: 'Mar', revenue: 2500 },
          { month: 'Apr', revenue: 2800 },
          { month: 'May', revenue: 3100 },
          { month: 'Jun', revenue: 3200 }
        ]
      };

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      setAnalytics(mockData);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#16a34a', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner />
        </div>
      </DashboardLayout>
    );
  }

  if (!analytics) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <Card>
            <CardContent className="text-center py-12">
              <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Analytics Data</h3>
              <p className="text-gray-600">Analytics data is not available at the moment.</p>
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="text-gray-600 mt-1">Track your practice performance and client progress</p>
          </div>
          
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1month">Last Month</SelectItem>
              <SelectItem value="3months">Last 3 Months</SelectItem>
              <SelectItem value="6months">Last 6 Months</SelectItem>
              <SelectItem value="1year">Last Year</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center space-x-2">
                <Users className="h-5 w-5 text-blue-600" />
                <span>Total Clients</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-600">{analytics.totalClients}</p>
              <p className="text-sm text-gray-600">
                {analytics.activeClients} active clients
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-green-600" />
                <span>Appointments</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">{analytics.totalAppointments}</p>
              <p className="text-sm text-gray-600">
                {analytics.completedAppointments} completed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center space-x-2">
                <DollarSign className="h-5 w-5 text-purple-600" />
                <span>Total Revenue</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-purple-600">
                ${analytics.totalRevenue.toLocaleString()}
              </p>
              <p className="text-sm text-gray-600">
                ${analytics.monthlyRevenue} this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center space-x-2">
                <Target className="h-5 w-5 text-orange-600" />
                <span>Retention Rate</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-orange-600">
                {analytics.clientRetentionRate}%
              </p>
              <p className="text-sm text-gray-600">Client retention</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Appointments & Revenue Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Appointments & Revenue Trend</CardTitle>
              <CardDescription>Monthly appointments and revenue over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analytics.appointmentsByMonth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="appointments"
                      stackId="1"
                      stroke="#16a34a"
                      fill="#16a34a"
                      fillOpacity={0.6}
                    />
                    <Area
                      yAxisId="right"
                      type="monotone"
                      dataKey="revenue"
                      stackId="2"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.6}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Appointment Types Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Appointment Types</CardTitle>
              <CardDescription>Distribution of appointment types</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics.appointmentTypes}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ type, percent }) => `${type}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {analytics.appointmentTypes.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue by Month */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Revenue</CardTitle>
              <CardDescription>Revenue growth over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analytics.revenueByMonth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`$${value}`, 'Revenue']} />
                    <Line 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#16a34a" 
                      strokeWidth={3}
                      dot={{ fill: '#16a34a', strokeWidth: 2, r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Top Client Progress */}
          <Card>
            <CardHeader>
              <CardTitle>Client Progress Leaders</CardTitle>
              <CardDescription>Top performing clients by weight loss</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.clientProgress.map((client, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-green-100 text-green-800 rounded-full flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{client.clientName}</p>
                        <p className="text-sm text-gray-600">
                          {client.adherence}% adherence rate
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">
                        -{client.weightLoss} kg
                      </p>
                      <p className="text-xs text-gray-500">weight loss</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center space-x-2">
                <Clock className="h-5 w-5 text-blue-600" />
                <span>Avg Session Duration</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-blue-600">
                {analytics.avgSessionDuration} min
              </p>
              <p className="text-sm text-gray-600">Average consultation time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <span>Success Rate</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">91%</p>
              <p className="text-sm text-gray-600">Clients achieving goals</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center space-x-2">
                <Award className="h-5 w-5 text-purple-600" />
                <span>Client Satisfaction</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-purple-600">4.8/5</p>
              <p className="text-sm text-gray-600">Average rating</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
