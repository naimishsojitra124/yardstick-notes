import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function applyCorsHeaders(res: NextResponse, req?: NextRequest) {
  const origin = req?.headers.get('origin') ?? '*'

  res.headers.set('Access-Control-Allow-Origin', origin)
  res.headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
  res.headers.set(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-Requested-With, Accept'
  )
  res.headers.set('Access-Control-Allow-Credentials', 'true')
  res.headers.set('Vary', 'Origin')

  return res
}
