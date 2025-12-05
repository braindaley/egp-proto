import { NextResponse } from 'next/server';
import { getOfficeHolderById } from '@/lib/ballotready-api';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json(
      { error: 'Office holder ID is required' },
      { status: 400 }
    );
  }

  try {
    const response = await getOfficeHolderById(id);

    if (!response.success) {
      return NextResponse.json(
        { error: response.error || 'Failed to fetch office holder' },
        { status: 500 }
      );
    }

    if (!response.officeHolder) {
      return NextResponse.json(
        { error: 'Office holder not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      officeHolder: response.officeHolder,
    });
  } catch (err: any) {
    console.error('Error in ballot-officials/[id] API route:', err);
    return NextResponse.json(
      { error: 'Internal server error', details: err.message },
      { status: 500 }
    );
  }
}
