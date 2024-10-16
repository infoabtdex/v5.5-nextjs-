'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from "../../components/ui/button"
import { Image, Zap, RefreshCcw, Camera, Video, Settings, User, LogOut } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { uploadPhoto, uploadVideo } from '../../services/firebaseService'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { logout } from '../../services/firebaseService'

type CaptureMode = 'photo' | 'video'

export default function CameraPage() {
  const [cameraMode, setCameraMode] = useState<CaptureMode>('photo')
  const [isFlashOn, setIsFlashOn] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [isFrontCamera, setIsFrontCamera] = useState(false)
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const router = useRouter()

  useEffect(() => {
    requestCameraPermission()
  }, [])

  useEffect(() => {
    if (hasPermission) {
      startCamera()
    }
  }, [hasPermission, isFrontCamera])

  const requestCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      setHasPermission(true)
      stream.getTracks().forEach(track => track.stop()) // Stop the stream immediately
    } catch (error) {
      console.error('Error requesting camera permission:', error)
      setHasPermission(false)
    }
  }

  const startCamera = async () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop())
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: isFrontCamera ? 'user' : 'environment',
        },
        audio: true
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      mediaStreamRef.current = stream

      // Apply flash if it's on
      if (isFlashOn) {
        const track = stream.getVideoTracks()[0]
        // Check if the torch feature is supported
        if ('torch' in track.getCapabilities()) {
          await (track as any).applyConstraints({ advanced: [{ torch: true }] })
        }
      }
    } catch (error) {
      console.error('Error accessing camera:', error)
      setHasPermission(false)
    }
  }

  const toggleFlash = async () => {
    setIsFlashOn(prev => !prev)
    if (mediaStreamRef.current) {
      const track = mediaStreamRef.current.getVideoTracks()[0]
      // Check if the torch feature is supported
      if ('torch' in track.getCapabilities()) {
        await (track as any).applyConstraints({ advanced: [{ torch: !isFlashOn }] })
      }
    }
  }

  const captureAndUploadPhoto = async () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas')
      canvas.width = videoRef.current.videoWidth
      canvas.height = videoRef.current.videoHeight
      canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0)
      const photoDataUrl = canvas.toDataURL('image/jpeg')
      
      setIsUploading(true)
      try {
        const fileName = `photo_${Date.now()}.jpg`
        const downloadUrl = await uploadPhoto(photoDataUrl, fileName)
        console.log('Photo uploaded successfully. Download URL:', downloadUrl)
        // Removed the router.push('/gallery') line
      } catch (error) {
        console.error('Error uploading photo:', error)
      } finally {
        setIsUploading(false)
      }
    }
  }

  const startRecording = () => {
    if (mediaStreamRef.current) {
      mediaRecorderRef.current = new MediaRecorder(mediaStreamRef.current)
      chunksRef.current = []

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorderRef.current.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' })
        setIsUploading(true)
        try {
          const fileName = `video_${Date.now()}.webm`
          const downloadUrl = await uploadVideo(blob, fileName)
          console.log('Video uploaded successfully. Download URL:', downloadUrl)
          // Removed the router.push('/gallery') line
        } catch (error) {
          console.error('Error uploading video:', error)
        } finally {
          setIsUploading(false)
        }
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
      captureAndUploadPhoto()
    } else {
      if (isRecording) {
        stopRecording()
      } else {
        startRecording()
      }
    }
  }, [cameraMode, isRecording])

  const switchCamera = () => {
    setIsFrontCamera(prev => !prev)
  }

  const toggleSettings = () => {
    setIsSettingsOpen(!isSettingsOpen)
  }

  const handleLogout = async () => {
    try {
      await logout()
      router.push('/auth/login-signup')
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  const switchMode = (mode: CaptureMode) => {
    setCameraMode(mode)
  }

  if (hasPermission === false) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-black text-white">
        <p>Camera permission is required to use this feature.</p>
      </div>
    )
  }

  return (
    <motion.div 
      className="h-screen w-full relative bg-black text-white overflow-hidden"
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
        <Button variant="ghost" size="icon" onClick={toggleFlash}>
          <Zap className={`h-6 w-6 ${isFlashOn ? 'text-yellow-300' : 'text-white'}`} />
          <span className="sr-only">Toggle Flash</span>
        </Button>
        <Button variant="ghost" size="icon" onClick={toggleSettings}>
          <Settings className="h-6 w-6" />
          <span className="sr-only">Settings</span>
        </Button>
      </motion.div>

      {/* Settings Menu */}
      <AnimatePresence>
        {isSettingsOpen && (
          <motion.div
            className="absolute top-14 right-4 bg-black bg-opacity-75 rounded-lg p-2"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Link href="/profile">
              <Button variant="ghost" className="w-full justify-start">
                <User className="mr-2 h-4 w-4" />
                Profile
              </Button>
            </Link>
            <Button variant="ghost" className="w-full justify-start" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Capture Button */}
      <motion.div 
        className="absolute bottom-20 left-0 right-0 flex justify-center"
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
            disabled={isUploading}
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

      {/* Mode Selector */}
      <motion.div 
        className="absolute bottom-4 left-0 right-0 flex justify-center space-x-8"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <button
          className={`text-sm ${cameraMode === 'photo' ? 'font-bold text-white' : 'text-gray-400'}`}
          onClick={() => switchMode('photo')}
        >
          Photo
        </button>
        <button
          className={`text-sm ${cameraMode === 'video' ? 'font-bold text-white' : 'text-gray-400'}`}
          onClick={() => switchMode('video')}
        >
          Video
        </button>
      </motion.div>

      {/* Gallery and Camera Switch Buttons */}
      <motion.div 
        className="absolute bottom-4 left-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Link href="/gallery">
          <Button variant="ghost" size="icon" className="bg-black bg-opacity-50 hover:bg-opacity-75">
            <Image className="h-6 w-6" />
            <span className="sr-only">Go to Gallery</span>
          </Button>
        </Link>
      </motion.div>

      <motion.div 
        className="absolute bottom-4 right-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Button variant="ghost" size="icon" onClick={switchCamera} className="bg-black bg-opacity-50 hover:bg-opacity-75">
          <RefreshCcw className="h-6 w-6" />
          <span className="sr-only">Switch Camera</span>
        </Button>
      </motion.div>

      {/* Accessibility announcement for mode change */}
      <div className="sr-only" aria-live="polite">
        {cameraMode === 'photo' ? 'Photo mode activated' : 'Video mode activated'}
      </div>
    </motion.div>
  )
}
