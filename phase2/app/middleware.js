// middleware.js
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req) {
    const { pathname } = req.nextUrl;

    // Only run this check on /admin/statistics and its sub-paths
    if (pathname.startsWith("/admin/statistics")) {
        // Grab the NextAuth JWT from the cookie
        const token = await getToken({
            req,
            secret: process.env.NEXTAUTH_SECRET,
        });

        // If there's no token or the user isn't an admin, send them to /login
        if (!token || token.role !== "admin") {
            return NextResponse.redirect(new URL("/login", req.url));
        }
    }

    // Otherwise, continue on
    return NextResponse.next();
}

// Tell Next.js which paths to run the middleware on
export const config = {
    matcher: ["/admin/statistics/:path*"],
};
