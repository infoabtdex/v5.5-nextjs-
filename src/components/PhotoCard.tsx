import React from 'react'
import Image from 'next/image'
import { Button } from "@/components/ui/button"
import { Trash2, Edit2, Share2 } from 'lucide-react'

interface PhotoCardProps {
  src: string
  alt: string
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
  isSelectable,
  isSelected,
  onSelect,
  onDelete,
  onEdit,
  onShare,
  onClick
}) => {
  return (
    <div className="relative group" onClick={onClick}>
      <div className={`aspect-square overflow-hidden rounded-lg ${isSelected ? 'ring-2 ring-blue-500' : ''}`}>
        <Image
          src={src}
          alt={alt}
          width={300}
          height={300}
          className="object-cover w-full h-full transition-opacity duration-300 ease-in-out group-hover:opacity-75"
          loading="lazy"
          onError={(e) => {
            e.currentTarget.src = '/placeholder.svg?height=300&width=300' // Fallback image
          }}
        />
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
