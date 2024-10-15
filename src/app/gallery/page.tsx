'use client'

import React, { useState, useCallback } from 'react'
import { ChevronRight, ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { Button } from "../../components/ui/button"

interface Photo {
  id: string
  src: string
  aiSuggested?: boolean
}

interface Session {
  id: string
  date: string
  photos: Photo[]
}

const sessions: Session[] = [
  {
    id: '1',
    date: 'Today',
    photos: [
      { id: '1', src: '/placeholder.svg?height=150&width=150', aiSuggested: true },
      { id: '2', src: '/placeholder.svg?height=150&width=150', aiSuggested: true },
      { id: '3', src: '/placeholder.svg?height=150&width=150' },
      { id: '4', src: '/placeholder.svg?height=150&width=150' },
      { id: '5', src: '/placeholder.svg?height=150&width=150' },
      { id: '6', src: '/placeholder.svg?height=150&width=150' },
      { id: '7', src: '/placeholder.svg?height=150&width=150' },
      { id: '8', src: '/placeholder.svg?height=150&width=150' },
    ]
  },
  {
    id: '2',
    date: 'Yesterday',
    photos: [
      { id: '9', src: '/placeholder.svg?height=150&width=150' },
      { id: '10', src: '/placeholder.svg?height=150&width=150' },
      { id: '11', src: '/placeholder.svg?height=150&width=150' },
      { id: '12', src: '/placeholder.svg?height=150&width=150' },
    ]
  },
  {
    id: '3',
    date: 'Last Week',
    photos: [
      { id: '13', src: '/placeholder.svg?height=150&width=150' },
      { id: '14', src: '/placeholder.svg?height=150&width=150' },
      { id: '15', src: '/placeholder.svg?height=150&width=150' },
      { id: '16', src: '/placeholder.svg?height=150&width=150' },
      { id: '17', src: '/placeholder.svg?height=150&width=150' },
      { id: '18', src: '/placeholder.svg?height=150&width=150' },
      { id: '19', src: '/placeholder.svg?height=150&width=150' },
      { id: '20', src: '/placeholder.svg?height=150&width=150' },
    ]
  }
]

const SessionHeader: React.FC<{
  date: string
  isExpanded: boolean
  onToggle: () => void
}> = ({ date, isExpanded, onToggle }) => (
  <div className="flex justify-between items-center mb-2">
    <button 
      onClick={onToggle}
      className="text-lg font-semibold flex items-center focus:outline-none"
      aria-expanded={isExpanded}
    >
      {isExpanded ? (
        <ChevronDown className="h-5 w-5 mr-1" />
      ) : (
        <ChevronRight className="h-5 w-5 mr-1" />
      )}
      {date}
    </button>
    <button className="text-blue-500 flex items-center text-sm">
      See all
      <ChevronRight className="h-4 w-4 ml-1" />
    </button>
  </div>
)

const PhotoGrid: React.FC<{
  photos: Photo[]
  isRecentSession: boolean
  selectedPhotos: string[]
  onPhotoSelect: (photoId: string) => void
}> = ({ photos, isRecentSession, selectedPhotos, onPhotoSelect }) => (
  <div className="grid grid-cols-4 gap-2">
    {photos
      .sort((a, b) => (b.aiSuggested ? 1 : 0) - (a.aiSuggested ? 1 : 0))
      .map((photo) => (
        <button
          key={photo.id}
          className={`relative aspect-square overflow-hidden rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            photo.aiSuggested && isRecentSession ? 'ring-2 ring-blue-500' : ''
          }`}
          onClick={() => onPhotoSelect(photo.id)}
        >
          <img
            src={photo.src}
            alt={`Photo ${photo.id}`}
            className="object-cover w-full h-full"
          />
          {photo.aiSuggested && isRecentSession && (
            <div className="absolute top-1 left-1 bg-blue-500 text-white text-xs px-1 rounded">
              AI Pick
            </div>
          )}
          {selectedPhotos.includes(photo.id) && (
            <div className="absolute top-1 right-1 bg-blue-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
              {selectedPhotos.indexOf(photo.id) + 1}
            </div>
          )}
        </button>
      ))}
  </div>
)

function GalleryPage() {
  const [expandedSessions, setExpandedSessions] = useState<string[]>(['1'])
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([])

  const toggleSession = useCallback((sessionId: string) => {
    setExpandedSessions(prev => 
      prev.includes(sessionId)
        ? prev.filter(id => id !== sessionId)
        : [...prev, sessionId]
    )
  }, [])

  const handlePhotoSelect = (photoId: string) => {
    setSelectedPhotos(prev => 
      prev.includes(photoId)
        ? prev.filter(id => id !== photoId)
        : [...prev, photoId]
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Gallery</h1>
        <Link href={`/create-post?photos=${selectedPhotos.join(',')}`} passHref>
          <Button disabled={selectedPhotos.length === 0}>
            Next ({selectedPhotos.length})
          </Button>
        </Link>
      </div>
      {sessions.map((session, index) => (
        <div key={session.id} className="mb-8">
          <SessionHeader
            date={session.date}
            isExpanded={expandedSessions.includes(session.id)}
            onToggle={() => toggleSession(session.id)}
          />
          {expandedSessions.includes(session.id) && (
            <PhotoGrid 
              photos={session.photos} 
              isRecentSession={index === 0} 
              selectedPhotos={selectedPhotos}
              onPhotoSelect={handlePhotoSelect}
            />
          )}
        </div>
      ))}
    </div>
  )
}

export default GalleryPage
