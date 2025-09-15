import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    version: '1.0.0',
    service: 'Operator Skills Hub API'
  });
}
