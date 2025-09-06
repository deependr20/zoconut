import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import connectDB from '@/lib/db/connection';
import MealPlan from '@/lib/db/models/MealPlan';
import { UserRole } from '@/types';
import { z } from 'zod';

// Meal plan validation schema
const mealPlanSchema = z.object({
  name: z.string().min(1, 'Meal plan name is required').max(100, 'Name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  client: z.string().min(1, 'Client ID is required'),
  startDate: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid start date'),
  endDate: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid end date'),
  meals: z.array(z.object({
    day: z.number().min(1).max(7, 'Day must be between 1-7'),
    mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
    recipe: z.string().min(1, 'Recipe ID is required'),
    servings: z.number().min(0.5, 'Servings must be at least 0.5').max(10, 'Servings cannot exceed 10'),
    notes: z.string().optional()
  })).min(1, 'At least one meal is required'),
  targetCalories: z.number().min(800, 'Target calories too low').max(5000, 'Target calories too high').optional(),
  targetMacros: z.object({
    protein: z.number().min(0).max(100).optional(),
    carbs: z.number().min(0).max(100).optional(),
    fat: z.number().min(0).max(100).optional()
  }).optional(),
  notes: z.string().max(1000, 'Notes too long').optional(),
  isActive: z.boolean().optional()
});

// GET /api/meals - Get meal plans
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');
    const active = searchParams.get('active');
    const limit = parseInt(searchParams.get('limit') || '10');
    const page = parseInt(searchParams.get('page') || '1');

    // Build query based on user role
    let query: any = {};
    
    if (session.user.role === UserRole.DIETITIAN) {
      query.dietitian = session.user.id;
      if (clientId) {
        query.client = clientId;
      }
    } else if (session.user.role === UserRole.CLIENT) {
      query.client = session.user.id;
    } else {
      // Admin can see all meal plans
      if (clientId) {
        query.client = clientId;
      }
    }

    // Filter for active meal plans
    if (active === 'true') {
      query.isActive = true;
    }

    const mealPlans = await MealPlan.find(query)
      .populate('dietitian', 'firstName lastName email avatar')
      .populate('client', 'firstName lastName email avatar')
      .populate('meals.recipe', 'name description calories macros')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit);

    const total = await MealPlan.countDocuments(query);

    return NextResponse.json({
      mealPlans,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching meal plans:', error);
    return NextResponse.json(
      { error: 'Failed to fetch meal plans' },
      { status: 500 }
    );
  }
}

// POST /api/meals - Create new meal plan
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only dietitians and admins can create meal plans
    if (session.user.role !== UserRole.DIETITIAN && session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();

    // Validate input
    const validatedData = mealPlanSchema.parse(body);

    await connectDB();

    // Validate date range
    const startDate = new Date(validatedData.startDate);
    const endDate = new Date(validatedData.endDate);

    if (endDate <= startDate) {
      return NextResponse.json(
        { error: 'End date must be after start date' },
        { status: 400 }
      );
    }

    // Create meal plan
    const mealPlan = new MealPlan({
      dietitian: session.user.id,
      client: validatedData.client,
      name: validatedData.name,
      description: validatedData.description,
      startDate,
      endDate,
      meals: validatedData.meals,
      targetCalories: validatedData.targetCalories,
      targetMacros: validatedData.targetMacros,
      isActive: validatedData.isActive ?? true
    });

    await mealPlan.save();

    // Populate the created meal plan
    await mealPlan.populate('dietitian', 'firstName lastName email avatar');
    await mealPlan.populate('client', 'firstName lastName email avatar');
    await mealPlan.populate('meals.recipe', 'name description calories macros');

    return NextResponse.json(mealPlan, { status: 201 });

  } catch (error) {
    console.error('Error creating meal plan:', error);
    return NextResponse.json(
      { error: 'Failed to create meal plan' },
      { status: 500 }
    );
  }
}
