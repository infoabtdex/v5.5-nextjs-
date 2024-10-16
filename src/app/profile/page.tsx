'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, User } from 'lucide-react'
import Link from 'next/link'

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false)
  const [username, setUsername] = useState('John Doe')
  const [email, setEmail] = useState('johndoe@example.com')
  const router = useRouter()

  const handleSave = () => {
    setIsEditing(false)
    // In a real app, you would save the changes to the backend here
    console.log('Saving profile:', { username, email })
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="flex items-center mb-6">
        <Link href="/camera" passHref>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-6 w-6" />
            <span className="sr-only">Back to Camera</span>
          </Button>
        </Link>
        <h1 className="text-2xl font-bold ml-4">Profile</h1>
      </div>
      <div className="bg-white rounded-lg shadow p-6 max-w-md mx-auto">
        <div className="flex justify-center mb-6">
          <User className="h-24 w-24 text-gray-400" />
        </div>
        <div className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              disabled={!isEditing} 
            />
          </div>
          <div>
            <Label htmlFor="username">Username</Label>
            <Input 
              id="username" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={!isEditing}
            />
          </div>
        </div>
        <div className="mt-6">
          {isEditing ? (
            <div className="space-x-2">
              <Button onClick={handleSave}>
                Save
              </Button>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
            </div>
          ) : (
            <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
          )}
        </div>
      </div>
    </div>
  )
}
