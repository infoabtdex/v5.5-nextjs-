'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { ChevronRight, ChevronDown, ArrowLeft, X } from 'lucide-react'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import PhotoCard from '@/components/PhotoCard'
import { getAllMedia, deletePhoto, deleteVideo } from '@/services/firebaseService'
import Image from 'next/image'

interface Media {
  id: string
  src: string
  type: 'photo' | 'video'
  date: Date
}

interface Session {
  id: string
  date: string
  media: Media[]
}

const groupMediaByDate = (media: Media[]): Session[] => {
  const grouped = media.reduce((acc, media) => {
    const date = media.date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    if (!acc[date]) {
      acc[date] = []
    }
    acc[date].push(media)
    return acc
  }, {} as Record<string, Media[]>)

  return Object.entries(grouped).map(([date, media], index) => ({
    id: `session-${index}`,
    date,
    media: media.sort((a, b) => b.date.getTime() - a.date.getTime())
  })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

export default function GalleryPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [selectedMedia, setSelectedMedia] = useState<string[]>([])
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [expandedSessions, setExpandedSessions] = useState<string[]>([])
  const [expandedMedia, setExpandedMedia] = useState<Media | null>(null)

  useEffect(() => {
    const fetchMedia = async () => {
      setIsLoading(true)
      try {
        const fetchedMedia = await getAllMedia()
        const groupedSessions = groupMediaByDate(fetchedMedia)
        setSessions(groupedSessions)
        setExpandedSessions([groupedSessions[0]?.id].filter(Boolean))
      } catch (error) {
        console.error('Error fetching media:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchMedia()
  }, [])

  const handleMediaSelect = useCallback((mediaId: string) => {
    setSelectedMedia(prev => 
      prev.includes(mediaId)
        ? prev.filter(id => id !== mediaId)
        : [...prev, mediaId]
    )
  }, [])

  const handleDelete = useCallback(async (media: Media) => {
    try {
      if (media.type === 'photo') {
        await deletePhoto(media.id)
      } else {
        await deleteVideo(media.id)
      }
      setSessions(prevSessions => 
        prevSessions.map(session => ({
          ...session,
          media: session.media.filter(item => item.id !== media.id)
        })).filter(session => session.media.length > 0)
      )
    } catch (error) {
      console.error('Error deleting media:', error)
    }
  }, [])

  const handleEdit = useCallback((mediaId: string) => {
    // Implement edit functionality
    console.log('Edit media:', mediaId)
  }, [])

  const handleShare = useCallback((mediaId: string) => {
    // Implement share functionality
    console.log('Share media:', mediaId)
  }, [])

  const toggleSession = useCallback((sessionId: string) => {
    setExpandedSessions(prev => 
      prev.includes(sessionId)
        ? prev.filter(id => id !== sessionId)
        : [...prev, sessionId]
    )
  }, [])

  const handleMediaClick = useCallback((media: Media) => {
    if (!isSelectionMode) {
      setExpandedMedia(media)
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
          <Link href={`/create-post?media=${selectedMedia.join(',')}`} passHref>
            <Button disabled={selectedMedia.length === 0}>
              Next ({selectedMedia.length})
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
              {session.media.map((media) => (
                <PhotoCard
                  key={media.id}
                  src={media.src}
                  alt={`Photo ${media.id}`}
                  type={media.type}
                  isSelectable={isSelectionMode}
                  isSelected={selectedMedia.includes(media.id)}
                  onSelect={() => handleMediaSelect(media.id)}
                  onDelete={() => handleDelete(media)}
                  onEdit={() => handleEdit(media.id)}
                  onShare={() => handleShare(media.id)}
                  onClick={() => handleMediaClick(media)}
                />
              ))}
            </div>
          )}
        </div>
      ))}
      {expandedMedia && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="relative w-full h-full max-w-4xl max-h-4xl">
            {expandedMedia.type === 'photo' ? (
              <Image
                src={expandedMedia.src}
                alt={`Expanded photo ${expandedMedia.id}`}
                layout="fill"
                objectFit="contain"
              />
            ) : (
              <video
                src={expandedMedia.src}
                className="w-full h-full object-contain"
                controls
                autoPlay
              />
            )}
            <button
              className="absolute top-4 right-4 text-white"
              onClick={() => setExpandedMedia(null)}
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
