'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Heart, MessageCircle, Share2, Grid, Bookmark, ArrowLeft } from 'lucide-react'

type Post = {
  id: number
  imageUrl: string
  likes: number
  comments: number
}

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState('posts')

  const posts: Post[] = [
    { id: 1, imageUrl: '/placeholder.svg?height=300&width=300', likes: 1234, comments: 56 },
    { id: 2, imageUrl: '/placeholder.svg?height=300&width=300', likes: 4321, comments: 78 },
    { id: 3, imageUrl: '/placeholder.svg?height=300&width=300', likes: 2468, comments: 90 },
    { id: 4, imageUrl: '/placeholder.svg?height=300&width=300', likes: 1357, comments: 24 },
    { id: 5, imageUrl: '/placeholder.svg?height=300&width=300', likes: 8765, comments: 43 },
    { id: 6, imageUrl: '/placeholder.svg?height=300&width=300', likes: 9876, comments: 21 },
  ]

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Add back button */}
      <div className="mb-6">
        <Link href="/camera">
          <Button variant="ghost" size="icon" className="hover:bg-gray-100">
            <ArrowLeft className="h-6 w-6" />
            <span className="sr-only">Back to Camera</span>
          </Button>
        </Link>
      </div>

      <header className="flex flex-col items-center mb-8">
        <div className="relative w-24 h-24 mb-4">
          <Image
            src="/placeholder.svg?height=96&width=96"
            alt="Profile picture"
            className="rounded-full"
            fill
            sizes="(max-width: 96px) 100vw, 96px"
          />
        </div>
        <h1 className="text-2xl font-bold mb-2">@username</h1>
        <p className="text-muted-foreground mb-4 text-center">User's bio goes here. This is a short description about the user.</p>
        <div className="flex gap-4 mb-4">
          <div className="text-center">
            <span className="font-bold">1.2K</span>
            <p className="text-muted-foreground text-sm">Following</p>
          </div>
          <div className="text-center">
            <span className="font-bold">10K</span>
            <p className="text-muted-foreground text-sm">Followers</p>
          </div>
          <div className="text-center">
            <span className="font-bold">5.2K</span>
            <p className="text-muted-foreground text-sm">Likes</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button>Follow</Button>
          <Button variant="outline">Message</Button>
          <Button variant="outline" size="icon">
            <Share2 className="h-4 w-4" />
            <span className="sr-only">Share profile</span>
          </Button>
        </div>
      </header>

      <Tabs defaultValue="posts" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-8">
          <TabsTrigger value="posts" onClick={() => setActiveTab('posts')}>
            <Grid className="h-4 w-4 mr-2" />
            Posts
          </TabsTrigger>
          <TabsTrigger value="likes" onClick={() => setActiveTab('likes')}>
            <Heart className="h-4 w-4 mr-2" />
            Likes
          </TabsTrigger>
          <TabsTrigger value="comments" onClick={() => setActiveTab('comments')}>
            <MessageCircle className="h-4 w-4 mr-2" />
            Comments
          </TabsTrigger>
          <TabsTrigger value="saved" onClick={() => setActiveTab('saved')}>
            <Bookmark className="h-4 w-4 mr-2" />
            Saved
          </TabsTrigger>
        </TabsList>
        <TabsContent value="posts" className="mt-0">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {posts.map((post) => (
              <div key={post.id} className="relative aspect-square">
                <Image
                  src={post.imageUrl}
                  alt={`Post ${post.id}`}
                  fill
                  sizes="(max-width: 768px) 50vw, 33vw"
                  className="rounded-md object-cover"
                />
                <div className="absolute bottom-2 left-2 flex items-center space-x-2 text-white text-sm">
                  <Heart className="h-4 w-4" />
                  <span>{post.likes}</span>
                  <MessageCircle className="h-4 w-4" />
                  <span>{post.comments}</span>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="likes">
          <p className="text-center text-muted-foreground">Liked posts will appear here.</p>
        </TabsContent>
        <TabsContent value="comments">
          <p className="text-center text-muted-foreground">Comments will appear here.</p>
        </TabsContent>
        <TabsContent value="saved">
          <p className="text-center text-muted-foreground">Saved posts will appear here.</p>
        </TabsContent>
      </Tabs>
    </div>
  )
}
