import { NextRequest, NextResponse } from 'next/server';
import { uploadHero } from '@/app/actions/dashboard';
import { getCurrentUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user?.restaurantId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const formData = await req.formData();
  // Re-use the shared server action — pass through the restaurant context via formData
  const result = uploadHero(formData);
  const r = await result;
  return NextResponse.json(r);
}
