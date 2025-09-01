import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import connectDB from '@/lib/db/connection';
import FoodLog from '@/lib/db/models/FoodLog';
import { UserRole } from '@/types';

// GET /api/food-logs - Get food logs
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const clientId = searchParams.get('clientId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '50');
    const page = parseInt(searchParams.get('page') || '1');

    // Build query based on user role
    let query: any = {};
    
    if (session.user.role === UserRole.CLIENT) {
      query.user = session.user.id;
    } else if (session.user.role === UserRole.DIETITIAN) {
      if (clientId) {
        query.user = clientId;
      } else {
        // Get all clients assigned to this dietitian
        // This would require a separate query to get client IDs
        return NextResponse.json(
          { error: 'Client ID required for dietitian' },
          { status: 400 }
        );
      }
    } else {
      // Admin can see all logs
      if (clientId) {
        query.user = clientId;
      }
    }

    // Date filtering
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      query.loggedAt = {
        $gte: startOfDay,
        $lte: endOfDay
      };
    } else if (startDate && endDate) {
      query.loggedAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const foodLogs = await FoodLog.find(query)
      .populate('user', 'firstName lastName')
      .populate('recipe', 'name calories macros')
      .sort({ loggedAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit);

    const total = await FoodLog.countDocuments(query);

    // Calculate daily totals if querying for a specific date
    let dailyTotals = null;
    if (date) {
      const dailyLogs = await FoodLog.find(query);
      dailyTotals = dailyLogs.reduce((totals, log) => {
        totals.calories += log.calories || 0;
        totals.protein += log.macros?.protein || 0;
        totals.carbs += log.macros?.carbs || 0;
        totals.fat += log.macros?.fat || 0;
        return totals;
      }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
    }

    return NextResponse.json({
      foodLogs,
      dailyTotals,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching food logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch food logs' },
      { status: 500 }
    );
  }
}

// POST /api/food-logs - Create new food log entry
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      foodName, 
      quantity, 
      unit, 
      calories, 
      macros, 
      mealType, 
      recipe,
      loggedAt 
    } = body;

    await connectDB();

    // Validate required fields
    if (!foodName || !quantity || !mealType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create food log entry
    const foodLog = new FoodLog({
      user: session.user.id,
      foodName,
      quantity,
      unit,
      calories,
      macros,
      mealType,
      recipe,
      loggedAt: loggedAt ? new Date(loggedAt) : new Date()
    });

    await foodLog.save();

    // Populate the created food log
    await foodLog.populate('recipe', 'name calories macros');

    return NextResponse.json(foodLog, { status: 201 });

  } catch (error) {
    console.error('Error creating food log:', error);
    return NextResponse.json(
      { error: 'Failed to create food log' },
      { status: 500 }
    );
  }
}
