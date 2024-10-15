'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from "../../components/ui/button"
import { Home, Zap, MoreVertical, Camera, Video, RefreshCcw, X, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { uploadPhoto, deletePhoto } from '../../services/firebaseService'

type CaptureMode = 'photo' | 'video'

export default function CameraPage() {
  const [cameraMode, setCameraMode] = useState<CaptureMode>('photo')
  const [startX, setStartX] = useState(0)
  const [isFlashOn, setIsFlashOn] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [isFrontCamera, setIsFrontCamera] = useState(false)
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

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

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop())
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

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas')
      canvas.width = videoRef.current.videoWidth
      canvas.height = videoRef.current.videoHeight
      canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0)
      const photoDataUrl = canvas.toDataURL('image/jpeg')
      setCapturedImage(photoDataUrl)
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

  const switchCamera = () => {
    setIsFrontCamera(prev => !prev)
  }

  const proceedToEditing = async () => {
    if (capturedImage) {
      setIsUploading(true)
      try {
        const fileName = `photo_${Date.now()}.jpg`
        const downloadUrl = await uploadPhoto(capturedImage, fileName)
        console.log('Photo uploaded successfully. Download URL:', downloadUrl)
        // Here you would typically navigate to the editing screen
        // and pass the downloadUrl or fileName for further processing
      } catch (error) {
        console.error('Error uploading photo:', error)
        // Handle the error (e.g., show an error message to the user)
      } finally {
        setIsUploading(false)
      }
    }
  }

  const retakePhoto = async () => {
    if (capturedImage) {
      try {
        // Assuming the file name is stored somewhere or can be derived from the capturedImage
        const fileName = `photo_${Date.now()}.jpg` // This should be the actual file name used during upload
        await deletePhoto(fileName)
        console.log('Photo deleted successfully')
      } catch (error) {
        console.error('Error deleting photo:', error)
        // Handle the error (e.g., show an error message to the user)
      }
    }
    setCapturedImage(null)
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
        {capturedImage ? (
          <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
        ) : (
          <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
        )}
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
        <Button variant="ghost" size="icon" onClick={switchCamera}>
          <RefreshCcw className="h-6 w-6" />
          <span className="sr-only">Switch Camera</span>
        </Button>
      </motion.div>

      {/* Capture Button */}
      {!capturedImage && (
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
      )}

      {/* Preview Controls */}
      {capturedImage && (
        <motion.div 
          className="absolute bottom-10 left-0 right-0 flex justify-center space-x-4"
          initial={{ y: 50 }}
          animate={{ y: 0 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 120 }}
        >
          <Button variant="outline" size="icon" onClick={retakePhoto} disabled={isUploading}>
            <X className="h-6 w-6" />
            <span className="sr-only">Retake</span>
          </Button>
          <Button variant="outline" size="icon" onClick={proceedToEditing} disabled={isUploading}>
            {isUploading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <RefreshCcw className="h-6 w-6" />
              </motion.div>
            ) : (
              <Check className="h-6 w-6" />
            )}
            <span className="sr-only">Proceed</span>
          </Button>
        </motion.div>
      )}

      {/* Mode Indicator */}
      {!capturedImage && (
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
      )}

      {/* Accessibility announcement for mode change */}
      <div className="sr-only" aria-live="polite">
        {cameraMode === 'photo' ? 'Photo mode activated' : 'Video mode activated'}
      </div>
    </motion.div>
  )
}