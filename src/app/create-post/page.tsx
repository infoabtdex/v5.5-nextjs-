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

export default function CreatePostPage() {
  const searchParams = useSearchParams()
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([])
  const [step, setStep] = useState<'enhance' | 'caption'>('enhance')
  const [enhancedVersions, setEnhancedVersions] = useState<string[][]>([])
  const [selectedVersions, setSelectedVersions] = useState<string[]>([])
  const [caption, setCaption] = useState('')

  useEffect(() => {
    const photos = searchParams.get('photos')
    if (photos) {
      setSelectedPhotos(photos.split(','))
      // Simulate AI enhancement
      const enhanced = photos.split(',').map(() => [
        '/placeholder.svg?height=400&width=400',
        '/placeholder.svg?height=400&width=400',
        '/placeholder.svg?height=400&width=400',
      ])
      setEnhancedVersions(enhanced)
      setSelectedVersions(enhanced.map(versions => versions[0]))
    }
  }, [searchParams])

  const handleRegenerateVersion = (imageIndex: number, versionIndex: number) => {
    setEnhancedVersions(prev => {
      const newVersions  = [...prev]
      newVersions[imageIndex][versionIndex] = `/placeholder.svg?height=400&width=400&regenerated=${Date.now()}`
      return newVersions
    })
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
            {enhancedVersions.map((versions, imageIndex) => (
              <div key={imageIndex} className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Image {imageIndex + 1}</h3>
                <div className="grid grid-cols-3 gap-2">
                  {versions.map((version, versionIndex) => (
                    <div key={versionIndex} className="relative">
                      <button
                        className={`relative aspect-square overflow-hidden rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          selectedVersions[imageIndex] === version ? 'ring-2 ring-blue-500' : ''
                        }`}
                        onClick={() => handleVersionSelect(imageIndex, version)}
                      >
                        <img src={version} alt={`Enhanced version ${versionIndex + 1}`} className="object-cover w-full h-full" />
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
            <div className="flex space-x-2 mb-4 overflow-x-auto">
              {selectedVersions.map((version, index) => (
                <img key={index} src={version} alt={`Selected image ${index + 1}`} className="w-20 h-20 object-cover rounded-lg" />
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
            onClick={() => setStep('enhance')}
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