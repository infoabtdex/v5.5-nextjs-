import React from 'react'
import Link from 'next/link'
import { Home, Camera, Image, PlusCircle, LogOut } from 'lucide-react'
import { Button } from './ui/button'
import { User } from 'firebase/auth'

interface NavigationProps {
  user: User;
  onLogout: () => void;
}

export default function Navigation({ user, onLogout }: NavigationProps) {
  return (
    <nav className="bg-white border-t border-gray-200">
      <div className="max-w-screen-xl mx-auto px-4">
        <div className="flex justify-between items-center">
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
          <div className="flex items-center">
            <span className="text-sm mr-2">{user.email}</span>
            <Button onClick={onLogout} variant="ghost" size="sm">
              <LogOut className="h-4 w-4 mr-1" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}
