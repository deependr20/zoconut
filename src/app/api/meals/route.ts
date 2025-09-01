import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import connectDB from '@/lib/db/connection';
import MealPlan from '@/lib/db/models/MealPlan';
import { UserRole } from '@/types';

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
    const { clientId, name, description, startDate, endDate, meals, targetCalories, targetMacros } = body;

    await connectDB();

    // Validate required fields
    if (!clientId || !name || !startDate || !endDate || !meals) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create meal plan
    const mealPlan = new MealPlan({
      dietitian: session.user.id,
      client: clientId,
      name,
      description,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      meals,
      targetCalories,
      targetMacros,
      isActive: true
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
