import React, { useRef, useEffect } from 'react'
import Image from 'next/image'
import { Button } from "@/components/ui/button"
import { Play } from 'lucide-react'
import { type Media } from '@/services/firebaseService'

interface PhotoCardProps {
  media: Media;
  LazyImage?: React.ComponentType<any>;
  isSelectable: boolean;
  isSelected: boolean;
  onSelect: () => void;
  onClick: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onShare: () => void;
}

const PhotoCard: React.FC<PhotoCardProps> = ({
  media,
  LazyImage,
  isSelectable,
  isSelected,
  onSelect,
  onClick,
  onDelete,
  onEdit,
  onShare
}) => {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (media.type === 'video' && videoRef.current) {
      videoRef.current.currentTime = 0
    }
  }, [media.type])

  const ImageComponent = LazyImage || Image;

  return (
    <div 
      className="relative aspect-square overflow-hidden rounded-lg cursor-pointer"
      onClick={onClick}
    >
      {media.type === 'photo' ? (
        <ImageComponent
          src={media.src}
          alt={`Photo taken on ${media.date.toLocaleDateString()}`}
          fill
          sizes="(max-width: 768px) 50vw, 25vw"
          className="object-cover rounded-lg"
        />
      ) : (
        <>
          <video
            ref={videoRef}
            src={media.src}
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
