import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';

export async function GET() {
  try {
    const timeSlots = await prisma.timeSlot.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(timeSlots);
  } catch (error) {
    console.error('Error fetching time slots:', error);
    return NextResponse.json({ error: 'Failed to fetch time slots' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { label, startTime, endTime } = body;
    
    if (!label || !startTime || !endTime) {
      return NextResponse.json({ error: 'Label, start time, and end time are required' }, { status: 400 });
    }

    const newTimeSlot = await prisma.timeSlot.create({
      data: { label, startTime, endTime },
    });
    return NextResponse.json(newTimeSlot, { status: 201 });
  } catch (error) {
    console.error('Error creating time slot:', error);
    return NextResponse.json({ error: 'Failed to create time slot' }, { status: 500 });
  }
}
