'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Button } from "@/components/ui/button"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold mb-4">Something went wrong!</h1>
      <div className="flex space-x-4">
        <Button onClick={reset}>Try again</Button>
        <Link href="/camera">
          <Button variant="outline">Return Home</Button>
        </Link>
      </div>
    </div>
  )
} 