"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "../../components/ui/button";
import {
  Zap,
  RefreshCcw,
  Camera,
  Video,
  Settings,
  User,
  LogOut,
  Play,
  ImageIcon, // Rename Image to ImageIcon to avoid conflict
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { uploadPhoto, uploadVideo, type Media, getAllMedia } from "../../services/firebaseService";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { logout } from "../../services/firebaseService";
import { auth } from "../../services/firebaseService";
import Image from 'next/image'; // Add this import for Next.js Image component

type CaptureMode = "photo" | "video";

// Create a new context to store permission status
import { createContext, useContext } from "react";

const PermissionContext = createContext<{
  hasPermission: boolean | null;
  setHasPermission: React.Dispatch<React.SetStateAction<boolean | null>>;
}>({
  hasPermission: null,
  setHasPermission: () => {},
});

export const PermissionProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  return (
    <PermissionContext.Provider value={{ hasPermission, setHasPermission }}>
      {children}
    </PermissionContext.Provider>
  );
};

export const usePermission = () => useContext(PermissionContext);

export default function CameraPage() {
  const [cameraMode, setCameraMode] = useState<CaptureMode>("photo");
  const [isFlashOn, setIsFlashOn] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isFrontCamera, setIsFrontCamera] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const router = useRouter();
  const [captureAnimation, setCaptureAnimation] = useState(false);
  const { hasPermission, setHasPermission } = usePermission();
  const [permissionStatus, setPermissionStatus] =
    useState<PermissionState>("prompt");
  const [cameraDevices, setCameraDevices] = useState<MediaDeviceInfo[]>([]);
  const [currentCameraIndex, setCurrentCameraIndex] = useState<number>(0);
  const [flashAnimation, setFlashAnimation] = useState(false);
  // Add recentMedia state
  const [recentMedia, setRecentMedia] = useState<Media | null>(null);

  // Add useEffect to fetch most recent media on mount
  useEffect(() => {
    const fetchRecentMedia = async () => {
      try {
        const media = await getAllMedia();
        if (media.length > 0) {
          setRecentMedia(media[0]);
        }
      } catch (error) {
        console.error("Error fetching recent media:", error);
      }
    };

    fetchRecentMedia();
  }, [isUploading]); // Add isUploading as dependency to refresh after uploads

  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    try {
      const result = await navigator.permissions.query({
        name: "camera" as PermissionName,
      });
      setPermissionStatus(result.state);
      result.onchange = () => setPermissionStatus(result.state);

      if (result.state === "granted" && cameraDevices.length > 0) {
        startCamera(cameraDevices[currentCameraIndex].deviceId); // Pass the deviceId here
      }
    } catch (error) {
      console.error("Error checking permissions:", error);
      // setPermissionStatus('denied')
    }
  };

  const requestCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setPermissionStatus("granted");
      stream.getTracks().forEach((track) => track.stop()); // Stop the stream immediately
      if (cameraDevices.length > 0) {
        startCamera(cameraDevices[currentCameraIndex].deviceId); // Pass the deviceId here
      }
    } catch (error) {
      console.error("Error requesting camera permission:", error);
      // setPermissionStatus('denied')
    }
  };

  const startCamera = async (deviceId: string) => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          deviceId: { exact: deviceId }, // Use exact to ensure the correct camera is selected
        },
        audio: cameraMode === "video",
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
      }
      mediaStreamRef.current = stream;

      applyFlashSetting();
    } catch (error) {
      console.error("Error accessing camera:", error);
      // setPermissionStatus('denied')
    }
  };

  const applyFlashSetting = () => {
    if (mediaStreamRef.current) {
      const track = mediaStreamRef.current.getVideoTracks()[0];
      if ("torch" in track.getCapabilities()) {
        track
          .applyConstraints({
            advanced: [{ torch: isFlashOn } as MediaTrackConstraintSet],
          })
          .catch((error) =>
            console.error("Error applying flash setting:", error),
          );
      }
    }
  };

  const toggleFlash = async () => {
    setIsFlashOn((prev) => !prev);
    applyFlashSetting();
  };

  const captureAndUploadPhoto = async () => {
    if (videoRef.current) {
      // Trigger flash animation
      setFlashAnimation(true);
      
      try {
        const canvas = document.createElement("canvas");
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext("2d");
        
        if (!ctx) {
          throw new Error("Could not get canvas context");
        }
        
        ctx.drawImage(videoRef.current, 0, 0);
        const photoDataUrl = canvas.toDataURL("image/jpeg", 0.8);

        // Reset flash animation after a very brief moment
        setTimeout(() => {
          setFlashAnimation(false);
        }, 50); // Short delay to ensure the black screen is visible

        setIsUploading(true);
        const fileName = `photo_${Date.now()}.jpg`;
        const downloadUrl = await uploadPhoto(photoDataUrl, fileName);
        
        if (downloadUrl && auth.currentUser?.uid) {
          setRecentMedia({
            id: fileName,
            src: downloadUrl,
            type: 'photo',
            date: new Date(),
            userId: auth.currentUser.uid
          });
        }
      } catch (error) {
        console.error("Error capturing/uploading photo:", error);
        if (error instanceof Error) {
          console.error("Error message:", error.message);
        }
        setFlashAnimation(false); // Ensure flash animation is reset on error
      } finally {
        setIsUploading(false);
      }
    }
  };

  const startRecording = () => {
    if (mediaStreamRef.current) {
      // Create a new stream that includes both video and audio
      navigator.mediaDevices
        .getUserMedia({ video: false, audio: true })
        .then((audioStream) => {
          const videoTrack = mediaStreamRef.current!.getVideoTracks()[0];
          const audioTrack = audioStream.getAudioTracks()[0];
          const combinedStream = new MediaStream([videoTrack, audioTrack]);

          mediaRecorderRef.current = new MediaRecorder(combinedStream);
          chunksRef.current = [];

          mediaRecorderRef.current.ondataavailable = (event) => {
            if (event.data.size > 0) {
              chunksRef.current.push(event.data);
            }
          };

          mediaRecorderRef.current.onstop = async () => {
            audioTrack.stop(); // Stop the audio track when recording stops
            const blob = new Blob(chunksRef.current, { type: "video/webm" });
            setIsUploading(true);
            try {
              const fileName = `video_${Date.now()}.webm`;
              const downloadUrl = await uploadVideo(blob, fileName);
              console.log(
                "Video uploaded successfully. Download URL:",
                downloadUrl,
              );
            } catch (error) {
              console.error("Error uploading video:", error);
            } finally {
              setIsUploading(false);
            }
          };

          mediaRecorderRef.current.start();
          setIsRecording(true);
        })
        .catch((error) => {
          console.error("Error accessing audio for recording:", error);
          // Fallback to video-only recording if audio access fails
          startVideoOnlyRecording();
        });
    }
  };

  const startVideoOnlyRecording = () => {
    if (mediaStreamRef.current) {
      mediaRecorderRef.current = new MediaRecorder(mediaStreamRef.current);
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        setIsUploading(true);
        try {
          const fileName = `video_${Date.now()}.webm`;
          const downloadUrl = await uploadVideo(blob, fileName);
          console.log(
            "Video uploaded successfully. Download URL:",
            downloadUrl,
          );
          // Removed the router.push('/gallery') line
        } catch (error) {
          console.error("Error uploading video:", error);
        } finally {
          setIsUploading(false);
        }
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleCapture = useCallback(() => {
    if (cameraMode === "photo") {
      captureAndUploadPhoto();
    } else {
      if (isRecording) {
        stopRecording();
      } else {
        startRecording();
      }
    }
  }, [cameraMode, isRecording]);

  const switchCamera = useCallback(() => {
    if (permissionStatus === "granted" && cameraDevices.length > 1) {
      setCurrentCameraIndex(prevIndex => {
        let nextIndex = 0;
        if (prevIndex === 0) {
          nextIndex = 1;
        } else if (prevIndex === 1) {
          nextIndex = 0;
        }
        startCamera(cameraDevices[nextIndex].deviceId)
        return nextIndex
      })
    }
    
  }, [cameraDevices]);

  useEffect(() => {
    if (permissionStatus === "granted" && cameraDevices.length > 0) {
      startCamera(cameraDevices[currentCameraIndex].deviceId);
    }
  }, [currentCameraIndex, permissionStatus, cameraDevices]);

  const toggleSettings = () => {
    setIsSettingsOpen(!isSettingsOpen);
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/auth/login-signup");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const switchMode = (mode: CaptureMode) => {
    setCameraMode(mode);
    // No need to restart the camera when switching modes
  };

  useEffect(() => {
    if (permissionStatus === "granted") {
      enumerateDevices();
    }
  }, [permissionStatus]);

  const enumerateDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(
        (device) => device.kind === "videoinput",
      );

      console.log("Video Devices:", videoDevices); // Log devices for debugging

      if (videoDevices.length > 0) {
        setCameraDevices(videoDevices);
        setCurrentCameraIndex(0); // Start with the first camera
        startCamera(videoDevices[0].deviceId); // Pass the deviceId here
      } else {
        console.error("No video devices found");
      }
    } catch (error) {
      console.error("Error enumerating devices:", error);
    }
  };

  if (permissionStatus === "prompt") {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-black text-white">
        <Button onClick={requestCameraPermission}>
          Grant Camera Permission
        </Button>
      </div>
    );
  }

  if (permissionStatus === "denied") {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-black text-white">
        <p>
          Camera permission is required to use this feature. Please enable it in
          your browser settings.
        </p>
      </div>
    );
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
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
      </motion.div>

      {/* Capture Animation Ring */}
      <AnimatePresence>
        {captureAnimation && (
          <motion.div
            className="absolute inset-0 border-4 border-white pointer-events-none"
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.1 }} // 100ms duration
          />
        )}
      </AnimatePresence>

      {/* Top Controls */}
      <motion.div
        className="absolute top-0 left-0 right-0 flex justify-between p-4"
        initial={{ y: -50 }}
        animate={{ y: 0 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 120 }}
      >
        <Button variant="ghost" size="icon" onClick={toggleFlash}>
          <Zap
            className={`h-6 w-6 ${isFlashOn ? "text-yellow-300" : "text-white"}`}
          />
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
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={handleLogout}
            >
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
        transition={{ delay: 0.2, type: "spring", stiffness: 120 }}
      >
        <motion.div whileTap={{ scale: 0.9 }}>
          <Button
            variant="outline"
            size="icon"
            className={`w-20 h-20 rounded-full border-4 ${isRecording ? "border-red-500" : "border-white"}`}
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
                {cameraMode === "photo" ? (
                  <Camera className="h-10 w-10" />
                ) : (
                  <Video className="h-10 w-10" />
                )}
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
          className={`text-sm ${cameraMode === "photo" ? "font-bold text-white" : "text-gray-400"}`}
          onClick={() => switchMode("photo")}
        >
          Photo
        </button>
        <button
          className={`text-sm ${cameraMode === "video" ? "font-bold text-white" : "text-gray-400"}`}
          onClick={() => switchMode("video")}
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
          <Button
            variant="ghost"
            size="icon"
            className="w-14 h-14 p-0 overflow-hidden rounded-lg bg-black bg-opacity-50 hover:bg-opacity-75" // Increased from w-12 h-12 to w-14 h-14
          >
            {recentMedia ? (
              recentMedia.type === 'photo' ? (
                <Image
                  src={recentMedia.src}
                  alt="Latest photo"
                  width={112}  // Increased from 48 to 112 for HD quality
                  height={112} // Increased from 48 to 112 for HD quality
                  className="w-full h-full object-cover"
                  priority
                  quality={100}  // Added maximum quality
                />
              ) : (
                <div className="w-full h-full relative">
                  <video
                    src={recentMedia.src}
                    className="w-full h-full object-cover"
                    playsInline  // Added for better mobile support
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Play className="w-5 h-5 text-white opacity-70" /> {/* Increased play icon size */}
                  </div>
                </div>
              )
            ) : (
              <ImageIcon className="h-7 w-7" /> // Increased icon size
            )}
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
        <Button
          variant="ghost"
          size="icon"
          onClick={switchCamera}
          className="w-14 h-14 bg-black bg-opacity-50 hover:bg-opacity-75" // Increased from default size to w-14 h-14
        >
          <RefreshCcw className="h-7 w-7" /> {/* Increased icon size */}
          <span className="sr-only">Switch Camera</span>
        </Button>
      </motion.div>

      {/* Accessibility announcement for mode change */}
      <div className="sr-only" aria-live="polite">
        {cameraMode === "photo"
          ? "Photo mode activated"
          : "Video mode activated"}
      </div>

      {/* Black Screen Animation */}
      <AnimatePresence>
        {flashAnimation && (
          <motion.div
            className="absolute inset-0 bg-black pointer-events-none z-50"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.001 }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
