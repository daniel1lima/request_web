import { NextResponse } from 'next/server';

export function middleware() {
//   // Get the pathname of the request (e.g. /, /protected)
//   const path = request.nextUrl.pathname;

//   // Get the token from the cookies
//   const isAuthenticated = request.cookies.get('your-auth-cookie')?.value;

//   // Protected routes
//   const protectedPaths = ['/dashboard'];
  
//   const isProtectedPath = protectedPaths.some((pp) => path.startsWith(pp));

//   if (isProtectedPath && !isAuthenticated) {
//     // Redirect to login page if accessing protected route without authentication
//     return NextResponse.redirect(new URL('/', request.url));
//   }

//   if (path === '/' && isAuthenticated) {
//     // Redirect to dashboard if already authenticated
//     return NextResponse.redirect(new URL('/dashboard', request.url));
//   }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/dashboard/:path*', '/signin']
}; 