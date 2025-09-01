import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import connectDB from '@/lib/db/connection';
import Appointment from '@/lib/db/models/Appointment';
import { UserRole, AppointmentStatus } from '@/types';

// GET /api/appointments/[id] - Get specific appointment
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const appointment = await Appointment.findById(params.id)
      .populate('dietitian', 'firstName lastName email avatar')
      .populate('client', 'firstName lastName email avatar');

    if (!appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    // Check if user has access to this appointment
    const hasAccess = 
      session.user.role === UserRole.ADMIN ||
      appointment.dietitian._id.toString() === session.user.id ||
      appointment.client._id.toString() === session.user.id;

    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(appointment);

  } catch (error) {
    console.error('Error fetching appointment:', error);
    return NextResponse.json(
      { error: 'Failed to fetch appointment' },
      { status: 500 }
    );
  }
}

// PUT /api/appointments/[id] - Update appointment
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    await connectDB();

    const appointment = await Appointment.findById(params.id);
    if (!appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    // Check if user can update this appointment
    const canUpdate = 
      session.user.role === UserRole.ADMIN ||
      appointment.dietitian.toString() === session.user.id ||
      (appointment.client.toString() === session.user.id && 
       ['notes'].some(field => field in body)); // Clients can only update notes

    if (!canUpdate) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // If updating schedule, check for conflicts
    if (body.scheduledAt || body.duration) {
      const newScheduledAt = body.scheduledAt ? new Date(body.scheduledAt) : appointment.scheduledAt;
      const newDuration = body.duration || appointment.duration;

      const conflicts = await Appointment.findConflicts(
        appointment.dietitian.toString(),
        newScheduledAt,
        newDuration,
        params.id
      );

      if (conflicts.length > 0) {
        return NextResponse.json(
          { error: 'Time slot conflicts with existing appointment' },
          { status: 409 }
        );
      }
    }

    // Update appointment
    Object.assign(appointment, body);
    await appointment.save();

    // Populate and return updated appointment
    await appointment.populate('dietitian', 'firstName lastName email avatar');
    await appointment.populate('client', 'firstName lastName email avatar');

    return NextResponse.json(appointment);

  } catch (error) {
    console.error('Error updating appointment:', error);
    return NextResponse.json(
      { error: 'Failed to update appointment' },
      { status: 500 }
    );
  }
}

// DELETE /api/appointments/[id] - Cancel appointment
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const appointment = await Appointment.findById(params.id);
    if (!appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    // Check if user can cancel this appointment
    const canCancel = 
      session.user.role === UserRole.ADMIN ||
      appointment.dietitian.toString() === session.user.id ||
      appointment.client.toString() === session.user.id;

    if (!canCancel) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Update status to cancelled instead of deleting
    appointment.status = AppointmentStatus.CANCELLED;
    await appointment.save();

    return NextResponse.json({ message: 'Appointment cancelled successfully' });

  } catch (error) {
    console.error('Error cancelling appointment:', error);
    return NextResponse.json(
      { error: 'Failed to cancel appointment' },
      { status: 500 }
    );
  }
}
