'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { RefreshCw, Share2, ChevronLeft, X } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import dynamic from 'next/dynamic'
import { getMediaUrl } from '@/services/firebaseService'

const Image = dynamic(() => import('next/image'), { ssr: false })

interface Media {
  id: string
  src: string
  type: 'photo' | 'video'
}

const EnhancedVersionButton = React.memo(({ 
  version, 
  isSelected, 
  onSelect, 
  onRegenerate, 
  label 
}: { 
  version: string
  isSelected: boolean
  onSelect: () => void
  onRegenerate: () => void
  label: string
}) => (
  <div className="relative">
    <button
      className={`relative w-full aspect-square overflow-hidden rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
        isSelected ? 'ring-2 ring-blue-500' : ''
      }`}
      onClick={onSelect}
    >
      <Image src={version} alt={`Enhanced version`} layout="fill" objectFit="cover" loading="lazy" />
    </button>
    <Button
      size="icon"
      variant="ghost"
      className="absolute top-1 right-1 bg-black bg-opacity-50"
      onClick={onRegenerate}
    >
      <RefreshCw className="h-4 w-4" />
    </Button>
    <p className="text-xs text-center mt-1">{label}</p>
  </div>
))

EnhancedVersionButton.displayName = 'EnhancedVersionButton'

export default function CreatePostPage() {
  const searchParams = useSearchParams()
  const [selectedMedia, setSelectedMedia] = useState<Media[]>([])
  const [step, setStep] = useState<'enhance' | 'caption'>('enhance')
  const [enhancedVersions, setEnhancedVersions] = useState<string[][]>([])
  const [selectedVersions, setSelectedVersions] = useState<string[]>([])
  const [caption, setCaption] = useState('')

  useEffect(() => {
    const fetchMedia = async () => {
      const mediaIds = searchParams.get('media')?.split(',') || []
      const media = await Promise.all(
        mediaIds.map(async (id): Promise<Media> => ({
          id,
          src: await getMediaUrl(id),
          type: id.startsWith('photo_') ? 'photo' : 'video'
        }))
      )
      setSelectedMedia(media)
      const enhanced = media.map(item => 
        item.type === 'photo' ? [item.src, item.src, item.src] : [item.src]
      )
      setEnhancedVersions(enhanced)
      setSelectedVersions(enhanced.map(versions => versions[0]))
    }
    fetchMedia()
  }, [searchParams])

  const handleRegenerateVersion = useCallback((imageIndex: number, versionIndex: number) => {
    console.log(`Regenerating version ${versionIndex} for image ${imageIndex}`)
  }, [])

  const handleVersionSelect = useCallback((imageIndex: number, version: string) => {
    setSelectedVersions(prev => {
      const newVersions = [...prev]
      newVersions[imageIndex] = version
      return newVersions
    })
  }, [])

  const renderEnhanceStep = useMemo(() => (
    <div>
      <h2 className="text-xl font-bold mb-4">Choose Enhanced Versions</h2>
      {selectedMedia.map((media, mediaIndex) => (
        <div key={media.id} className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Media {mediaIndex + 1}</h3>
          <div className="mb-2">
            {media.type === 'photo' ? (
              <Image
                src={media.src}
                alt={`Original media ${mediaIndex + 1}`}
                width={200}
                height={200}
                className="rounded-lg object-cover"
                loading="lazy"
              />
            ) : (
              <video
                src={media.src}
                className="w-full max-w-[200px] rounded-lg"
                controls
                preload="metadata"
              />
            )}
          </div>
          {media.type === 'photo' && (
            <div className="grid grid-cols-3 gap-2">
              {enhancedVersions[mediaIndex].map((version, versionIndex) => (
                <EnhancedVersionButton
                  key={versionIndex}
                  version={version}
                  isSelected={selectedVersions[mediaIndex] === version}
                  onSelect={() => handleVersionSelect(mediaIndex, version)}
                  onRegenerate={() => handleRegenerateVersion(mediaIndex, versionIndex)}
                  label={versionIndex === 0 ? 'Your common edits' : 
                         versionIndex === 1 ? 'Most popular edits' : 'AI\'s edits'}
                />
              ))}
            </div>
          )}
        </div>
      ))}
      <Button className="w-full mt-4" onClick={() => setStep('caption')}>
        Next
      </Button>
    </div>
  ), [selectedMedia, enhancedVersions, selectedVersions, handleVersionSelect, handleRegenerateVersion])

  const renderCaptionStep = useMemo(() => (
    <div>
      <h2 className="text-xl font-bold mb-4">Add Caption</h2>
      <div className="grid grid-cols-2 gap-2 mb-4">
        {selectedMedia.map((media, index) => (
          <div key={media.id} className="relative aspect-square">
            {media.type === 'photo' ? (
              <Image
                src={selectedVersions[index] || media.src}
                alt={`Selected media ${index + 1}`}
                layout="fill"
                objectFit="cover"
                className="rounded-lg"
                loading="lazy"
              />
            ) : (
              <video
                src={media.src}
                className="w-full h-full rounded-lg object-cover"
                muted
                playsInline
                preload="metadata"
              />
            )}
          </div>
        ))}
      </div>
      <Textarea
        placeholder="Write a caption..."
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        className="w-full h-32 mb-4"
      />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="w-full">
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56">
          <DropdownMenuItem>Instagram</DropdownMenuItem>
          <DropdownMenuItem>Twitter</DropdownMenuItem>
          <DropdownMenuItem>Facebook</DropdownMenuItem>
          <DropdownMenuItem>TikTok</DropdownMenuItem>
          <DropdownMenuItem>Save to Device</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  ), [selectedMedia, selectedVersions, caption])

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 p-4">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => step === 'caption' ? setStep('enhance') : window.history.back()}
          >
            <ChevronLeft className="h-6 w-6" />
            <span className="sr-only">Back</span>
          </Button>
          <h1 className="text-2xl font-bold">Create Post</h1>
          <Button variant="ghost" size="icon" onClick={() => window.history.back()}>
            <X className="h-6 w-6" />
            <span className="sr-only">Close</span>
          </Button>
        </div>
        {step === 'enhance' ? renderEnhanceStep : renderCaptionStep}
      </div>
    </div>
  )
}
