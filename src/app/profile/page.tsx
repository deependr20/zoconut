'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import FileUpload from '@/components/ui/file-upload';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  User, 
  Camera,
  Save,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Activity,
  Target,
  Heart,
  Award,
  CheckCircle,
  AlertCircle,
  Edit
} from 'lucide-react';
import { format } from 'date-fns';

interface UserProfile {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatar?: string;
  bio?: string;
  role: string;
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
  // Dietitian specific
  credentials?: string[];
  specializations?: string[];
  experience?: number;
  consultationFee?: number;
  createdAt: string;
}

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/users/${session?.user?.id}`);
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!profile) return;

    setSaving(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profile),
      });

      if (response.ok) {
        const updatedProfile = await response.json();
        setProfile(updatedProfile);
        setMessage('Profile updated successfully');
        setEditing(false);
        
        // Update session if avatar changed
        if (updatedProfile.avatar !== session?.user?.avatar) {
          await update({
            ...session,
            user: {
              ...session?.user,
              avatar: updatedProfile.avatar
            }
          });
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = (url: string) => {
    if (profile) {
      setProfile({ ...profile, avatar: url });
    }
  };

  const updateField = (field: keyof UserProfile, value: any) => {
    if (profile) {
      setProfile({ ...profile, [field]: value });
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

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'client':
        return 'bg-blue-100 text-blue-800';
      case 'dietitian':
        return 'bg-green-100 text-green-800';
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
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

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner />
        </div>
      </DashboardLayout>
    );
  }

  if (!profile) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <Card>
            <CardContent className="text-center py-12">
              <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Profile Not Found</h3>
              <p className="text-gray-600">Unable to load your profile information.</p>
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
            <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
            <p className="text-gray-600 mt-1">View and manage your profile information</p>
          </div>
          
          <div className="flex space-x-2">
            {!editing ? (
              <Button onClick={() => setEditing(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            ) : (
              <div className="flex space-x-2">
                <Button variant="outline" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <>
                      <LoadingSpinner className="mr-2 h-4 w-4" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            )}
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
          {/* Profile Overview */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Profile Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar */}
              <div className="flex flex-col items-center space-y-4">
                <Avatar className="h-32 w-32">
                  <AvatarImage src={profile.avatar} />
                  <AvatarFallback className="text-2xl">
                    {profile.firstName[0]}{profile.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                
                {editing && (
                  <FileUpload
                    type="avatar"
                    onUpload={handleAvatarUpload}
                  >
                    <Button variant="outline" size="sm">
                      <Camera className="h-4 w-4 mr-2" />
                      Change Photo
                    </Button>
                  </FileUpload>
                )}
                
                <div className="text-center">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {profile.firstName} {profile.lastName}
                  </h2>
                  <div className="flex items-center justify-center space-x-2 mt-2">
                    <Badge className={getRoleColor(profile.role)}>
                      {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
                    </Badge>
                    <Badge className={getStatusColor(profile.status)}>
                      {profile.status}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="space-y-3 pt-4 border-t">
                <div className="flex items-center space-x-2 text-sm">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span>{profile.email}</span>
                </div>
                
                {profile.phone && (
                  <div className="flex items-center space-x-2 text-sm">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span>{profile.phone}</span>
                  </div>
                )}
                
                <div className="flex items-center space-x-2 text-sm">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span>Joined {format(new Date(profile.createdAt), 'MMMM yyyy')}</span>
                </div>
                
                {profile.dateOfBirth && (
                  <div className="flex items-center space-x-2 text-sm">
                    <User className="h-4 w-4 text-gray-400" />
                    <span>{calculateAge(profile.dateOfBirth)} years old</span>
                  </div>
                )}
              </div>

              {/* Bio */}
              {profile.bio && (
                <div className="pt-4 border-t">
                  <h4 className="font-medium text-gray-900 mb-2">About</h4>
                  <p className="text-sm text-gray-600">{profile.bio}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Detailed Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Your personal details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    {editing ? (
                      <Input
                        id="firstName"
                        value={profile.firstName}
                        onChange={(e) => updateField('firstName', e.target.value)}
                      />
                    ) : (
                      <p className="mt-1 text-sm text-gray-900">{profile.firstName}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    {editing ? (
                      <Input
                        id="lastName"
                        value={profile.lastName}
                        onChange={(e) => updateField('lastName', e.target.value)}
                      />
                    ) : (
                      <p className="mt-1 text-sm text-gray-900">{profile.lastName}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="email">Email</Label>
                    {editing ? (
                      <Input
                        id="email"
                        type="email"
                        value={profile.email}
                        onChange={(e) => updateField('email', e.target.value)}
                      />
                    ) : (
                      <p className="mt-1 text-sm text-gray-900">{profile.email}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    {editing ? (
                      <Input
                        id="phone"
                        value={profile.phone || ''}
                        onChange={(e) => updateField('phone', e.target.value)}
                        placeholder="Enter phone number"
                      />
                    ) : (
                      <p className="mt-1 text-sm text-gray-900">{profile.phone || 'Not provided'}</p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="bio">Bio</Label>
                  {editing ? (
                    <Textarea
                      id="bio"
                      value={profile.bio || ''}
                      onChange={(e) => updateField('bio', e.target.value)}
                      rows={3}
                      placeholder="Tell us about yourself..."
                    />
                  ) : (
                    <p className="mt-1 text-sm text-gray-900">{profile.bio || 'No bio provided'}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Health Information (for clients) */}
            {profile.role === 'client' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Heart className="h-5 w-5 text-red-500" />
                    <span>Health Information</span>
                  </CardTitle>
                  <CardDescription>Your health profile and goals</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="dateOfBirth">Date of Birth</Label>
                      {editing ? (
                        <Input
                          id="dateOfBirth"
                          type="date"
                          value={profile.dateOfBirth || ''}
                          onChange={(e) => updateField('dateOfBirth', e.target.value)}
                        />
                      ) : (
                        <p className="mt-1 text-sm text-gray-900">
                          {profile.dateOfBirth ? format(new Date(profile.dateOfBirth), 'MMMM d, yyyy') : 'Not provided'}
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <Label htmlFor="gender">Gender</Label>
                      {editing ? (
                        <Select
                          value={profile.gender || 'none'}
                          onValueChange={(value) => updateField('gender', value === 'none' ? '' : value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Prefer not to say</SelectItem>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className="mt-1 text-sm text-gray-900 capitalize">
                          {profile.gender || 'Not provided'}
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <Label htmlFor="activityLevel">Activity Level</Label>
                      {editing ? (
                        <Select
                          value={profile.activityLevel || 'none'}
                          onValueChange={(value) => updateField('activityLevel', value === 'none' ? '' : value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select activity level" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Not specified</SelectItem>
                            <SelectItem value="sedentary">Sedentary</SelectItem>
                            <SelectItem value="lightly_active">Lightly Active</SelectItem>
                            <SelectItem value="moderately_active">Moderately Active</SelectItem>
                            <SelectItem value="very_active">Very Active</SelectItem>
                            <SelectItem value="extremely_active">Extremely Active</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className="mt-1 text-sm text-gray-900">
                          {profile.activityLevel ? profile.activityLevel.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Not provided'}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="height">Height (cm)</Label>
                      {editing ? (
                        <Input
                          id="height"
                          type="number"
                          value={profile.height || ''}
                          onChange={(e) => updateField('height', parseFloat(e.target.value) || undefined)}
                          placeholder="170"
                        />
                      ) : (
                        <p className="mt-1 text-sm text-gray-900">
                          {profile.height ? `${profile.height} cm` : 'Not provided'}
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <Label htmlFor="weight">Weight (kg)</Label>
                      {editing ? (
                        <Input
                          id="weight"
                          type="number"
                          value={profile.weight || ''}
                          onChange={(e) => updateField('weight', parseFloat(e.target.value) || undefined)}
                          placeholder="70"
                        />
                      ) : (
                        <p className="mt-1 text-sm text-gray-900">
                          {profile.weight ? `${profile.weight} kg` : 'Not provided'}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Health Goals */}
                  <div>
                    <Label>Health Goals</Label>
                    <div className="mt-2">
                      {profile.healthGoals && profile.healthGoals.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {profile.healthGoals.map((goal, index) => (
                            <Badge key={index} variant="outline">
                              {goal}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No health goals specified</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Professional Information (for dietitians) */}
            {profile.role === 'dietitian' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Award className="h-5 w-5 text-green-500" />
                    <span>Professional Information</span>
                  </CardTitle>
                  <CardDescription>Your professional credentials and experience</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="experience">Years of Experience</Label>
                      {editing ? (
                        <Input
                          id="experience"
                          type="number"
                          value={profile.experience || ''}
                          onChange={(e) => updateField('experience', parseInt(e.target.value) || undefined)}
                          placeholder="5"
                        />
                      ) : (
                        <p className="mt-1 text-sm text-gray-900">
                          {profile.experience ? `${profile.experience} years` : 'Not provided'}
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <Label htmlFor="consultationFee">Consultation Fee ($)</Label>
                      {editing ? (
                        <Input
                          id="consultationFee"
                          type="number"
                          value={profile.consultationFee || ''}
                          onChange={(e) => updateField('consultationFee', parseFloat(e.target.value) || undefined)}
                          placeholder="100"
                        />
                      ) : (
                        <p className="mt-1 text-sm text-gray-900">
                          {profile.consultationFee ? `$${profile.consultationFee}` : 'Not set'}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Specializations */}
                  <div>
                    <Label>Specializations</Label>
                    <div className="mt-2">
                      {profile.specializations && profile.specializations.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {profile.specializations.map((spec, index) => (
                            <Badge key={index} variant="outline" className="bg-green-50 text-green-700">
                              {spec}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No specializations listed</p>
                      )}
                    </div>
                  </div>

                  {/* Credentials */}
                  <div>
                    <Label>Credentials</Label>
                    <div className="mt-2">
                      {profile.credentials && profile.credentials.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {profile.credentials.map((credential, index) => (
                            <Badge key={index} variant="outline" className="bg-blue-50 text-blue-700">
                              {credential}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No credentials listed</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
