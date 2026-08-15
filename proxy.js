import { NextResponse } from 'next/server'

const allowedOrigins = [
  'https://artyxpress.com',
]

const corsOptions = {
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Credentials': 'true',
}

function isAllowedOrigin(origin) {
  if (!origin) return false

  return (
    allowedOrigins.includes(origin) ||
    /^https:\/\/[a-zA-Z0-9-]+\.vercel\.app$/.test(origin)
  )
}

export function proxy(request) {
  const origin = request.headers.get('origin') ?? ''
  const isAllowedOrigin = isAllowedOrigin(origin)

  // Handle preflight requests
  const isPreflight = request.method === 'OPTIONS'

  if (isPreflight) {
    const preflightHeaders = {
      ...(isAllowedOrigin && {
        'Access-Control-Allow-Origin': origin,
      }),
      ...corsOptions,
    }

    return new NextResponse(null, {
      status: 204,
      headers: preflightHeaders,
    })
  }

  // Let the actual API request continue
  const response = NextResponse.next()

  if (isAllowedOrigin) {
    response.headers.set('Access-Control-Allow-Origin', origin)
  }

  Object.entries(corsOptions).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  return response
}

export const config = {
  matcher: '/api/:path*',
}