'use client'

import React, { useState, useRef, useCallback } from 'react'
import { Home, Zap, MoreVertical, Image, RotateCcw } from 'lucide-react'
import { Button } from "../../components/ui/button"

export default function CameraPage() {
  const [cameraMode, setCameraMode] = useState('photo')
  const [startX, setStartX] = useState(0)
  const modeIndicatorRef = useRef<HTMLDivElement>(null)

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartX(e.touches[0].clientX)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    const currentX = e.touches[0].clientX
    const diff = startX - currentX

    if (Math.abs(diff) > 50) {
      setCameraMode(prev => prev === 'photo' ? 'video' : 'photo')
      setStartX(currentX)
    }
  }

  const handleCapture = useCallback(() => {
    // Implement capture logic here
    console.log(`Captured ${cameraMode}`)
  }, [cameraMode])

  return (
    <div 
      className="h-screen w-full relative bg-black text-white"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
    >
      {/* Camera Viewfinder */}
      <div className="absolute inset-0 bg-gray-900">
        {/* This would be replaced with actual camera feed */}
      </div>

      {/* Top Controls */}
      <div className="absolute top-0 left-0 right-0 flex justify-between p-4">
        <Button variant="ghost" size="icon">
          <Home className="h-6 w-6" />
          <span className="sr-only">Return Home</span>
        </Button>
        <Button variant="ghost" size="icon">
          <Zap className="h-6 w-6" />
          <span className="sr-only">Flash</span>
        </Button>
        <Button variant="ghost" size="icon">
          <MoreVertical className="h-6 w-6" />
          <span className="sr-only">Additional Menu</span>
        </Button>
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-20 left-0 right-0 flex justify-around items-center px-4">
        <Button variant="ghost" size="icon" className="bg-gray-800 rounded-full p-2">
          <Image className="h-6 w-6" />
          <span className="sr-only">Gallery</span>
        </Button>
        <button 
          className="w-20 h-20 bg-white rounded-full border-4 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          onClick={handleCapture}
          aria-label={`Capture ${cameraMode}`}
        />
        <Button variant="ghost" size="icon" className="bg-gray-800 rounded-full p-2">
          <RotateCcw className="h-6 w-6" />
          <span className="sr-only">Switch Camera</span>
        </Button>
      </div>

      {/* Mode Indicator */}
      <div className="absolute bottom-4 left-0 right-0 px-4">
        <div className="bg-gray-800 rounded-full h-1 w-16 mx-auto relative">
          <div 
            ref={modeIndicatorRef}
            className="absolute top-0 left-0 w-1/2 h-full bg-white rounded-full transition-transform duration-300 ease-in-out"
            style={{ transform: `translateX(${cameraMode === 'photo' ? '0%' : '100%'})` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-400">
          <span>Photo</span>
          <span>Video</span>
        </div>
      </div>

      {/* Accessibility announcement for mode change */}
      <div className="sr-only" aria-live="polite">
        {cameraMode === 'photo' ? 'Photo mode activated' : 'Video mode activated'}
      </div>
    </div>
  )
}