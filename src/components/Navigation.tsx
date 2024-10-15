import React from 'react'
import Link from 'next/link'
import { Home, Camera, Image, PlusCircle } from 'lucide-react'

export default function Navigation() {
  return (
    <nav className="bg-white border-t border-gray-200">
      <div className="max-w-screen-xl mx-auto px-4">
        <div className="flex justify-between">
          <Link href="/" className="flex flex-col items-center py-2">
            <Home className="h-6 w-6" />
            <span className="text-xs mt-1">Home</span>
          </Link>
          <Link href="/camera" className="flex flex-col items-center py-2">
            <Camera className="h-6 w-6" />
            <span className="text-xs mt-1">Camera</span>
          </Link>
          <Link href="/gallery" className="flex flex-col items-center py-2">
            <Image className="h-6 w-6" />
            <span className="text-xs mt-1">Gallery</span>
          </Link>
          <Link href="/create-post" className="flex flex-col items-center py-2">
            <PlusCircle className="h-6 w-6" />
            <span className="text-xs mt-1">Create</span>
          </Link>
        </div>
      </div>
    </nav>
  )
}
