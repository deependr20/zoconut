import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import connectDB from '@/lib/db/connection';
import User from '@/lib/db/models/User';
import Appointment from '@/lib/db/models/Appointment';
import { UserRole } from '@/types';

// GET /api/appointments/available-slots - Get available time slots for a dietitian
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const dietitianId = searchParams.get('dietitianId');
    const date = searchParams.get('date'); // YYYY-MM-DD format
    const duration = parseInt(searchParams.get('duration') || '60'); // minutes

    if (!dietitianId || !date) {
      return NextResponse.json(
        { error: 'dietitianId and date are required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Get dietitian's availability
    const dietitian = await User.findById(dietitianId).select('availability');
    
    if (!dietitian || dietitian.role !== UserRole.DIETITIAN) {
      return NextResponse.json({ error: 'Dietitian not found' }, { status: 404 });
    }

    const availability = dietitian.availability;
    if (!availability || !availability.schedule) {
      return NextResponse.json({ availableSlots: [] });
    }

    // Parse the requested date
    const requestedDate = new Date(date);
    const dayOfWeek = requestedDate.getDay(); // 0 = Sunday, 6 = Saturday

    // Find the schedule for this day of week
    const daySchedule = availability.schedule.find((s: any) => s.dayOfWeek === dayOfWeek);
    if (!daySchedule || !daySchedule.timeSlots) {
      return NextResponse.json({ availableSlots: [] });
    }

    // Get existing appointments for this date
    const startOfDay = new Date(requestedDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(requestedDate);
    endOfDay.setHours(23, 59, 59, 999);

    const existingAppointments = await Appointment.find({
      dietitian: dietitianId,
      scheduledAt: {
        $gte: startOfDay,
        $lte: endOfDay
      },
      status: { $in: ['scheduled', 'confirmed'] }
    }).select('scheduledAt duration');

    // Generate available time slots
    const availableSlots: string[] = [];
    const consultationDuration = duration || availability.consultationDuration || 60;
    const bufferTime = availability.bufferTime || 15;

    for (const timeSlot of daySchedule.timeSlots) {
      if (!timeSlot.isAvailable) continue;

      const [startHour, startMinute] = timeSlot.startTime.split(':').map(Number);
      const [endHour, endMinute] = timeSlot.endTime.split(':').map(Number);

      const slotStart = new Date(requestedDate);
      slotStart.setHours(startHour, startMinute, 0, 0);

      const slotEnd = new Date(requestedDate);
      slotEnd.setHours(endHour, endMinute, 0, 0);

      // Generate time slots within this time range
      let currentTime = new Date(slotStart);
      
      while (currentTime.getTime() + (consultationDuration * 60 * 1000) <= slotEnd.getTime()) {
        const appointmentEnd = new Date(currentTime.getTime() + (consultationDuration * 60 * 1000));
        
        // Check if this slot conflicts with existing appointments
        const hasConflict = existingAppointments.some(appointment => {
          const appointmentStart = new Date(appointment.scheduledAt);
          const appointmentEndTime = new Date(appointmentStart.getTime() + (appointment.duration * 60 * 1000));
          
          // Check for overlap (including buffer time)
          const bufferStart = new Date(currentTime.getTime() - (bufferTime * 60 * 1000));
          const bufferEnd = new Date(appointmentEnd.getTime() + (bufferTime * 60 * 1000));
          
          return (bufferStart < appointmentEndTime && bufferEnd > appointmentStart);
        });

        if (!hasConflict) {
          // Check if slot is not in the past
          const now = new Date();
          if (currentTime > now) {
            const timeString = currentTime.toTimeString().slice(0, 5); // HH:MM format
            availableSlots.push(timeString);
          }
        }

        // Move to next slot (every 15 minutes)
        currentTime = new Date(currentTime.getTime() + (15 * 60 * 1000));
      }
    }

    return NextResponse.json({
      date,
      dietitianId,
      duration: consultationDuration,
      availableSlots: availableSlots.sort(),
      timezone: availability.timezone || 'UTC'
    });

  } catch (error) {
    console.error('Error fetching available slots:', error);
    return NextResponse.json(
      { error: 'Failed to fetch available slots' },
      { status: 500 }
    );
  }
}
