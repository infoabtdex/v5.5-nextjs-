'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { ChevronRight, ChevronDown, ArrowLeft, X } from 'lucide-react'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import PhotoCard from '@/components/PhotoCard'
import { getAllPhotos, deletePhoto } from '@/services/firebaseService'
import Image from 'next/image'

interface Photo {
  id: string
  src: string
  date: Date
}

interface Session {
  id: string
  date: string
  photos: Photo[]
}

const groupPhotosByDate = (photos: Photo[]): Session[] => {
  const grouped = photos.reduce((acc, photo) => {
    const date = photo.date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    if (!acc[date]) {
      acc[date] = []
    }
    acc[date].push(photo)
    return acc
  }, {} as Record<string, Photo[]>)

  return Object.entries(grouped).map(([date, photos], index) => ({
    id: `session-${index}`,
    date,
    photos: photos.sort((a, b) => b.date.getTime() - a.date.getTime())
  })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

export default function GalleryPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([])
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [expandedSessions, setExpandedSessions] = useState<string[]>([])
  const [expandedPhoto, setExpandedPhoto] = useState<Photo | null>(null)

  useEffect(() => {
    const fetchPhotos = async () => {
      setIsLoading(true)
      try {
        const fetchedPhotos = await getAllPhotos()
        const groupedSessions = groupPhotosByDate(fetchedPhotos)
        setSessions(groupedSessions)
        setExpandedSessions([groupedSessions[0]?.id].filter(Boolean)) // Expand the most recent session if it exists
      } catch (error) {
        console.error('Error fetching photos:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPhotos()
  }, [])

  const handlePhotoSelect = useCallback((photoId: string) => {
    setSelectedPhotos(prev => 
      prev.includes(photoId)
        ? prev.filter(id => id !== photoId)
        : [...prev, photoId]
    )
  }, [])

  const handleDelete = useCallback(async (photoId: string) => {
    try {
      await deletePhoto(photoId)
      setSessions(prevSessions => 
        prevSessions.map(session => ({
          ...session,
          photos: session.photos.filter(photo => photo.id !== photoId)
        })).filter(session => session.photos.length > 0)
      )
    } catch (error) {
      console.error('Error deleting photo:', error)
    }
  }, [])

  const handleEdit = useCallback((photoId: string) => {
    // Implement edit functionality
    console.log('Edit photo:', photoId)
  }, [])

  const handleShare = useCallback((photoId: string) => {
    // Implement share functionality
    console.log('Share photo:', photoId)
  }, [])

  const toggleSession = useCallback((sessionId: string) => {
    setExpandedSessions(prev => 
      prev.includes(sessionId)
        ? prev.filter(id => id !== sessionId)
        : [...prev, sessionId]
    )
  }, [])

  const handlePhotoClick = useCallback((photo: Photo) => {
    if (!isSelectionMode) {
      setExpandedPhoto(photo)
    }
  }, [isSelectionMode])

  if (isLoading) {
    return <div className="min-h-screen bg-gray-100 flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="flex justify-between items-center mb-4">
        <Link href="/camera" passHref>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-6 w-6" />
            <span className="sr-only">Back to Camera</span>
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Gallery</h1>
        {isSelectionMode ? (
          <Link href={`/create-post?photos=${selectedPhotos.join(',')}`} passHref>
            <Button disabled={selectedPhotos.length === 0}>
              Next ({selectedPhotos.length})
            </Button>
          </Link>
        ) : (
          <Button onClick={() => setIsSelectionMode(true)}>
            Select Photos
          </Button>
        )}
      </div>
      {sessions.map((session) => (
        <div key={session.id} className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <button 
              onClick={() => toggleSession(session.id)}
              className="text-lg font-semibold flex items-center focus:outline-none"
              aria-expanded={expandedSessions.includes(session.id)}
            >
              {expandedSessions.includes(session.id) ? (
                <ChevronDown className="h-5 w-5 mr-1" />
              ) : (
                <ChevronRight className="h-5 w-5 mr-1" />
              )}
              {session.date}
            </button>
            <button className="text-blue-500 flex items-center text-sm">
              See all
              <ChevronRight className="h-4 w-4 ml-1" />
            </button>
          </div>
          {expandedSessions.includes(session.id) && (
            <div className="grid grid-cols-4 gap-4">
              {session.photos.map((photo) => (
                <PhotoCard
                  key={photo.id}
                  src={photo.src}
                  alt={`Photo ${photo.id}`}
                  isSelectable={isSelectionMode}
                  isSelected={selectedPhotos.includes(photo.id)}
                  onSelect={() => handlePhotoSelect(photo.id)}
                  onDelete={() => handleDelete(photo.id)}
                  onEdit={() => handleEdit(photo.id)}
                  onShare={() => handleShare(photo.id)}
                  onClick={() => handlePhotoClick(photo)}
                />
              ))}
            </div>
          )}
        </div>
      ))}
      {expandedPhoto && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="relative w-full h-full max-w-4xl max-h-4xl">
            <Image
              src={expandedPhoto.src}
              alt={`Expanded photo ${expandedPhoto.id}`}
              layout="fill"
              objectFit="contain"
            />
            <button
              className="absolute top-4 right-4 text-white"
              onClick={() => setExpandedPhoto(null)}
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
