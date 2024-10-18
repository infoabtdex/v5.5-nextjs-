import React from 'react'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import ClientLayout from './ClientLayout'
import { PermissionProvider } from './camera/page'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'KOL Platform',
  description: 'Create and share content with AI-powered enhancements',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <PermissionProvider>
        <body className={inter.className}>
          <ClientLayout>{children}</ClientLayout>
        </body>
      </PermissionProvider>
    </html>
  )
}
