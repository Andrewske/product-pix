# Phase 1E: Basic UI

**ProductPix.app — AI-Powered Product Photo Generator**

---

## Overview

This document covers building the minimal functional UI for testing the MVP. The goal is a working interface, not a polished design. Polish comes in Phase 4.

### Why This Phase Matters

A working UI enables:
- End-to-end testing of the generation flow
- User feedback before investing in design
- Validation of the technical architecture
- Demo-ready product for stakeholders

### UI Architecture

```
/app
├── layout.tsx              # Root layout with providers
├── page.tsx                # Landing/redirect
├── login/page.tsx          # Login form (Phase 1C)
├── signup/page.tsx         # Signup form (Phase 1C)
├── dashboard/
│   └── page.tsx            # User home, image gallery
├── generate/
│   └── page.tsx            # Generation interface
└── settings/
    └── page.tsx            # User settings (future)

/components
├── layout/
│   ├── header.tsx          # Navigation header
│   └── footer.tsx          # Site footer
├── ui/
│   ├── button.tsx          # Button component
│   ├── input.tsx           # Input component
│   ├── spinner.tsx         # Loading spinner
│   └── skeleton.tsx        # Skeleton loaders
└── forms/
    ├── upload-form.tsx     # Image upload with drag-drop
    ├── prompt-input.tsx    # Generation prompt input
    └── ...
```

---

## Prerequisites

- [ ] Phase 1D completed (generation API working)
- [ ] Authentication working (Phase 1C)
- [ ] Tailwind CSS configured (Phase 1A)

---

## Task 1E.1: Layout Component

**Estimated Time:** 30 minutes

### Steps

1. **Create header component**
   ```typescript
   // src/components/layout/header.tsx
   'use client';

   import Link from 'next/link';
   import { useUserProfile, signOut } from '@/lib/auth';
   import { useRouter } from 'next/navigation';

   export function Header() {
     const { user, profile, loading } = useUserProfile();
     const router = useRouter();

     const handleSignOut = async () => {
       await signOut();
       router.push('/login');
       router.refresh();
     };

     return (
       <header className="border-b border-gray-200 bg-white">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
           <div className="flex justify-between items-center h-16">
             {/* Logo */}
             <Link href="/dashboard" className="flex items-center">
               <span className="text-xl font-bold text-gray-900">ProductPix</span>
             </Link>

             {/* Navigation */}
             <nav className="flex items-center space-x-4">
               {loading ? (
                 <div className="h-8 w-24 bg-gray-200 animate-pulse rounded" />
               ) : user ? (
                 <>
                   <Link
                     href="/dashboard"
                     className="text-gray-600 hover:text-gray-900 px-3 py-2"
                   >
                     Gallery
                   </Link>
                   <Link
                     href="/generate"
                     className="text-gray-600 hover:text-gray-900 px-3 py-2"
                   >
                     Generate
                   </Link>

                   {/* Credits badge */}
                   <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                     {profile?.credit_balance ?? 0} credits
                   </span>

                   {/* User menu */}
                   <button
                     onClick={handleSignOut}
                     className="text-gray-600 hover:text-gray-900 px-3 py-2"
                   >
                     Sign out
                   </button>
                 </>
               ) : (
                 <>
                   <Link
                     href="/login"
                     className="text-gray-600 hover:text-gray-900 px-3 py-2"
                   >
                     Log in
                   </Link>
                   <Link
                     href="/signup"
                     className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                   >
                     Sign up
                   </Link>
                 </>
               )}
             </nav>
           </div>
         </div>
       </header>
     );
   }
   ```

2. **Create footer component**
   ```typescript
   // src/components/layout/footer.tsx
   export function Footer() {
     return (
       <footer className="border-t border-gray-200 bg-gray-50">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
           <div className="flex justify-between items-center">
             <p className="text-gray-500 text-sm">
               &copy; {new Date().getFullYear()} ProductPix. All rights reserved.
             </p>
             <div className="flex space-x-6">
               <a href="#" className="text-gray-500 hover:text-gray-700 text-sm">
                 Terms
               </a>
               <a href="#" className="text-gray-500 hover:text-gray-700 text-sm">
                 Privacy
               </a>
               <a href="#" className="text-gray-500 hover:text-gray-700 text-sm">
                 Contact
               </a>
             </div>
           </div>
         </div>
       </footer>
     );
   }
   ```

3. **Update root layout**
   ```typescript
   // src/app/layout.tsx
   import type { Metadata } from 'next';
   import { Inter } from 'next/font/google';
   import './globals.css';
   import { Header } from '@/components/layout/header';
   import { Footer } from '@/components/layout/footer';

   const inter = Inter({ subsets: ['latin'] });

   export const metadata: Metadata = {
     title: 'ProductPix - AI Product Photo Generator',
     description: 'Generate professional product photos with AI',
   };

   export default function RootLayout({
     children,
   }: {
     children: React.ReactNode;
   }) {
     return (
       <html lang="en">
         <body className={inter.className}>
           <div className="min-h-screen flex flex-col">
             <Header />
             <main className="flex-grow">{children}</main>
             <Footer />
           </div>
         </body>
       </html>
     );
   }
   ```

4. **Create index exports**
   ```typescript
   // src/components/layout/index.ts
   export { Header } from './header';
   export { Footer } from './footer';
   ```

### Acceptance Criteria

- [ ] Header displays logo and navigation
- [ ] Shows credits for logged-in users
- [ ] Sign out works
- [ ] Footer displays links

---

## Task 1E.2: Dashboard Page

**Estimated Time:** 45 minutes

### Steps

1. **Create dashboard page**
   ```typescript
   // src/app/dashboard/page.tsx
   import { createClient } from '@/lib/supabase/server';
   import { getUserGeneratedImages } from '@/lib/db/generated-images';
   import { ImageGallery } from '@/components/image-gallery';
   import { EmptyState } from '@/components/empty-state';
   import Link from 'next/link';

   export default async function DashboardPage() {
     const supabase = await createClient();
     const { data: { user } } = await supabase.auth.getUser();

     if (!user) {
       return null; // Middleware will redirect
     }

     const images = await getUserGeneratedImages(user.id);

     return (
       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
         <div className="flex justify-between items-center mb-8">
           <h1 className="text-2xl font-bold text-gray-900">Your Images</h1>
           <Link
             href="/generate"
             className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
           >
             Generate New
           </Link>
         </div>

         {images.length === 0 ? (
           <EmptyState
             title="No images yet"
             description="Generate your first professional product photo"
             actionLabel="Generate Image"
             actionHref="/generate"
           />
         ) : (
           <ImageGallery images={images} />
         )}
       </div>
     );
   }
   ```

2. **Create empty state component**
   ```typescript
   // src/components/empty-state.tsx
   import Link from 'next/link';

   interface EmptyStateProps {
     title: string;
     description: string;
     actionLabel: string;
     actionHref: string;
   }

   export function EmptyState({ title, description, actionLabel, actionHref }: EmptyStateProps) {
     return (
       <div className="text-center py-16">
         <svg
           className="mx-auto h-12 w-12 text-gray-400"
           fill="none"
           viewBox="0 0 24 24"
           stroke="currentColor"
           aria-hidden="true"
         >
           <path
             strokeLinecap="round"
             strokeLinejoin="round"
             strokeWidth={2}
             d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
           />
         </svg>
         <h3 className="mt-4 text-lg font-medium text-gray-900">{title}</h3>
         <p className="mt-2 text-gray-500">{description}</p>
         <Link
           href={actionHref}
           className="mt-6 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
         >
           {actionLabel}
         </Link>
       </div>
     );
   }
   ```

### Acceptance Criteria

- [ ] Dashboard shows user's generated images
- [ ] Empty state shows when no images
- [ ] Link to generate page works

---

## Task 1E.3: Upload Component

**Estimated Time:** 1 hour

### Steps

1. **Create upload component**
   ```typescript
   // src/components/forms/upload-form.tsx
   'use client';

   import { useState, useRef, useCallback } from 'react';
   import { IMAGE_CONFIG } from '@/lib/images';

   interface UploadFormProps {
     onUploadComplete: (uploadId: string, previewUrl: string) => void;
     onError: (error: string) => void;
   }

   export function UploadForm({ onUploadComplete, onError }: UploadFormProps) {
     const [isDragging, setIsDragging] = useState(false);
     const [uploading, setUploading] = useState(false);
     const [preview, setPreview] = useState<string | null>(null);
     const fileInputRef = useRef<HTMLInputElement>(null);

     const validateFile = (file: File): string | null => {
       if (!IMAGE_CONFIG.allowedMimeTypes.includes(file.type as typeof IMAGE_CONFIG.allowedMimeTypes[number])) {
         return `Invalid file type. Allowed: ${IMAGE_CONFIG.allowedMimeTypes.join(', ')}`;
       }
       if (file.size > IMAGE_CONFIG.maxSizeBytes) {
         return `File too large. Maximum size: ${IMAGE_CONFIG.maxSizeBytes / 1024 / 1024}MB`;
       }
       if (file.size < IMAGE_CONFIG.minSizeBytes) {
         return 'File too small';
       }
       return null;
     };

     const uploadFile = async (file: File) => {
       const validationError = validateFile(file);
       if (validationError) {
         onError(validationError);
         return;
       }

       setUploading(true);

       try {
         // Create preview
         const previewUrl = URL.createObjectURL(file);
         setPreview(previewUrl);

         // Get presigned URL
         const presignResponse = await fetch('/api/upload/presign', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({
             filename: file.name,
             contentType: file.type,
           }),
         });

         if (!presignResponse.ok) {
           throw new Error('Failed to get upload URL');
         }

         const { uploadUrl, fileKey, publicUrl } = await presignResponse.json();

         // Upload directly to R2
         const uploadResponse = await fetch(uploadUrl, {
           method: 'PUT',
           body: file,
           headers: {
             'Content-Type': file.type,
           },
         });

         if (!uploadResponse.ok) {
           throw new Error('Failed to upload file');
         }

         // Confirm upload
         const confirmResponse = await fetch('/api/upload/confirm', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({
             fileKey,
             filename: file.name,
             mimeType: file.type,
             fileSize: file.size,
           }),
         });

         if (!confirmResponse.ok) {
           throw new Error('Failed to confirm upload');
         }

         const { uploadId } = await confirmResponse.json();
         onUploadComplete(uploadId, previewUrl);
       } catch (error) {
         onError(error instanceof Error ? error.message : 'Upload failed');
         setPreview(null);
       } finally {
         setUploading(false);
       }
     };

     const handleDragOver = useCallback((e: React.DragEvent) => {
       e.preventDefault();
       setIsDragging(true);
     }, []);

     const handleDragLeave = useCallback((e: React.DragEvent) => {
       e.preventDefault();
       setIsDragging(false);
     }, []);

     const handleDrop = useCallback((e: React.DragEvent) => {
       e.preventDefault();
       setIsDragging(false);

       const file = e.dataTransfer.files[0];
       if (file) {
         uploadFile(file);
       }
     }, []);

     const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
       const file = e.target.files?.[0];
       if (file) {
         uploadFile(file);
       }
     };

     const handleClick = () => {
       fileInputRef.current?.click();
     };

     return (
       <div
         onClick={handleClick}
         onDragOver={handleDragOver}
         onDragLeave={handleDragLeave}
         onDrop={handleDrop}
         className={`
           relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
           transition-colors duration-200
           ${isDragging
             ? 'border-blue-500 bg-blue-50'
             : 'border-gray-300 hover:border-gray-400'
           }
           ${uploading ? 'pointer-events-none opacity-50' : ''}
         `}
       >
         <input
           ref={fileInputRef}
           type="file"
           accept={IMAGE_CONFIG.allowedMimeTypes.join(',')}
           onChange={handleFileSelect}
           className="hidden"
         />

         {preview ? (
           <div className="space-y-4">
             <img
               src={preview}
               alt="Preview"
               className="max-h-64 mx-auto rounded-lg"
             />
             {uploading && (
               <div className="flex items-center justify-center space-x-2">
                 <div className="animate-spin h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full" />
                 <span className="text-gray-600">Uploading...</span>
               </div>
             )}
           </div>
         ) : (
           <div className="space-y-2">
             <svg
               className="mx-auto h-12 w-12 text-gray-400"
               stroke="currentColor"
               fill="none"
               viewBox="0 0 48 48"
               aria-hidden="true"
             >
               <path
                 d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                 strokeWidth={2}
                 strokeLinecap="round"
                 strokeLinejoin="round"
               />
             </svg>
             <div className="text-gray-600">
               <span className="font-medium text-blue-600">Click to upload</span> or drag and drop
             </div>
             <p className="text-xs text-gray-500">
               PNG, JPG, WebP up to 10MB
             </p>
           </div>
         )}
       </div>
     );
   }
   ```

### Acceptance Criteria

- [ ] Drag and drop works
- [ ] Click to upload works
- [ ] Preview shows after selection
- [ ] File validation works
- [ ] Upload to R2 via presigned URL
- [ ] Returns upload ID on success

---

## Task 1E.4: Prompt Input

**Estimated Time:** 30 minutes

### Steps

1. **Create prompt input component**
   ```typescript
   // src/components/forms/prompt-input.tsx
   'use client';

   import { useState } from 'react';

   interface PromptInputProps {
     value: string;
     onChange: (value: string) => void;
     disabled?: boolean;
   }

   const PROMPT_TEMPLATES = [
     {
       label: 'White Background',
       prompt: 'Professional product photo on clean white background with soft shadows',
     },
     {
       label: 'Lifestyle',
       prompt: 'Product in a lifestyle setting, natural lighting, modern home environment',
     },
     {
       label: 'Studio',
       prompt: 'Studio product photography with professional lighting, gradient background',
     },
     {
       label: 'Minimal',
       prompt: 'Minimalist product photo, solid color background, sharp focus',
     },
   ];

   export function PromptInput({ value, onChange, disabled }: PromptInputProps) {
     const [showTemplates, setShowTemplates] = useState(false);

     return (
       <div className="space-y-2">
         <label className="block text-sm font-medium text-gray-700">
           Generation Prompt
         </label>

         <div className="relative">
           <textarea
             value={value}
             onChange={(e) => onChange(e.target.value)}
             disabled={disabled}
             rows={3}
             className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
             placeholder="Describe how you want the product photo to look..."
           />

           <button
             type="button"
             onClick={() => setShowTemplates(!showTemplates)}
             className="absolute right-2 bottom-2 text-xs text-blue-600 hover:text-blue-700"
           >
             Templates
           </button>
         </div>

         {showTemplates && (
           <div className="grid grid-cols-2 gap-2">
             {PROMPT_TEMPLATES.map((template) => (
               <button
                 key={template.label}
                 type="button"
                 onClick={() => {
                   onChange(template.prompt);
                   setShowTemplates(false);
                 }}
                 className="text-left p-2 text-sm border rounded-md hover:bg-gray-50"
               >
                 <span className="font-medium">{template.label}</span>
               </button>
             ))}
           </div>
         )}

         <p className="text-xs text-gray-500">
           {value.length}/1000 characters
         </p>
       </div>
     );
   }
   ```

### Acceptance Criteria

- [ ] Text area for custom prompts
- [ ] Character counter
- [ ] Template shortcuts
- [ ] Disabled state works

---

## Task 1E.5: Generation Preview

**Estimated Time:** 30 minutes

### Steps

1. **Create generation result component**
   ```typescript
   // src/components/generation-result.tsx
   'use client';

   import { useState } from 'react';

   interface GenerationResultProps {
     imageUrl: string;
     onDownload: () => void;
     onRegenerate: () => void;
   }

   export function GenerationResult({
     imageUrl,
     onDownload,
     onRegenerate,
   }: GenerationResultProps) {
     const [isZoomed, setIsZoomed] = useState(false);

     return (
       <div className="space-y-4">
         <div className="relative">
           <img
             src={imageUrl}
             alt="Generated product photo"
             className={`
               rounded-lg cursor-pointer transition-transform
               ${isZoomed ? 'scale-150 z-50' : 'hover:scale-105'}
             `}
             onClick={() => setIsZoomed(!isZoomed)}
           />

           {isZoomed && (
             <div
               className="fixed inset-0 bg-black/50 z-40"
               onClick={() => setIsZoomed(false)}
             />
           )}
         </div>

         <div className="flex space-x-3">
           <button
             onClick={onDownload}
             className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
           >
             Download
           </button>
           <button
             onClick={onRegenerate}
             className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
           >
             Regenerate
           </button>
         </div>
       </div>
     );
   }
   ```

### Acceptance Criteria

- [ ] Image displays correctly
- [ ] Click to zoom works
- [ ] Download button works
- [ ] Regenerate button works

---

## Task 1E.6: Loading States

**Estimated Time:** 20 minutes

### Steps

1. **Create spinner component**
   ```typescript
   // src/components/ui/spinner.tsx
   interface SpinnerProps {
     size?: 'sm' | 'md' | 'lg';
     className?: string;
   }

   const sizeClasses = {
     sm: 'h-4 w-4',
     md: 'h-8 w-8',
     lg: 'h-12 w-12',
   };

   export function Spinner({ size = 'md', className = '' }: SpinnerProps) {
     return (
       <div
         className={`
           animate-spin rounded-full border-2 border-gray-300 border-t-blue-600
           ${sizeClasses[size]} ${className}
         `}
       />
     );
   }
   ```

2. **Create skeleton component**
   ```typescript
   // src/components/ui/skeleton.tsx
   interface SkeletonProps {
     className?: string;
   }

   export function Skeleton({ className = '' }: SkeletonProps) {
     return (
       <div
         className={`animate-pulse bg-gray-200 rounded ${className}`}
       />
     );
   }

   export function ImageSkeleton() {
     return (
       <div className="aspect-square bg-gray-200 rounded-lg animate-pulse" />
     );
   }

   export function CardSkeleton() {
     return (
       <div className="border rounded-lg p-4 space-y-3">
         <Skeleton className="h-48 w-full" />
         <Skeleton className="h-4 w-3/4" />
         <Skeleton className="h-4 w-1/2" />
       </div>
     );
   }
   ```

3. **Create generation loading state**
   ```typescript
   // src/components/generation-loading.tsx
   import { Spinner } from './ui/spinner';

   const GENERATION_MESSAGES = [
     'Analyzing your product...',
     'Enhancing lighting and shadows...',
     'Generating professional background...',
     'Applying finishing touches...',
     'Almost there...',
   ];

   interface GenerationLoadingProps {
     stage?: number;
   }

   export function GenerationLoading({ stage = 0 }: GenerationLoadingProps) {
     const message = GENERATION_MESSAGES[stage % GENERATION_MESSAGES.length];

     return (
       <div className="flex flex-col items-center justify-center py-16 space-y-4">
         <Spinner size="lg" />
         <p className="text-gray-600">{message}</p>
       </div>
     );
   }
   ```

### Acceptance Criteria

- [ ] Spinner component works at different sizes
- [ ] Skeleton components for loading states
- [ ] Generation loading shows progress messages

---

## Task 1E.7: Image Gallery

**Estimated Time:** 45 minutes

### Steps

1. **Create image card component**
   ```typescript
   // src/components/image-card.tsx
   'use client';

   import { useState } from 'react';
   import type { GeneratedImage } from '@/types';

   interface ImageCardProps {
     image: GeneratedImage;
     onFavorite: (id: string) => void;
     onDelete: (id: string) => void;
     onDownload: (url: string) => void;
   }

   export function ImageCard({ image, onFavorite, onDelete, onDownload }: ImageCardProps) {
     const [showActions, setShowActions] = useState(false);

     return (
       <div
         className="relative group rounded-lg overflow-hidden bg-gray-100"
         onMouseEnter={() => setShowActions(true)}
         onMouseLeave={() => setShowActions(false)}
       >
         <img
           src={image.public_url}
           alt="Generated product"
           className="w-full aspect-square object-cover"
         />

         {/* Overlay actions */}
         <div
           className={`
             absolute inset-0 bg-black/40 flex items-center justify-center space-x-2
             transition-opacity duration-200
             ${showActions ? 'opacity-100' : 'opacity-0'}
           `}
         >
           <button
             onClick={() => onDownload(image.public_url)}
             className="p-2 bg-white rounded-full hover:bg-gray-100"
             title="Download"
           >
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
             </svg>
           </button>

           <button
             onClick={() => onFavorite(image.id)}
             className={`p-2 rounded-full ${image.is_favorite ? 'bg-red-500 text-white' : 'bg-white hover:bg-gray-100'}`}
             title={image.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
           >
             <svg className="w-5 h-5" fill={image.is_favorite ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
             </svg>
           </button>

           <button
             onClick={() => onDelete(image.id)}
             className="p-2 bg-white rounded-full hover:bg-gray-100"
             title="Delete"
           >
             <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
             </svg>
           </button>
         </div>

         {/* Favorite indicator */}
         {image.is_favorite && (
           <div className="absolute top-2 right-2">
             <svg className="w-5 h-5 text-red-500 fill-current" viewBox="0 0 24 24">
               <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
             </svg>
           </div>
         )}
       </div>
     );
   }
   ```

2. **Create image gallery component**
   ```typescript
   // src/components/image-gallery.tsx
   'use client';

   import { useState } from 'react';
   import { ImageCard } from './image-card';
   import type { GeneratedImage } from '@/types';

   interface ImageGalleryProps {
     images: GeneratedImage[];
   }

   export function ImageGallery({ images: initialImages }: ImageGalleryProps) {
     const [images, setImages] = useState(initialImages);
     const [filter, setFilter] = useState<'all' | 'favorites'>('all');

     const filteredImages = filter === 'favorites'
       ? images.filter((img) => img.is_favorite)
       : images;

     const handleFavorite = async (id: string) => {
       const response = await fetch(`/api/images/${id}/favorite`, {
         method: 'POST',
       });

       if (response.ok) {
         setImages((prev) =>
           prev.map((img) =>
             img.id === id ? { ...img, is_favorite: !img.is_favorite } : img
           )
         );
       }
     };

     const handleDelete = async (id: string) => {
       if (!confirm('Are you sure you want to delete this image?')) return;

       const response = await fetch(`/api/images/${id}`, {
         method: 'DELETE',
       });

       if (response.ok) {
         setImages((prev) => prev.filter((img) => img.id !== id));
       }
     };

     const handleDownload = (url: string) => {
       const link = document.createElement('a');
       link.href = url;
       link.download = 'product-photo.png';
       link.click();
     };

     return (
       <div className="space-y-4">
         {/* Filter tabs */}
         <div className="flex space-x-4 border-b">
           <button
             onClick={() => setFilter('all')}
             className={`pb-2 px-1 ${filter === 'all' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
           >
             All ({images.length})
           </button>
           <button
             onClick={() => setFilter('favorites')}
             className={`pb-2 px-1 ${filter === 'favorites' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
           >
             Favorites ({images.filter((img) => img.is_favorite).length})
           </button>
         </div>

         {/* Image grid */}
         <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
           {filteredImages.map((image) => (
             <ImageCard
               key={image.id}
               image={image}
               onFavorite={handleFavorite}
               onDelete={handleDelete}
               onDownload={handleDownload}
             />
           ))}
         </div>

         {filteredImages.length === 0 && (
           <p className="text-center text-gray-500 py-8">
             {filter === 'favorites' ? 'No favorites yet' : 'No images'}
           </p>
         )}
       </div>
     );
   }
   ```

### Acceptance Criteria

- [ ] Grid layout displays images
- [ ] Hover actions work (download, favorite, delete)
- [ ] Filter between all/favorites
- [ ] Responsive grid

---

## Task 1E.8: Download Function

**Estimated Time:** 20 minutes

### Steps

1. **Create image API routes**
   ```typescript
   // src/app/api/images/[id]/route.ts
   import { NextRequest, NextResponse } from 'next/server';
   import { createClient } from '@/lib/supabase/server';
   import { softDeleteImage } from '@/lib/db/generated-images';

   export async function DELETE(
     request: NextRequest,
     { params }: { params: Promise<{ id: string }> }
   ) {
     const { id } = await params;

     const supabase = await createClient();
     const { data: { user } } = await supabase.auth.getUser();

     if (!user) {
       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
     }

     const success = await softDeleteImage(id, user.id);

     if (!success) {
       return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
     }

     return NextResponse.json({ success: true });
   }
   ```

2. **Create favorite toggle route**
   ```typescript
   // src/app/api/images/[id]/favorite/route.ts
   import { NextRequest, NextResponse } from 'next/server';
   import { createClient } from '@/lib/supabase/server';
   import { toggleFavorite } from '@/lib/db/generated-images';

   export async function POST(
     request: NextRequest,
     { params }: { params: Promise<{ id: string }> }
   ) {
     const { id } = await params;

     const supabase = await createClient();
     const { data: { user } } = await supabase.auth.getUser();

     if (!user) {
       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
     }

     const success = await toggleFavorite(id, user.id);

     if (!success) {
       return NextResponse.json({ error: 'Failed to toggle favorite' }, { status: 500 });
     }

     return NextResponse.json({ success: true });
   }
   ```

### Acceptance Criteria

- [ ] Download triggers file save
- [ ] Delete endpoint works
- [ ] Favorite toggle works

---

## Task 1E.9: Generate Page (Integration)

**Estimated Time:** 1 hour

### Steps

1. **Create the generate page**
   ```typescript
   // src/app/generate/page.tsx
   'use client';

   import { useState } from 'react';
   import { useRouter } from 'next/navigation';
   import { UploadForm } from '@/components/forms/upload-form';
   import { PromptInput } from '@/components/forms/prompt-input';
   import { GenerationResult } from '@/components/generation-result';
   import { GenerationLoading } from '@/components/generation-loading';
   import { useCredits } from '@/lib/auth';

   type AspectRatio = '1:1' | '2:3' | '3:2' | '3:4' | '4:3' | '4:5' | '5:4' | '9:16' | '16:9';

   export default function GeneratePage() {
     const router = useRouter();
     const { credits } = useCredits();

     const [uploadId, setUploadId] = useState<string | null>(null);
     const [previewUrl, setPreviewUrl] = useState<string | null>(null);
     const [prompt, setPrompt] = useState('Professional product photo on clean white background with soft shadows');
     const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
     const [generating, setGenerating] = useState(false);
     const [result, setResult] = useState<{ imageUrl: string; jobId: string } | null>(null);
     const [error, setError] = useState<string | null>(null);

     const handleUploadComplete = (id: string, preview: string) => {
       setUploadId(id);
       setPreviewUrl(preview);
       setError(null);
     };

     const handleGenerate = async () => {
       if (!prompt.trim()) {
         setError('Please enter a prompt');
         return;
       }

       if (credits < 1) {
         setError('Insufficient credits. Please purchase more credits.');
         return;
       }

       setGenerating(true);
       setError(null);
       setResult(null);

       try {
         const response = await fetch('/api/generate', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({
             uploadId: uploadId || undefined,
             prompt,
             aspectRatio,
             resolution: '1k',
           }),
         });

         const data = await response.json();

         if (!response.ok) {
           throw new Error(data.error || 'Generation failed');
         }

         setResult({
           imageUrl: data.imageUrl,
           jobId: data.jobId,
         });
       } catch (err) {
         setError(err instanceof Error ? err.message : 'Generation failed');
       } finally {
         setGenerating(false);
       }
     };

     const handleDownload = () => {
       if (!result) return;
       const link = document.createElement('a');
       link.href = result.imageUrl;
       link.download = 'product-photo.png';
       link.click();
     };

     const handleRegenerate = () => {
       setResult(null);
       handleGenerate();
     };

     const handleReset = () => {
       setUploadId(null);
       setPreviewUrl(null);
       setResult(null);
       setError(null);
     };

     return (
       <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
         <h1 className="text-2xl font-bold text-gray-900 mb-8">Generate Product Photo</h1>

         <div className="grid md:grid-cols-2 gap-8">
           {/* Left column: Input */}
           <div className="space-y-6">
             <div>
               <h2 className="text-lg font-medium mb-4">
                 1. Upload Product Image (Optional)
               </h2>
               <UploadForm
                 onUploadComplete={handleUploadComplete}
                 onError={setError}
               />
               {previewUrl && (
                 <button
                   onClick={handleReset}
                   className="mt-2 text-sm text-red-600 hover:text-red-700"
                 >
                   Remove image
                 </button>
               )}
             </div>

             <div>
               <h2 className="text-lg font-medium mb-4">2. Describe the Output</h2>
               <PromptInput
                 value={prompt}
                 onChange={setPrompt}
                 disabled={generating}
               />
             </div>

             <div>
               <h2 className="text-lg font-medium mb-4">3. Aspect Ratio</h2>
               <div className="grid grid-cols-3 gap-2">
                 {(['1:1', '4:3', '3:4', '16:9', '9:16', '3:2'] as AspectRatio[]).map((ratio) => (
                   <button
                     key={ratio}
                     onClick={() => setAspectRatio(ratio)}
                     className={`
                       px-3 py-2 rounded-md border text-sm
                       ${aspectRatio === ratio
                         ? 'border-blue-600 bg-blue-50 text-blue-600'
                         : 'border-gray-300 hover:border-gray-400'
                       }
                     `}
                   >
                     {ratio}
                   </button>
                 ))}
               </div>
             </div>

             {error && (
               <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                 {error}
               </div>
             )}

             <button
               onClick={handleGenerate}
               disabled={generating || credits < 1}
               className="w-full py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
             >
               {generating ? 'Generating...' : `Generate (1 credit)`}
             </button>

             <p className="text-sm text-gray-500 text-center">
               You have {credits} credits remaining
             </p>
           </div>

           {/* Right column: Output */}
           <div>
             <h2 className="text-lg font-medium mb-4">Result</h2>
             <div className="border rounded-lg p-4 min-h-[400px] flex items-center justify-center bg-gray-50">
               {generating ? (
                 <GenerationLoading />
               ) : result ? (
                 <GenerationResult
                   imageUrl={result.imageUrl}
                   onDownload={handleDownload}
                   onRegenerate={handleRegenerate}
                 />
               ) : (
                 <p className="text-gray-400">
                   Generated image will appear here
                 </p>
               )}
             </div>
           </div>
         </div>
       </div>
     );
   }
   ```

### Acceptance Criteria

- [ ] Upload optional product image
- [ ] Enter/select prompt
- [ ] Choose aspect ratio
- [ ] Generate button triggers API
- [ ] Loading state shows during generation
- [ ] Result displays with download/regenerate

---

## Phase 1E Checklist

| Task | Status | Notes |
|------|--------|-------|
| 1E.1 Layout component | ⬜ | |
| 1E.2 Dashboard page | ⬜ | |
| 1E.3 Upload component | ⬜ | |
| 1E.4 Prompt input | ⬜ | |
| 1E.5 Generation preview | ⬜ | |
| 1E.6 Loading states | ⬜ | |
| 1E.7 Image gallery | ⬜ | |
| 1E.8 Download function | ⬜ | |
| 1E.9 Generate page | ⬜ | Integration |

---

## Testing Checklist

- [ ] Can navigate between pages
- [ ] Upload drag-drop works
- [ ] Upload click-select works
- [ ] Prompt templates work
- [ ] Generation completes successfully
- [ ] Result displays correctly
- [ ] Download saves file
- [ ] Gallery shows all images
- [ ] Favorite toggle works
- [ ] Delete removes image
- [ ] Credits update after generation
- [ ] Responsive on mobile

---

## Phase 1 Complete!

After completing Phase 1E, you have a working MVP:

- User authentication
- Image upload to R2
- AI-powered image generation
- Credit system
- Basic gallery UI

**Next Steps:**
- Phase 2: Batch Processing with Trigger.dev
- Phase 3: Stripe Payments
- Phase 4: Polish & Launch
