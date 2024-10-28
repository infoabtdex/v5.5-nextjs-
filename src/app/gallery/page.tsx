"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  ChevronRight,
  ChevronDown,
  ArrowLeft,
  X,
  Trash,
  Edit,
  Share2,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useVirtualizer } from '@tanstack/react-virtual';
import dynamic from 'next/dynamic';
import { imageCache } from '@/services/imageCache';
import { useInView } from 'react-intersection-observer';

// Dynamically import PhotoCard with no SSR
const PhotoCard = dynamic(() => import('@/components/PhotoCard'), {
  ssr: false,
  loading: () => (
    <div className="aspect-square bg-gray-200 animate-pulse rounded-lg" />
  ),
});

import {
  getAllMedia,
  deletePhoto,
  deleteVideo,
} from "@/services/firebaseService";
import Image from "next/image";
import { useSwipeable } from "react-swipeable";
import { type Media } from "@/services/firebaseService";
import { useRouter } from "next/navigation";
import { getAuth, onAuthStateChanged } from "firebase/auth";

interface Session {
  id: string;
  date: string;
  media: Media[];
}

const groupMediaByDate = (media: Media[]): Session[] => {
  const grouped = media.reduce(
    (acc, media) => {
      const date = media.date.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(media);
      return acc;
    },
    {} as Record<string, Media[]>,
  );

  return Object.entries(grouped)
    .map(([date, media], index) => ({
      id: `session-${index}`,
      date,
      media: media.sort((a, b) => b.date.getTime() - a.date.getTime()),
    }))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

interface VirtualItem {
  index: number;
  start: number;
  end: number;
  size: number;
  lane: number;
}

// Update the LazyImage component
const LazyImage = React.memo(({ src, alt, ...props }: { src: string; alt: string; [key: string]: any }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const { ref, inView } = useInView({
    triggerOnce: true,
    rootMargin: '200px 0px',
  });

  useEffect(() => {
    if (inView) {
      const img = document.createElement('img');
      img.src = src;
      img.onload = () => setIsLoaded(true);
    }
  }, [inView, src]);

  return (
    <div ref={ref} className="relative w-full h-full">
      {inView && (
        <Image
          src={src}
          alt={alt}
          {...props}
          className={`transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          } ${props.className || ''}`}
        />
      )}
      {(!isLoaded || !inView) && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse rounded-lg" />
      )}
    </div>
  );
});

LazyImage.displayName = 'LazyImage';

export default function GalleryPage() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  
  // State hooks
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedMedia, setSelectedMedia] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedSessions, setExpandedSessions] = useState<string[]>([]);
  const [expandedMedia, setExpandedMedia] = useState<Media | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [direction, setDirection] = useState<"left" | "right" | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [visibleSessions, setVisibleSessions] = useState<Session[]>([]);

  // Initialize virtualizer after sessions state is declared
  const rowVirtualizer = useVirtualizer({
    count: sessions.length,
    getScrollElement: () => containerRef.current,
    estimateSize: () => 300,
    overscan: 5,
  });

  // Update visible sessions when scrolling
  useEffect(() => {
    if (sessions.length > 0) {
      const visibleRange = rowVirtualizer.getVirtualItems();
      const visibleSessionsData = visibleRange.map(
        (virtualRow: VirtualItem) => sessions[virtualRow.index]
      );
      setVisibleSessions(visibleSessionsData);
    }
  }, [sessions, rowVirtualizer.getVirtualItems()]);

  // All callback hooks
  const handleMediaSelect = useCallback((mediaId: string) => {
    setSelectedMedia((prev) =>
      prev.includes(mediaId)
        ? prev.filter((id) => id !== mediaId)
        : [...prev, mediaId],
    );
  }, []);

  const handleDelete = useCallback(async (media: Media) => {
    try {
      if (media.type === "photo") {
        await deletePhoto(media.id);
      } else {
        await deleteVideo(media.id);
      }
      setSessions((prevSessions) =>
        prevSessions
          .map((session) => ({
            ...session,
            media: session.media.filter((item) => item.id !== media.id),
          }))
          .filter((session) => session.media.length > 0),
      );
      setExpandedMedia(null);
    } catch (error) {
      console.error("Error deleting media:", error);
    }
  }, []);

  const handleEdit = useCallback((mediaId: string) => {
    console.log("Edit media:", mediaId);
  }, []);

  const handleShare = useCallback((mediaId: string) => {
    console.log("Share media:", mediaId);
  }, []); 

  const toggleSession = useCallback((sessionId: string) => {
    setExpandedSessions((prev) =>
      prev.includes(sessionId)
        ? prev.filter((id) => id !== sessionId)
        : [...prev, sessionId],
    );
  }, []);

  const handleMediaClick = useCallback(
    (media: Media) => {
      if (isSelectionMode) {
        handleMediaSelect(media.id);
      } else {
        const allMedia = sessions.flatMap((s) => s.media);
        const index = allMedia.findIndex((m) => m.id === media.id);
        setCurrentIndex(index);
        setExpandedMedia(media);
      }
    },
    [isSelectionMode, sessions, handleMediaSelect],
  );

  const handlePrevMedia = useCallback(() => {
    if (!expandedMedia) return;
    const allMedia = sessions.flatMap((s) => s.media);
    setDirection("right");
    setCurrentIndex((prevIndex) => {
      const newIndex = (prevIndex - 1 + allMedia.length) % allMedia.length;
      setExpandedMedia(allMedia[newIndex]);
      return newIndex;
    });
  }, [expandedMedia, sessions]);

  const handleNextMedia = useCallback(() => {
    if (!expandedMedia) return;
    const allMedia = sessions.flatMap((s) => s.media);
    setDirection("left");
    setCurrentIndex((prevIndex) => {
      const newIndex = (prevIndex + 1) % allMedia.length;
      setExpandedMedia(allMedia[newIndex]);
      return newIndex;
    });
  }, [expandedMedia, sessions]);

  const swipeHandlers = useSwipeable({
    onSwipedLeft: handleNextMedia,
    onSwipedRight: handlePrevMedia,
    trackMouse: true,
  });

  // Effect hook for authentication and data fetching
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        console.log("No authenticated user");
        router.push('/auth/login-signup');
        return;
      }

      setIsLoading(true);
      try {
        const fetchedMedia = await getAllMedia();
        console.log("Fetched media:", fetchedMedia);
        const groupedSessions = groupMediaByDate(fetchedMedia);
        setSessions(groupedSessions);
        setExpandedSessions([groupedSessions[0]?.id].filter(Boolean));
      } catch (error) {
        console.error("Error fetching media:", error);
        setAuthError(error instanceof Error ? error.message : "Error fetching media");
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  // Add this effect for preloading
  useEffect(() => {
    if (sessions.length > 0) {
      // Preload first visible session immediately
      const firstSessionMedia = sessions[0].media.slice(0, 8);
      imageCache.preloadBatch(firstSessionMedia.map(m => m.src));

      // Preload other sessions progressively
      const otherMedia = sessions.slice(1).flatMap(s => s.media.map(m => m.src));
      setTimeout(() => {
        imageCache.preloadBatch(otherMedia);
      }, 1000);
    }
  }, [sessions]);

  // Early returns for loading and error states
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (authError) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{authError}</p>
          <Button onClick={() => router.push('/auth/login-signup')}>
            Return to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="flex justify-between items-center mb-4">
        <Link href="/camera" passHref>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-6 w-6" />
            <span className="sr-only">Back to Camera</span>
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Gallery</h1>
        {isSelectionMode ? (
          <Link href={`/create-post?media=${selectedMedia.join(",")}`} passHref>
            <Button disabled={selectedMedia.length === 0}>
              Next ({selectedMedia.length})
            </Button>
          </Link>
        ) : (
          <Button onClick={() => setIsSelectionMode(true)}>
            Select Photos
          </Button>
        )}
      </div>
      <div ref={containerRef} className="h-[calc(100vh-100px)] overflow-auto">
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow: VirtualItem) => {
            const session = sessions[virtualRow.index];
            return (
              <div
                key={session.id}
                className="mb-8 absolute top-0 left-0 w-full"
                style={{
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <div className="flex items-center mb-2">
                  <button
                    onClick={() => toggleSession(session.id)}
                    className="text-lg font-semibold flex items-center focus:outline-none"
                    aria-expanded={expandedSessions.includes(session.id)}
                  >
                    {expandedSessions.includes(session.id) ? (
                      <ChevronDown className="h-5 w-5 mr-1" />
                    ) : (
                      <ChevronRight className="h-5 w-5 mr-1" />
                    )}
                    {session.date}
                  </button>
                </div>
                {expandedSessions.includes(session.id) && (
                  <div className="grid grid-cols-4 gap-4">
                    {session.media.map((media) => (
                      <PhotoCard
                        key={media.id}
                        media={media}
                        LazyImage={LazyImage} // Pass the simplified LazyImage component
                        isSelectable={isSelectionMode}
                        isSelected={selectedMedia.includes(media.id)}
                        onSelect={() => handleMediaSelect(media.id)}
                        onDelete={() => handleDelete(media)}
                        onEdit={() => handleEdit(media.id)}
                        onShare={() => handleShare(media.id)}
                        onClick={() => handleMediaClick(media)}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      {expandedMedia && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 overflow-hidden"
          {...swipeHandlers}
        >
          <div className="relative w-full h-full max-w-4xl max-h-4xl">
            <div
              className={`absolute inset-0 transition-transform duration-300 ease-out ${
                direction === "left"
                  ? "-translate-x-full"
                  : direction === "right"
                    ? "translate-x-full"
                    : ""
              }`}
              onTransitionEnd={() => setDirection(null)}
            >
              {expandedMedia.type === "photo" ? (
                <div className="relative w-full h-full">
                  <Image
                    src={expandedMedia.src}
                    alt={`Expanded photo ${expandedMedia.id}`}
                    fill
                    sizes="100vw"
                    className="object-contain"
                    priority
                  />
                </div>
              ) : (
                <video
                  src={expandedMedia.src}
                  className="w-full h-full object-contain"
                  controls
                  playsInline
                />
              )}
            </div>
            <button
              className="absolute top-4 right-4 text-white bg-black bg-opacity-50 p-2 rounded-full"
              onClick={() => setExpandedMedia(null)}
            >
              <X className="h-6 w-6" />
            </button>
            <button
              className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white bg-black bg-opacity-50 p-2 rounded-full"
              onClick={handlePrevMedia}
            >
              <ChevronLeftIcon className="h-6 w-6" />
            </button>
            <button
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white bg-black bg-opacity-50 p-2 rounded-full"
              onClick={handleNextMedia}
            >
              <ChevronRightIcon className="h-6 w-6" />
            </button>
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-4">
              <Button
                variant="secondary"
                size="icon"
                onClick={() => handleDelete(expandedMedia)}
              >
                <Trash className="h-5 w-5" />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                onClick={() => handleEdit(expandedMedia.id)}
              >
                <Edit className="h-5 w-5" />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                onClick={() => handleShare(expandedMedia.id)}
              >
                <Share2 className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
