import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import connectDB from '@/lib/db/connection';
import Appointment from '@/lib/db/models/Appointment';
import { UserRole, AppointmentStatus } from '@/types';

// GET /api/appointments - Get appointments for current user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const date = searchParams.get('date');
    const limit = parseInt(searchParams.get('limit') || '10');
    const page = parseInt(searchParams.get('page') || '1');

    // Build query based on user role
    let query: any = {};
    if (session.user.role === UserRole.DIETITIAN) {
      query.dietitian = session.user.id;
    } else if (session.user.role === UserRole.CLIENT) {
      query.client = session.user.id;
    } else {
      // Admin can see all appointments
    }

    // Add filters
    if (status) {
      query.status = status;
    }

    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1);
      query.scheduledAt = {
        $gte: startDate,
        $lt: endDate
      };
    }

    const appointments = await Appointment.find(query)
      .populate('dietitian', 'firstName lastName email avatar')
      .populate('client', 'firstName lastName email avatar')
      .sort({ scheduledAt: 1 })
      .limit(limit)
      .skip((page - 1) * limit);

    const total = await Appointment.countDocuments(query);

    return NextResponse.json({
      appointments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching appointments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch appointments' },
      { status: 500 }
    );
  }
}

// POST /api/appointments - Create new appointment
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { dietitianId, clientId, scheduledAt, duration, type, notes } = body;

    await connectDB();

    // Validate required fields
    if (!dietitianId || !clientId || !scheduledAt) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check for scheduling conflicts
    const conflicts = await Appointment.findConflicts(
      dietitianId,
      new Date(scheduledAt),
      duration || 60
    );

    if (conflicts.length > 0) {
      return NextResponse.json(
        { error: 'Time slot conflicts with existing appointment' },
        { status: 409 }
      );
    }

    // Create appointment
    const appointment = new Appointment({
      dietitian: dietitianId,
      client: clientId,
      scheduledAt: new Date(scheduledAt),
      duration: duration || 60,
      type,
      notes,
      status: AppointmentStatus.SCHEDULED
    });

    await appointment.save();

    // Populate the created appointment
    await appointment.populate('dietitian', 'firstName lastName email avatar');
    await appointment.populate('client', 'firstName lastName email avatar');

    return NextResponse.json(appointment, { status: 201 });

  } catch (error) {
    console.error('Error creating appointment:', error);
    return NextResponse.json(
      { error: 'Failed to create appointment' },
      { status: 500 }
    );
  }
}
