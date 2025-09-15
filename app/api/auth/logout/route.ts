import { NextResponse } from 'next/server'
import { applyCorsHeaders } from '@/lib/cors'

export async function POST() {
  const res = NextResponse.json({ success: true })
  res.cookies.set('token', '', { httpOnly: true, path: '/', maxAge: 0 })
  applyCorsHeaders(res)
  return res
}