const allowedOrigins = [
  "https://artyxpress.com",
];

const corsOptions = {
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Credentials": "true",
};

export default function middleware(request) {
  const origin = request.headers.get("origin") ?? "";

  const isAllowedOrigin =
    allowedOrigins.includes(origin) ||
    /^https:\/\/[a-zA-Z0-9-]+\.vercel\.app$/.test(origin);

  const isPreflight = request.method === "OPTIONS";

  if (isPreflight) {
    if (!isAllowedOrigin) {
      return new Response(null, { status: 403 });
    }

    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": origin,
        ...corsOptions,
      },
    });
  }

  const response = Response.next
    ? Response.next()
    : new Response(null);

  if (isAllowedOrigin) {
    response.headers.set("Access-Control-Allow-Origin", origin);
  }

  Object.entries(corsOptions).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

export const config = {
  matcher: "/api/:path*",
};