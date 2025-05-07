"use client";

import { SessionProvider } from "next-auth/react";

/** 
 * Wraps children in NextAuth’s SessionProvider.
 * Expects to receive the session prop from the layout.
 */
export function NextAuthSessionProvider({ children, session }) {
    return (
        <SessionProvider session={session}>
            {children}
        </SessionProvider>
    );
}
