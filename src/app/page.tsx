'use client'

import React from 'react'
import Link from 'next/link'
import ProtectedRoute from '../components/ProtectedRoute'

export default function Home() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-100 p-4">
        <h1 className="text-2xl font-bold mb-4">Welcome to KOL Platform</h1>
        <p className="mb-4">Create and share content with AI-powered enhancements.</p>
        <div className="space-y-4">
          <Link href="/camera" className="block bg-blue-500 text-white p-2 rounded text-center">
            Open Camera
          </Link>
          <Link href="/gallery" className="block bg-green-500 text-white p-2 rounded text-center">
            View Gallery
          </Link>
        </div>
      </div>
    </ProtectedRoute>
  )
}
