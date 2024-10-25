import React, { useRef, useEffect } from 'react'
import Image from 'next/image'
import { Button } from "@/components/ui/button"
import { Play } from 'lucide-react'

interface PhotoCardProps {
  src: string
  alt: string
  type: 'photo' | 'video'
  isSelectable: boolean
  isSelected: boolean
  onSelect: () => void
  onClick: () => void
  onDelete: () => void
  onEdit: () => void
  onShare: () => void
}

const PhotoCard: React.FC<PhotoCardProps> = ({
  src,
  alt,
  type,
  isSelectable,
  isSelected,
  onSelect,
  onClick,
  onDelete,
  onEdit,
  onShare
}) => {
  const videoRef = useRef<HTMLVideoElement>(null)

  // Preload image
  useEffect(() => {
    if (type === 'photo') {
      const img = document.createElement('img');
      img.src = src;
    }
  }, [src, type]);

  useEffect(() => {
    if (type === 'video' && videoRef.current) {
      videoRef.current.currentTime = 0
    }
  }, [type])

  return (
    <div 
      className="relative aspect-square overflow-hidden rounded-lg cursor-pointer"
      onClick={onClick}
    >
      {type === 'photo' ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover"
          priority={false}
        />
      ) : (
        <>
          <video
            ref={videoRef}
            src={src}
            className="w-full h-full object-cover"
            preload="metadata"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <Play className="h-12 w-12 text-white opacity-70" />
          </div>
        </>
      )}
      {isSelectable && (
        <div 
          className={`absolute top-2 right-2 h-6 w-6 rounded-full border-2 ${
            isSelected ? 'bg-blue-500 border-blue-500' : 'border-white'
          }`}
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
        />
      )}
    </div>
  );
};

export default PhotoCard;
