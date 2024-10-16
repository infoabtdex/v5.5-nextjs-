'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ProtectedRoute from '../components/ProtectedRoute'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    router.push('/camera')
  }, [router])

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p>Redirecting to camera...</p>
      </div>
    </ProtectedRoute>
  )
}
