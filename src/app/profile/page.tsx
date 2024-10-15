'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import { ArrowLeft, User } from 'lucide-react'
import Link from 'next/link'
import { getUserProfile, updateUserProfile } from '../../services/firebaseService'

interface UserProfile {
  username: string
  email: string
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [username, setUsername] = useState('')
  const router = useRouter()

  useEffect(() => {
    const fetchProfile = async () => {
      const userProfile = await getUserProfile()
      setProfile(userProfile)
      setUsername(userProfile.username)
    }
    fetchProfile()
  }, [])

  const handleSave = async () => {
    if (profile) {
      await updateUserProfile({ ...profile, username })
      setProfile({ ...profile, username })
      setIsEditing(false)
    }
  }

  if (!profile) {
    return <div>Loading...</div>
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
            <Input id="email" value={profile.email} disabled />
          </div>
          <div>
            <Label htmlFor="username">Username</Label>
            {isEditing ? (
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            ) : (
              <Input id="username" value={profile.username} disabled />
            )}
          </div>
        </div>
        <div className="mt-6">
          {isEditing ? (
            <div className="space-x-2">
              <Button onClick={handleSave}>Save</Button>
              <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
            </div>
          ) : (
            <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
          )}
        </div>
      </div>
    </div>
  )
}
