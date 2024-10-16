import React, { useState } from 'react'
import Image from 'next/image'
import { Button } from "@/components/ui/button"
import { Trash2, Edit2, Share2, Play, Pause } from 'lucide-react'

interface PhotoCardProps {
  src: string
  alt: string
  type: 'photo' | 'video'
  isSelectable: boolean
  isSelected: boolean
  onSelect: () => void
  onDelete: () => void
  onEdit: () => void
  onShare: () => void
  onClick: () => void
}

const PhotoCard: React.FC<PhotoCardProps> = ({
  src,
  alt,
  type,
  isSelectable,
  isSelected,
  onSelect,
  onDelete,
  onEdit,
  onShare,
  onClick
}) => {
  const [isPlaying, setIsPlaying] = useState(false)

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsPlaying(!isPlaying)
    const video = document.getElementById(`video-${alt}`) as HTMLVideoElement
    if (video) {
      isPlaying ? video.pause() : video.play()
    }
  }

  return (
    <div className="relative group" onClick={onClick}>
      <div className={`aspect-square overflow-hidden rounded-lg ${isSelected ? 'ring-2 ring-blue-500' : ''}`}>
        {type === 'photo' ? (
          <Image
            src={src}
            alt={alt}
            width={300}
            height={300}
            className="object-cover w-full h-full transition-opacity duration-300 ease-in-out group-hover:opacity-75"
            loading="lazy"
          />
        ) : (
          <div className="relative w-full h-full">
            <video
              id={`video-${alt}`}
              src={src}
              className="object-cover w-full h-full"
              muted
              playsInline
              loop
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <Button 
                variant="ghost" 
                size="icon" 
                className="bg-black bg-opacity-50 hover:bg-opacity-75"
                onClick={togglePlay}
              >
                {isPlaying ? <Pause className="h-8 w-8 text-white" /> : <Play className="h-8 w-8 text-white" />}
              </Button>
            </div>
          </div>
        )}
      </div>
      {isSelectable && (
        <button
          className={`absolute top-2 right-2 w-6 h-6 rounded-full ${isSelected ? 'bg-blue-500' : 'bg-white'} flex items-center justify-center`}
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
        >
          {isSelected && <span className="text-white">✓</span>}
        </button>
      )}
      <div className="absolute bottom-2 left-2 right-2 flex justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-in-out">
        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
          <Trash2 className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onEdit(); }}>
          <Edit2 className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onShare(); }}>
          <Share2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

export default PhotoCard
