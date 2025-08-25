import { NextResponse } from 'next/server';
import { loadConfig } from '@/lib/config';

export async function GET() {
  try {
    const config = loadConfig();
    return NextResponse.json(config);
  } catch (error) {
    console.error('Failed to load configuration:', error);
    return NextResponse.json({ error: 'Failed to load configuration' }, { status: 500 });
  }
}