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
import { getPhotoUrl } from '@/services/firebaseService'

interface Photo {
  id: string
  src: string
}

export default function CreatePostPage() {
  const searchParams = useSearchParams()
  const [selectedPhotos, setSelectedPhotos] = useState<Photo[]>([])
  const [step, setStep] = useState<'enhance' | 'caption'>('enhance')
  const [enhancedVersions, setEnhancedVersions] = useState<string[][]>([])
  const [selectedVersions, setSelectedVersions] = useState<string[]>([])
  const [caption, setCaption] = useState('')

  useEffect(() => {
    const fetchPhotos = async () => {
      const photoIds = searchParams.get('photos')?.split(',') || []
      const photos = await Promise.all(
        photoIds.map(async (id) => ({
          id,
          src: await getPhotoUrl(id)
        }))
      )
      setSelectedPhotos(photos)
      // For now, we'll use the original images as "enhanced" versions
      const enhanced = photos.map(photo => [photo.src, photo.src, photo.src])
      setEnhancedVersions(enhanced)
      setSelectedVersions(enhanced.map(versions => versions[0]))
    }
    fetchPhotos()
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
            {selectedPhotos.map((photo, imageIndex) => (
              <div key={photo.id} className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Image {imageIndex + 1}</h3>
                <div className="mb-2 flex justify-center">
                  <Image
                    src={photo.src}
                    alt={`Original image ${imageIndex + 1}`}
                    width={200}
                    height={200}
                    className="rounded-lg object-cover"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {enhancedVersions[imageIndex].map((version, versionIndex) => (
                    <div key={versionIndex} className="relative">
                      <button
                        className={`relative w-full aspect-square overflow-hidden rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          selectedVersions[imageIndex] === version ? 'ring-2 ring-blue-500' : ''
                        }`}
                        onClick={() => handleVersionSelect(imageIndex, version)}
                      >
                        <Image src={version} alt={`Enhanced version ${versionIndex + 1}`} layout="fill" objectFit="cover" />
                      </button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="absolute top-1 right-1 bg-black bg-opacity-50"
                        onClick={() => handleRegenerateVersion(imageIndex, versionIndex)}
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
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
              {selectedPhotos.map((photo, index) => (
                <div key={photo.id} className="relative aspect-square">
                  <Image
                    src={selectedVersions[index] || photo.src}
                    alt={`Selected image ${index + 1}`}
                    layout="fill"
                    objectFit="cover"
                    className="rounded-lg"
                  />
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
