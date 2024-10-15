'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Home, Zap, MoreVertical, Camera, Video } from 'lucide-react'
import { Button } from "../../components/ui/button"
import { motion, AnimatePresence } from 'framer-motion'

type CaptureMode = 'photo' | 'video'

export default function CameraPage() {
  const [cameraMode, setCameraMode] = useState<CaptureMode>('photo')
  const [startX, setStartX] = useState(0)
  const [isFlashOn, setIsFlashOn] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  useEffect(() => {
    startCamera()
    return () => {
      stopCamera()
    }
  }, [])

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (error) {
      console.error('Error accessing camera:', error)
    }
  }

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      const tracks = stream.getTracks()
      tracks.forEach(track => track.stop())
    }
  }

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

  const toggleFlash = () => {
    setIsFlashOn(prev => !prev)
    // Implement actual flash functionality here
  }

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas')
      canvas.width = videoRef.current.videoWidth
      canvas.height = videoRef.current.videoHeight
      canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0)
      const photoDataUrl = canvas.toDataURL('image/jpeg')
      console.log('Photo captured:', photoDataUrl)
      // Here you would typically save or process the photo
    }
  }

  const startRecording = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      mediaRecorderRef.current = new MediaRecorder(stream)
      chunksRef.current = []

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' })
        const videoUrl = URL.createObjectURL(blob)
        console.log('Video recorded:', videoUrl)
        // Here you would typically save or process the video
      }

      mediaRecorderRef.current.start()
      setIsRecording(true)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const handleCapture = useCallback(() => {
    if (cameraMode === 'photo') {
      capturePhoto()
    } else {
      if (isRecording) {
        stopRecording()
      } else {
        startRecording()
      }
    }
  }, [cameraMode, isRecording])

  return (
    <motion.div 
      className="h-screen w-full relative bg-black text-white overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Camera Viewfinder */}
      <motion.div 
        className="absolute inset-0 bg-gray-900"
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
      </motion.div>

      {/* Top Controls */}
      <motion.div 
        className="absolute top-0 left-0 right-0 flex justify-between p-4"
        initial={{ y: -50 }}
        animate={{ y: 0 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 120 }}
      >
        <Button variant="ghost" size="icon">
          <Home className="h-6 w-6" />
          <span className="sr-only">Return Home</span>
        </Button>
        <AnimatePresence>
          {isFlashOn && (
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              className="absolute inset-0 bg-white bg-opacity-20"
            />
          )}
        </AnimatePresence>
        <Button variant="ghost" size="icon" onClick={toggleFlash}>
          <Zap className={`h-6 w-6 ${isFlashOn ? 'text-yellow-300' : 'text-white'}`} />
          <span className="sr-only">Toggle Flash</span>
        </Button>
        <Button variant="ghost" size="icon">
          <MoreVertical className="h-6 w-6" />
          <span className="sr-only">Additional Menu</span>
        </Button>
      </motion.div>

      {/* Capture Button */}
      <motion.div 
        className="absolute bottom-10 left-0 right-0 flex justify-center"
        initial={{ y: 50 }}
        animate={{ y: 0 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 120 }}
      >
        <motion.div
          whileTap={{ scale: 0.9 }}
        >
          <Button 
            variant="outline" 
            size="icon" 
            className={`w-20 h-20 rounded-full border-4 ${isRecording ? 'border-red-500' : 'border-white'}`}
            onClick={handleCapture}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={cameraMode}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                transition={{ duration: 0.2 }}
              >
                {cameraMode === 'photo' ? <Camera className="h-10 w-10" /> : <Video className="h-10 w-10" />}
              </motion.div>
            </AnimatePresence>
          </Button>
        </motion.div>
      </motion.div>

      {/* Mode Indicator */}
      <motion.div 
        className="absolute bottom-4 left-0 right-0 flex justify-center space-x-4"
        initial={{ y: 50 }}
        animate={{ y: 0 }}
        transition={{ delay: 0.3, type: 'spring', stiffness: 120 }}
      >
        <motion.span 
          className={`text-sm ${cameraMode === 'photo' ? 'font-bold' : ''}`}
          animate={{ scale: cameraMode === 'photo' ? 1.1 : 1 }}
        >
          Photo
        </motion.span>
        <motion.span 
          className={`text-sm ${cameraMode === 'video' ? 'font-bold' : ''}`}
          animate={{ scale: cameraMode === 'video' ? 1.1 : 1 }}
        >
          Video
        </motion.span>
      </motion.div>

      {/* Accessibility announcement for mode change */}
      <div className="sr-only" aria-live="polite">
        {cameraMode === 'photo' ? 'Photo mode activated' : 'Video mode activated'}
      </div>
    </motion.div>
  )
}
