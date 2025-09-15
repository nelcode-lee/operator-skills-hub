import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    message: 'Vercel API routes are working!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    vercel: true
  });
}
