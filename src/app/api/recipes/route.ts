import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import connectDB from '@/lib/db/connection';
import Recipe from '@/lib/db/models/Recipe';
import { UserRole } from '@/types';
import { z } from 'zod';

// Recipe validation schema
const recipeSchema = z.object({
  name: z.string().min(1, 'Recipe name is required').max(100, 'Name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  ingredients: z.array(z.object({
    name: z.string().min(1, 'Ingredient name is required'),
    amount: z.number().min(0, 'Amount must be positive'),
    unit: z.string().min(1, 'Unit is required')
  })).min(1, 'At least one ingredient is required'),
  instructions: z.array(z.string().min(1, 'Instruction cannot be empty')).min(1, 'At least one instruction is required'),
  prepTime: z.number().min(0, 'Prep time must be positive').optional(),
  cookTime: z.number().min(0, 'Cook time must be positive').optional(),
  servings: z.number().min(1, 'Servings must be at least 1'),
  calories: z.number().min(0, 'Calories must be positive').optional(),
  macros: z.object({
    protein: z.number().min(0).optional(),
    carbs: z.number().min(0).optional(),
    fat: z.number().min(0).optional(),
    fiber: z.number().min(0).optional()
  }).optional(),
  category: z.string().optional(),
  dietaryRestrictions: z.array(z.string()).optional(),
  image: z.string().url('Invalid image URL').optional()
});

// GET /api/recipes - Get recipes
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const category = searchParams.get('category');
    const dietaryRestrictions = searchParams.get('dietaryRestrictions');
    const maxCalories = searchParams.get('maxCalories');
    const limit = parseInt(searchParams.get('limit') || '20');
    const page = parseInt(searchParams.get('page') || '1');

    // Build query
    let query: any = {};

    // Search by name or description
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { 'ingredients.name': { $regex: search, $options: 'i' } }
      ];
    }

    // Filter by category
    if (category) {
      query.category = category;
    }

    // Filter by dietary restrictions
    if (dietaryRestrictions) {
      const restrictions = dietaryRestrictions.split(',');
      query.dietaryRestrictions = { $in: restrictions };
    }

    // Filter by max calories
    if (maxCalories) {
      query.calories = { $lte: parseInt(maxCalories) };
    }

    const recipes = await Recipe.find(query)
      .populate('createdBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit);

    const total = await Recipe.countDocuments(query);

    // Get unique categories for filtering
    const categories = await Recipe.distinct('category');

    return NextResponse.json({
      recipes,
      categories,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching recipes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recipes' },
      { status: 500 }
    );
  }
}

// POST /api/recipes - Create new recipe
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only dietitians and admins can create recipes
    if (session.user.role !== UserRole.DIETITIAN && session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();

    // Validate input
    const validatedData = recipeSchema.parse(body);

    await connectDB();

    // Create recipe
    const recipe = new Recipe({
      ...validatedData,
      createdBy: session.user.id
    });

    await recipe.save();

    // Populate the created recipe
    await recipe.populate('createdBy', 'firstName lastName');

    return NextResponse.json(recipe, { status: 201 });

  } catch (error) {
    console.error('Error creating recipe:', error);
    return NextResponse.json(
      { error: 'Failed to create recipe' },
      { status: 500 }
    );
  }
}
