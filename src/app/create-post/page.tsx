"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import {
  RefreshCw,
  Share2,
  ChevronLeft,
  X,
  Instagram,
  Twitter,
  Facebook,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import dynamic from "next/dynamic";
import { getMediaUrl, auth } from "@/services/firebaseService";
import { useRouter } from "next/navigation";
import { getDoc, doc } from "firebase/firestore";
import { db } from "@/services/firebaseService";
const Image = dynamic(() => import("next/image"), { ssr: false });

interface Media {
  id: string;
  src: string;
  type: "photo" | "video";
}

const EnhancedVersionButton = React.memo(
  ({
    version,
    isSelected,
    onSelect,
    onRegenerate,
    label,
  }: {
    version: string;
    isSelected: boolean;
    onSelect: () => void;
    onRegenerate: () => void;
    label: string;
  }) => (
    <div className="relative">
      <button
        className={`relative w-full aspect-square overflow-hidden rounded-lg focus:outline-none transition-all duration-200 ${
          isSelected ? "transform scale-105 shadow-lg ring-4 ring-blue-500" : ""
        }`}
        onClick={onSelect}
      >
        <Image
          src={version}
          alt={`Enhanced version`}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover"
          loading="lazy"
        />
        {isSelected && (
          <div className="absolute inset-0 bg-blue-500 bg-opacity-20 flex items-center justify-center">
            <div className="bg-white rounded-full p-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-blue-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>
        )}
      </button>
      <button
        className="absolute top-1 right-1 bg-black bg-opacity-40 hover:bg-opacity-60 text-white p-1 rounded-full transition-all duration-200"
        onClick={(e) => {
          e.stopPropagation();
          onRegenerate();
        }}
      >
        <RefreshCw className="h-3 w-3" />
      </button>
      <p className="text-xs text-center mt-1 font-medium text-gray-600">
        {label}
      </p>
    </div>
  ),
);

EnhancedVersionButton.displayName = "EnhancedVersionButton";

const EnhancedVideoButton = React.memo(
  ({
    version,
    isSelected,
    onSelect,
    onRegenerate,
    label,
  }: {
    version: string;
    isSelected: boolean;
    onSelect: () => void;
    onRegenerate: () => void;
    label: string;
  }) => (
    <div className="relative">
      <button
        className={`relative w-full aspect-video overflow-hidden rounded-lg focus:outline-none transition-all duration-200 ${
          isSelected ? "transform scale-105 shadow-lg ring-4 ring-blue-500" : ""
        }`}
        onClick={onSelect}
      >
        <video
          src={version}
          className="w-full h-full object-cover"
          muted
          playsInline
          preload="metadata"
        />
        {isSelected && (
          <div className="absolute inset-0 bg-blue-500 bg-opacity-20 flex items-center justify-center">
            <div className="bg-white rounded-full p-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-blue-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>
        )}
      </button>
      <button
        className="absolute top-1 right-1 bg-black bg-opacity-40 hover:bg-opacity-60 text-white p-1 rounded-full transition-all duration-200"
        onClick={(e) => {
          e.stopPropagation();
          onRegenerate();
        }}
      >
        <RefreshCw className="h-3 w-3" />
      </button>
      <p className="text-xs text-center mt-1 font-medium text-gray-600">
        {label}
      </p>
    </div>
  ),
);

EnhancedVideoButton.displayName = "EnhancedVideoButton";

const mediaCache = new Map<string, Media>();
const enhancedVersionsCache = new Map<string, string[]>();

const preloadImage = (src: string) => {
  if (typeof window === 'undefined') return;
  const img = new window.Image(1, 1);
  img.src = src;
};

export default function CreatePostPage() {
  const searchParams = useSearchParams();
  const [selectedMedia, setSelectedMedia] = useState<Media[]>([]);
  const [step, setStep] = useState<"enhance" | "caption">("enhance");
  const [enhancedVersions, setEnhancedVersions] = useState<string[][]>([]);
  const [selectedVersions, setSelectedVersions] = useState<number[]>([]);
  const [caption, setCaption] = useState("");
  const router = useRouter();

  const fetchMedia = useCallback(async () => {
    const userId = auth.currentUser?.uid;
    
    if (!userId) {
      console.error("No authenticated user");
      router.push('/auth/login-signup');
      return;
    }

    const mediaIds = searchParams?.get("media")?.split(",") || [];
    
    try {
      const media = await Promise.all(
        mediaIds.map(async (id): Promise<Media> => {
          // Check cache first
          if (mediaCache.has(id)) {
            return mediaCache.get(id)!;
          }

          const mediaDoc = await getDoc(doc(db, "media", id));
          if (!mediaDoc.exists()) {
            throw new Error(`Media document ${id} not found`);
          }
          
          const mediaData = mediaDoc.data();
          const storagePath = mediaData.type === "photo"
            ? `photos/${userId}/${mediaData.id}`
            : `videos/${userId}/${mediaData.id}`;
          
          const url = await getMediaUrl(storagePath);
          const mediaItem = {
            id,
            src: url,
            type: mediaData.type as "photo" | "video",
          };

          // Cache the media item
          mediaCache.set(id, mediaItem);
          
          // Preload the image if it's a photo
          if (mediaData.type === "photo") {
            preloadImage(url);
          }

          return mediaItem;
        }),
      );

      setSelectedMedia(media);

      // Generate and cache enhanced versions
      const enhanced = await Promise.all(
        media.map(async (item) => {
          if (enhancedVersionsCache.has(item.id)) {
            return enhancedVersionsCache.get(item.id)!;
          }

          const versions = [item.src, item.src, item.src];
          enhancedVersionsCache.set(item.id, versions);
          
          // Preload enhanced versions if they're photos
          if (item.type === "photo") {
            versions.forEach(preloadImage);
          }

          return versions;
        })
      );

      setEnhancedVersions(enhanced);
      setSelectedVersions(new Array(media.length).fill(0));
    } catch (error) {
      console.error("Error fetching media:", error);
    }
  }, [searchParams, router]);

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  const handleRegenerateVersion = useCallback(
    (imageIndex: number, versionIndex: number) => {
      console.log(
        `Regenerating version ${versionIndex} for image ${imageIndex}`,
      );
    },
    [],
  );

  const handleVersionSelect = useCallback(
    (imageIndex: number, versionIndex: number) => {
      setSelectedVersions((prev) => {
        const newVersions = [...prev];
        newVersions[imageIndex] = versionIndex;
        return newVersions;
      });
    },
    [],
  );

  const handleShare = useCallback(async () => {
    const selectedMediaUrls = selectedMedia.map(
      (media) =>
        enhancedVersions[selectedMedia.indexOf(media)][
          selectedVersions[selectedMedia.indexOf(media)]
        ],
    );
    if (navigator.share) {
      try {
        const image = await fetch(
          "https://firebasestorage.googleapis.com/v0/b/youkol-1dc4b.appspot.com/o/photos%2Fphoto_1729563437792.jpg?alt=media&token=e439430f-2067-4005-89c9-f160ce912bdd",
        );
        const blob = await image.blob();
        const file = new File([blob], "image.jpg", { type: "image/jpeg" });
        await navigator.share({
          files: [file],
          title: "My Post",
          text: caption,
          url: selectedMediaUrls[0], // Replace with your actual post URL
        });
        console.log("Shared successfully");
      } catch (error) {
        console.log("Error sharing:", error);
      }
    } else {
      console.log("Web Share API not supported");
      // Fallback to your custom share menu
    }
  }, [caption]);

  const handleSocialShare = useCallback(
    (platform: string) => {
      // Implement platform-specific sharing logic here
      console.log(`Sharing to ${platform}`);
      // You would typically open a new window with the platform's share URL
      console.log("sharing media: ", selectedMedia);
      const selectedMediaUrls = selectedMedia.map(
        (media) =>
          enhancedVersions[selectedMedia.indexOf(media)][
            selectedVersions[selectedMedia.indexOf(media)]
          ],
      );
      console.log(
        "sharing media: ",
        selectedMediaUrls,
        "with caption: ",
        caption,
      );
    },
    [selectedMedia, enhancedVersions, selectedVersions, caption],
  );

  const openUserManual = useCallback(() => {
    // Implement logic to open the user manual
    console.log("Opening user manual");
    // This could open a new page or modal with instructions
  }, []);

  const renderEnhanceStep = useMemo(
    () => (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">
          Choose Enhanced Versions
        </h2>
        {selectedMedia.map((media, mediaIndex) => (
          <div key={media.id} className="bg-white rounded-lg shadow-sm p-4">
            <h3 className="text-lg font-semibold mb-3 text-gray-700">
              {media.type === "photo" ? "Photo" : "Video"} {mediaIndex + 1}
            </h3>
            <div className="mb-4">
              {media.type === "photo" ? (
                <div className="relative w-full aspect-square rounded-lg overflow-hidden">
                  <Image
                    src={media.src}
                    alt={`Original photo ${mediaIndex + 1}`}
                    layout="fill"
                    objectFit="cover"
                    className="rounded-lg"
                    loading="lazy"
                  />
                </div>
              ) : (
                <video
                  src={media.src}
                  className="w-full rounded-lg"
                  controls
                  preload="metadata"
                />
              )}
            </div>
            <div className="grid grid-cols-3 gap-3">
              {enhancedVersions[mediaIndex].map((version, versionIndex) =>
                media.type === "photo" ? (
                  <EnhancedVersionButton
                    key={versionIndex}
                    version={version}
                    isSelected={selectedVersions[mediaIndex] === versionIndex}
                    onSelect={() =>
                      handleVersionSelect(mediaIndex, versionIndex)
                    }
                    onRegenerate={() =>
                      handleRegenerateVersion(mediaIndex, versionIndex)
                    }
                    label={
                      versionIndex === 0
                        ? "User enhanced"
                        : versionIndex === 1
                          ? "AI proposed"
                          : "Trending"
                    }
                  />
                ) : (
                  <EnhancedVideoButton
                    key={versionIndex}
                    version={version}
                    isSelected={selectedVersions[mediaIndex] === versionIndex}
                    onSelect={() =>
                      handleVersionSelect(mediaIndex, versionIndex)
                    }
                    onRegenerate={() =>
                      handleRegenerateVersion(mediaIndex, versionIndex)
                    }
                    label={
                      versionIndex === 0
                        ? "User enhanced"
                        : versionIndex === 1
                          ? "AI proposed"
                          : "Trending"
                    }
                  />
                ),
              )}
            </div>
          </div>
        ))}
        <Button
          className="w-full mt-6 bg-blue-500 hover:bg-blue-600 text-white transition-colors duration-200"
          onClick={() => setStep("caption")}
        >
          Next
        </Button>
      </div>
    ),
    [
      selectedMedia,
      enhancedVersions,
      selectedVersions,
      handleVersionSelect,
      handleRegenerateVersion,
    ],
  );

  const renderCaptionStep = useMemo(
    () => (
      <div>
        <h2 className="text-xl font-bold mb-4">Add Caption</h2>
        <div className="grid grid-cols-2 gap-2 mb-4">
          {selectedMedia.map((media, index) => (
            <div key={media.id} className="relative aspect-square">
              {media.type === "photo" ? (
                <Image
                  src={enhancedVersions[index][selectedVersions[index]]}
                  alt={`Selected photo ${index + 1}`}
                  fill
                  sizes="(max-width: 768px) 50vw, 33vw"
                  className="rounded-lg object-cover"
                  priority
                />
              ) : (
                <video
                  src={enhancedVersions[index][selectedVersions[index]]}
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
        <div className="flex space-x-2">
          <Button className="flex-grow" onClick={handleShare}>
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">More Options</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuItem onClick={() => handleSocialShare("Instagram")}>
                <Instagram className="mr-2 h-4 w-4" />
                Share to Instagram
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSocialShare("Twitter")}>
                <Twitter className="mr-2 h-4 w-4" />
                Share to Twitter
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSocialShare("Facebook")}>
                <Facebook className="mr-2 h-4 w-4" />
                Share to Facebook
              </DropdownMenuItem>
              <DropdownMenuItem onClick={openUserManual}>
                Open User Manual
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    ),
    [
      selectedMedia,
      enhancedVersions,
      selectedVersions,
      caption,
      handleShare,
      handleSocialShare,
      openUserManual,
    ],
  );

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 p-4">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() =>
              step === "caption" ? setStep("enhance") : window.history.back()
            }
          >
            <ChevronLeft className="h-6 w-6" />
            <span className="sr-only">Back</span>
          </Button>
          <h1 className="text-2xl font-bold">Create Post</h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.history.back()}
          >
            <X className="h-6 w-6" />
            <span className="sr-only">Close</span>
          </Button>
        </div>
        {step === "enhance" ? renderEnhanceStep : renderCaptionStep}
      </div>
    </div>
  );
}
