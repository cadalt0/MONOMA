import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Analytics } from '@vercel/analytics/next'
import { ThemeProvider } from '@/components/theme-provider'
import { GoogleProvider } from '@/components/google-provider'
import './globals.css'

export const metadata: Metadata = {
  title: 'MONOMA',
  description: 'Created with 💖',
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID as string | undefined
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <GoogleProvider clientId={clientId}>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            {children}
          </ThemeProvider>
        </GoogleProvider>
        <Analytics />
      </body>
    </html>
  )
}
