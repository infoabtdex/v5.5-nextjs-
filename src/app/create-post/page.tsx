'use client'

import React, { useState, useEffect } from 'react'
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
import Image from 'next/image'
import { getMediaUrl } from '@/services/firebaseService'

interface Media {
  id: string
  src: string
  type: 'photo' | 'video'
}

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
      // Simulate AI enhancement for photos only
      const enhanced = media.map(item => 
        item.type === 'photo' ? [item.src, item.src, item.src] : [item.src]
      )
      setEnhancedVersions(enhanced)
      setSelectedVersions(enhanced.map(versions => versions[0]))
    }
    fetchMedia()
  }, [searchParams])

  const handleRegenerateVersion = (imageIndex: number, versionIndex: number) => {
    // In a real app, this would trigger AI enhancement
    console.log(`Regenerating version ${versionIndex} for image ${imageIndex}`)
  }

  const handleVersionSelect = (imageIndex: number, version: string) => {
    setSelectedVersions(prev => {
      const newVersions = [...prev]
      newVersions[imageIndex] = version
      return newVersions
    })
  }

  const renderStep = () => {
    switch (step) {
      case 'enhance':
        return (
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
                    />
                  ) : (
                    <video
                      src={media.src}
                      className="w-full max-w-[200px] rounded-lg"
                      controls
                    />
                  )}
                </div>
                {media.type === 'photo' && (
                  <div className="grid grid-cols-3 gap-2">
                    {enhancedVersions[mediaIndex].map((version, versionIndex) => (
                      <div key={versionIndex} className="relative">
                        <button
                          className={`relative w-full aspect-square overflow-hidden rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            selectedVersions[mediaIndex] === version ? 'ring-2 ring-blue-500' : ''
                          }`}
                          onClick={() => handleVersionSelect(mediaIndex, version)}
                        >
                          <Image src={version} alt={`Enhanced version ${versionIndex + 1}`} layout="fill" objectFit="cover" />
                        </button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="absolute top-1 right-1 bg-black bg-opacity-50"
                          onClick={() => handleRegenerateVersion(mediaIndex, versionIndex)}
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <Button className="w-full mt-4" onClick={() => setStep('caption')}>
              Next
            </Button>
          </div>
        )
      case 'caption':
        return (
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
                    />
                  ) : (
                    <video
                      src={media.src}
                      className="w-full h-full rounded-lg object-cover"
                      muted
                      playsInline
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
        )
    }
  }

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
        {renderStep()}
      </div>
    </div>
  )
}
