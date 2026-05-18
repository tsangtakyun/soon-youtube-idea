import { NextResponse } from 'next/server'

export async function GET() {
  const target = process.env.NEXT_PUBLIC_APP_URL
    ? `${process.env.NEXT_PUBLIC_APP_URL}/api/scan`
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}/api/scan`
      : ''

  if (!target) {
    return NextResponse.json({ triggered: false, error: 'NEXT_PUBLIC_APP_URL or VERCEL_URL is required' }, { status: 500 })
  }

  const res = await fetch(target, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  })
  const data = await res.json()

  return NextResponse.json({ triggered: true, result: data })
}
