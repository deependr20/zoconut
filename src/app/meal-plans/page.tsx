'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { 
  Search, 
  Plus, 
  ChefHat,
  Calendar,
  Users,
  Target,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

interface MealPlan {
  _id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  targetCalories: number;
  targetMacros: {
    protein: number;
    carbs: number;
    fat: number;
  };
  isActive: boolean;
  client: {
    firstName: string;
    lastName: string;
  };
  dietitian: {
    firstName: string;
    lastName: string;
  };
  createdAt: string;
}

export default function MealPlansPage() {
  const { data: session } = useSession();
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchMealPlans();
  }, []);

  const fetchMealPlans = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/meals');
      if (response.ok) {
        const data = await response.json();
        setMealPlans(data.mealPlans);
      }
    } catch (error) {
      console.error('Error fetching meal plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredMealPlans = mealPlans.filter(plan => {
    const matchesSearch = 
      plan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plan.client.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plan.client.lastName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && plan.isActive) ||
      (statusFilter === 'inactive' && !plan.isActive);
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (isActive: boolean) => {
    return isActive 
      ? 'bg-green-100 text-green-800' 
      : 'bg-gray-100 text-gray-800';
  };

  const isPlanActive = (startDate: string, endDate: string) => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    return now >= start && now <= end;
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Meal Plans</h1>
            <p className="text-gray-600 mt-1">
              Create and manage personalized meal plans for your clients
            </p>
          </div>
          
          <Button asChild>
            <Link href="/meal-plans/create">
              <Plus className="h-4 w-4 mr-2" />
              Create Meal Plan
            </Link>
          </Button>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search meal plans or clients..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <ChefHat className="h-4 w-4" />
                <span>{filteredMealPlans.length} meal plans</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Meal Plans List */}
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <LoadingSpinner />
          </div>
        ) : filteredMealPlans.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <ChefHat className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm || statusFilter !== 'all' ? 'No meal plans found' : 'No meal plans yet'}
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || statusFilter !== 'all'
                  ? 'Try adjusting your search criteria'
                  : 'Start creating personalized meal plans for your clients'
                }
              </p>
              {!searchTerm && statusFilter === 'all' && (
                <Button asChild>
                  <Link href="/meal-plans/create">Create Your First Meal Plan</Link>
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left p-4 font-medium text-gray-900">Plan Name</th>
                      <th className="text-left p-4 font-medium text-gray-900">Client</th>
                      <th className="text-left p-4 font-medium text-gray-900">Duration</th>
                      <th className="text-left p-4 font-medium text-gray-900">Calories</th>
                      <th className="text-left p-4 font-medium text-gray-900">Status</th>
                      <th className="text-left p-4 font-medium text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMealPlans.map((plan) => (
                      <tr key={plan._id} className="border-b hover:bg-gray-50">
                        <td className="p-4">
                          <div>
                            <p className="font-medium text-gray-900">{plan.name}</p>
                            <p className="text-sm text-gray-600 line-clamp-1">{plan.description}</p>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center space-x-2">
                            <Users className="h-4 w-4 text-gray-400" />
                            <span className="text-sm">{plan.client.firstName} {plan.client.lastName}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="text-sm text-gray-600">
                            <div>{format(new Date(plan.startDate), 'MMM d')}</div>
                            <div>to {format(new Date(plan.endDate), 'MMM d, yyyy')}</div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="text-sm">
                            <div className="font-medium">{plan.targetCalories} cal</div>
                            <div className="text-gray-500">
                              P:{plan.targetMacros.protein}g C:{plan.targetMacros.carbs}g F:{plan.targetMacros.fat}g
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex flex-col space-y-1">
                            <Badge className={getStatusColor(plan.isActive)} size="sm">
                              {plan.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                            {isPlanActive(plan.startDate, plan.endDate) && (
                              <div className="flex items-center space-x-1 text-xs text-green-600">
                                <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                                <span>Current</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex space-x-2">
                            <Button size="sm" variant="outline" asChild>
                              <Link href={`/meal-plans/${plan._id}`}>
                                <Eye className="h-3 w-3" />
                              </Link>
                            </Button>
                            <Button size="sm" variant="outline" asChild>
                              <Link href={`/meal-plans/${plan._id}/edit`}>
                                <Edit className="h-3 w-3" />
                              </Link>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
