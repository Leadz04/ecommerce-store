import { NextResponse, NextRequest } from "next/server";

// Capture referral/affiliate and UTM parameters and persist to cookies
export function middleware(request: NextRequest) {
  const url = new URL(request.url);
  const response = NextResponse.next();

  const paramsToCapture = [
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_term",
    "utm_content",
    "ref",
    "aff",
  ];

  let changed = false;

  for (const key of paramsToCapture) {
    const value = url.searchParams.get(key);
    if (value && !request.cookies.get(key)?.value) {
      response.cookies.set(key, value, {
        path: "/",
        httpOnly: false,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 90, // 90 days
      });
      changed = true;
    }
  }

  // Forward attribution via headers for server routes
  if (changed) {
    for (const key of paramsToCapture) {
      const cookieVal = response.cookies.get(key)?.value || request.cookies.get(key)?.value;
      if (cookieVal) {
        response.headers.set(`x-attrib-${key}`, cookieVal);
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};


