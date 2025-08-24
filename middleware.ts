import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    // Add any additional middleware logic here
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl

        // Allow access to auth pages regardless of authentication status
        if (pathname.startsWith('/auth/')) {
          return true
        }

        // For protected routes, require authentication
        if (pathname.startsWith('/admin/')) {
          return token?.role === 'admin'
        }

        if (pathname.startsWith('/influencer/')) {
          return token?.role === 'influencer'
        }

        // Allow access to public routes
        return true
      },
    },
  }
)

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}