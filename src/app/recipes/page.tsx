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
  Clock,
  Users,
  Filter
} from 'lucide-react';
import Link from 'next/link';

interface Recipe {
  _id: string;
  name: string;
  description: string;
  calories: number;
  macros: {
    protein: number;
    carbs: number;
    fat: number;
  };
  prepTime: number;
  cookTime: number;
  servings: number;
  category: string;
  dietaryRestrictions: string[];
  createdBy: {
    firstName: string;
    lastName: string;
  };
  createdAt: string;
}

export default function RecipesPage() {
  const { data: session } = useSession();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [maxCalories, setMaxCalories] = useState('');

  useEffect(() => {
    fetchRecipes();
  }, [searchTerm, selectedCategory, maxCalories]);

  const fetchRecipes = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedCategory && selectedCategory !== 'all') params.append('category', selectedCategory);
      if (maxCalories) params.append('maxCalories', maxCalories);
      
      const response = await fetch(`/api/recipes?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setRecipes(data.recipes);
        setCategories(data.categories);
      }
    } catch (error) {
      console.error('Error fetching recipes:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDietaryRestrictionColor = (restriction: string) => {
    const colors: { [key: string]: string } = {
      'vegetarian': 'bg-green-100 text-green-800',
      'vegan': 'bg-green-100 text-green-800',
      'gluten-free': 'bg-blue-100 text-blue-800',
      'dairy-free': 'bg-purple-100 text-purple-800',
      'keto': 'bg-orange-100 text-orange-800',
      'low-carb': 'bg-yellow-100 text-yellow-800',
    };
    return colors[restriction.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Recipe Database</h1>
            <p className="text-gray-600 mt-1">
              Manage your collection of healthy recipes
            </p>
          </div>
          
          <Button asChild>
            <Link href="/recipes/create">
              <Plus className="h-4 w-4 mr-2" />
              Add Recipe
            </Link>
          </Button>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search recipes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Input
                type="number"
                placeholder="Max calories"
                value={maxCalories}
                onChange={(e) => setMaxCalories(e.target.value)}
              />
              
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <ChefHat className="h-4 w-4" />
                <span>{recipes.length} recipes</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recipes Grid */}
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <LoadingSpinner />
          </div>
        ) : recipes.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <ChefHat className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm || (selectedCategory && selectedCategory !== 'all') || maxCalories ? 'No recipes found' : 'No recipes yet'}
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || (selectedCategory && selectedCategory !== 'all') || maxCalories
                  ? 'Try adjusting your search criteria'
                  : 'Start building your recipe database by adding your first recipe'
                }
              </p>
              {!searchTerm && (!selectedCategory || selectedCategory === 'all') && !maxCalories && (
                <Button asChild>
                  <Link href="/recipes/create">Add Your First Recipe</Link>
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recipes.map((recipe) => (
              <Card key={recipe._id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg line-clamp-2">{recipe.name}</CardTitle>
                      <CardDescription className="line-clamp-2 mt-1">
                        {recipe.description}
                      </CardDescription>
                    </div>
                    {recipe.category && (
                      <Badge variant="outline" className="ml-2">
                        {recipe.category}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Nutrition Info */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="text-center p-2 bg-gray-50 rounded">
                      <p className="font-semibold text-lg">{recipe.calories}</p>
                      <p className="text-gray-600">Calories</p>
                    </div>
                    <div className="text-center p-2 bg-gray-50 rounded">
                      <p className="font-semibold text-lg">{recipe.servings}</p>
                      <p className="text-gray-600">Servings</p>
                    </div>
                  </div>

                  {/* Macros */}
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="text-center">
                      <p className="font-medium text-blue-600">{recipe.macros.protein}g</p>
                      <p className="text-gray-600">Protein</p>
                    </div>
                    <div className="text-center">
                      <p className="font-medium text-orange-600">{recipe.macros.carbs}g</p>
                      <p className="text-gray-600">Carbs</p>
                    </div>
                    <div className="text-center">
                      <p className="font-medium text-purple-600">{recipe.macros.fat}g</p>
                      <p className="text-gray-600">Fat</p>
                    </div>
                  </div>

                  {/* Time Info */}
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>{recipe.prepTime + recipe.cookTime} min</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Users className="h-3 w-3" />
                      <span>Dr. {recipe.createdBy.firstName} {recipe.createdBy.lastName}</span>
                    </div>
                  </div>

                  {/* Dietary Restrictions */}
                  {recipe.dietaryRestrictions && recipe.dietaryRestrictions.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {recipe.dietaryRestrictions.slice(0, 3).map((restriction, index) => (
                        <Badge 
                          key={index} 
                          className={`text-xs ${getDietaryRestrictionColor(restriction)}`}
                        >
                          {restriction}
                        </Badge>
                      ))}
                      {recipe.dietaryRestrictions.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{recipe.dietaryRestrictions.length - 3} more
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Action Button */}
                  <Button variant="outline" className="w-full" asChild>
                    <Link href={`/recipes/${recipe._id}`}>
                      View Recipe
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
