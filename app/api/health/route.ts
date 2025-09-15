import { NextResponse } from 'next/server'
import { applyCorsHeaders } from '@/lib/cors'

export async function GET() {
  const res = NextResponse.json({ status: 'ok' })
  applyCorsHeaders(res)
  return res
}

export async function OPTIONS() {
  const res = NextResponse.json({})
  applyCorsHeaders(res)
  return res
}