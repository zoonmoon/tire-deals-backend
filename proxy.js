import { NextResponse } from 'next/server'

const allowedOrigins = ['https://artyxpress.com']

const corsOptions = {
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Credentials': 'true',
}

function isOriginAllowed(origin) {

    console.log("origin ", origin)
  return (
    allowedOrigins.includes(origin) ||
    origin.endsWith('.vercel.app')
  )
}

export function proxy(request) {

    console.log("insid erpxoy")

console.log("🔥🔥🔥 PROXY FILE LOADED 🔥🔥🔥")

  // Check the origin from the request
  const origin = request.headers.get('origin') ?? ''
  const isAllowedOrigin = isOriginAllowed(origin)

  // Handle preflighted requests
  const isPreflight = request.method === 'OPTIONS'

  if (isPreflight) {
    const preflightHeaders = {
      ...(isAllowedOrigin && { 'Access-Control-Allow-Origin': origin }),
      ...corsOptions,
    }

    return NextResponse.json({}, { headers: preflightHeaders })
  }

  // Handle simple requests
  const response = NextResponse.next()


  console.log("hello karuna")

  if (isAllowedOrigin) {
    response.headers.set('Access-Control-Allow-Origin', origin)
  }else{
      console.log("hello karuna inside else")

  }

  Object.entries(corsOptions).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  return response
}

export const config = {
  matcher: '/api/:path*',
}