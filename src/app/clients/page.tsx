'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { 
  Search, 
  Plus, 
  Users,
  MessageCircle,
  Calendar,
  TrendingUp,
  Eye
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

interface Client {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
  phone?: string;
  status: string;
  createdAt: string;
  healthGoals?: string[];
  lastAppointment?: string;
  nextAppointment?: string;
}

export default function ClientsPage() {
  const { data: session } = useSession();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/users?role=client');
      if (response.ok) {
        const data = await response.json();
        setClients(data.users);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredClients = clients.filter(client =>
    client.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Clients</h1>
            <p className="text-gray-600 mt-1">
              Manage and monitor your client relationships
            </p>
          </div>
          
          <Button asChild>
            <Link href="/clients/new">
              <Plus className="h-4 w-4 mr-2" />
              Add Client
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
                  placeholder="Search clients by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Users className="h-4 w-4" />
                <span>{filteredClients.length} clients</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Clients List */}
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <LoadingSpinner />
          </div>
        ) : filteredClients.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? 'No clients found' : 'No clients yet'}
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm 
                  ? 'Try adjusting your search terms'
                  : 'Start building your client base by adding your first client'
                }
              </p>
              {!searchTerm && (
                <Button asChild>
                  <Link href="/clients/new">Add Your First Client</Link>
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClients.map((client) => (
              <Card key={client._id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={client.avatar} />
                        <AvatarFallback>
                          {client.firstName[0]}{client.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div>
                        <CardTitle className="text-lg">
                          {client.firstName} {client.lastName}
                        </CardTitle>
                        <CardDescription>{client.email}</CardDescription>
                      </div>
                    </div>
                    
                    <Badge className={getStatusColor(client.status)}>
                      {client.status}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Client Info */}
                  <div className="space-y-2 text-sm">
                    {client.phone && (
                      <p className="text-gray-600">📞 {client.phone}</p>
                    )}
                    
                    <p className="text-gray-600">
                      📅 Joined {format(new Date(client.createdAt), 'MMM d, yyyy')}
                    </p>
                    
                    {client.healthGoals && client.healthGoals.length > 0 && (
                      <div>
                        <p className="text-gray-600 mb-1">🎯 Goals:</p>
                        <div className="flex flex-wrap gap-1">
                          {client.healthGoals.slice(0, 2).map((goal, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {goal}
                            </Badge>
                          ))}
                          {client.healthGoals.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{client.healthGoals.length - 2} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline" className="flex-1" asChild>
                      <Link href={`/clients/${client._id}`}>
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Link>
                    </Button>
                    
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/messages?user=${client._id}`}>
                        <MessageCircle className="h-3 w-3" />
                      </Link>
                    </Button>
                    
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/appointments/book?client=${client._id}`}>
                        <Calendar className="h-3 w-3" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
