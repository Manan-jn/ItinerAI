import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Get the pathname of the request (e.g. /, /dashboard/123)
  const { pathname } = request.nextUrl;

  // Check if the request is for a protected route (dashboard or settings)
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/settings')) {
    // For now, we'll let the client-side handle authentication checks
    // since Firebase auth state is managed on the client side
    // The protected page components will handle redirects if user is not authenticated
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  // Match all protected routes (dashboard and settings)
  matcher: ['/dashboard/:path*', '/settings/:path*']
};
