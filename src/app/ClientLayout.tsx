'use client'

import React from 'react'
import AuthWrapper from '../components/AuthWrapper'

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <AuthWrapper>
        <main className="flex-grow">{children}</main>
      </AuthWrapper>
    </div>
  )
}
