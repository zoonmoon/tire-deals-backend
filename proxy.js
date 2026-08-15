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
  return (
    origin === 'https://artyxpress.com' ||
    /^https:\/\/[a-zA-Z0-9-]+\.vercel\.app$/.test(origin)
  )
}

export function proxy(request) {
  const origin = request.headers.get('origin') || ''
  const allowed = isAllowedOrigin(origin)

  console.log('CORS:', {
    origin,
    allowed,
    path: request.nextUrl.pathname,
  })

  if (request.method === 'OPTIONS') {
    if (!allowed) {
      return new NextResponse(null, { status: 403 })
    }

    return new NextResponse(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': origin,
        ...corsOptions,
      },
    })
  }

  const response = NextResponse.next()

  if (allowed) {
    response.headers.set('Access-Control-Allow-Origin', origin)
    response.headers.set('Access-Control-Allow-Credentials', 'true')
    response.headers.set(
      'Access-Control-Allow-Methods',
      'GET, POST, PUT, PATCH, DELETE, OPTIONS'
    )
    response.headers.set(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization'
    )
  }

  return response
}

export const config = {
  matcher: '/api/:path*',
}