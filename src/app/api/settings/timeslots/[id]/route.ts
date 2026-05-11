import { NextResponse } from 'next/server';
import prisma from '../../../../../lib/prisma';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const timeSlot = await prisma.timeSlot.findUnique({
      where: { id: params.id },
    });
    if (!timeSlot) {
      return NextResponse.json({ error: 'Time slot not found' }, { status: 404 });
    }
    return NextResponse.json(timeSlot);
  } catch (error) {
    console.error('Error fetching time slot:', error);
    return NextResponse.json({ error: 'Failed to fetch time slot' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const { label, startTime, endTime } = body;

    const updatedTimeSlot = await prisma.timeSlot.update({
      where: { id: params.id },
      data: { label, startTime, endTime },
    });
    return NextResponse.json(updatedTimeSlot);
  } catch (error) {
    console.error('Error updating time slot:', error);
    return NextResponse.json({ error: 'Failed to update time slot' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    await prisma.timeSlot.delete({
      where: { id: params.id },
    });
    return NextResponse.json({ message: 'Time slot deleted successfully' });
  } catch (error) {
    console.error('Error deleting time slot:', error);
    return NextResponse.json({ error: 'Failed to delete time slot' }, { status: 500 });
  }
}
