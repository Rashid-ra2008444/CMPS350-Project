import { Inter } from "next/font/google"
import "./globals.css"
import { NextAuthSessionProvider } from "./providers/SessionProviderClient";

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Qatar University Course Management",
  description: "Course management system for Qatar University",
}

export default function RootLayout({ children,session }) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" rel="stylesheet" />
        <link
          href="https://fonts.googleapis.com/css2?family=Pixelify+Sans:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={inter.className}>
        <NextAuthSessionProvider session={session}>
          {children}
        </NextAuthSessionProvider>
        </body>
    </html>
  )
}
