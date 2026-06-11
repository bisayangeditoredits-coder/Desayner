# Design Feedback Board - Setup Guide

## Step 1: Run the SQL Migration

Go to your **Supabase Dashboard → SQL Editor** and run the contents of:

```
feedback_migration.sql
```

This creates:
- `feedback_requests` table
- `feedback_comments` table
- `feedback_helpful` table
- Indexes for scale
- RLS policies for security
- Functions for atomic counters

## Step 2: Restart the App

After running the migration, restart your Next.js dev server:

```bash
npm run dev
```

The new "Feedback" link will appear in the sidebar replacing "Inspirations".

## How Uploads Work

Images are uploaded via **Cloudflare R2** (the same upload pipeline used by projects and inspirations). The `useUpload` hook handles:
- Image compression (WebP)
- Presigned URL generation via `/api/upload`
- Direct PUT to R2
- Thumbnail generation

**No additional storage setup needed** — it uses the existing R2 bucket.

## Features

### For Users:
- **Upload designs** — JPG, PNG, WebP, GIF, AVIF, max 10MB
- **Describe what feedback you want** — title + description
- **Tag feedback types** — Typography, Colors, Layout, UI/UX, etc.
- **Status tracking** — Open → Closed → Implemented

### For Community:
- **Comment** — Give constructive feedback on designs
- **Reply** — Threaded replies for deeper discussion
- **Mark Helpful** — Vote up useful comments
- **View designs** — Click to zoom with lightbox

### For Owners:
- **Change status** — Close when feedback is received, mark as implemented
- **Delete** — Remove your own feedback requests

## Database Schema

```
feedback_requests
├── id (UUID, PK)
├── user_id (FK → profiles)
├── title (TEXT)
├── description (TEXT)
├── image_url (TEXT)
├── thumbnail_url (TEXT)
├── feedback_type (TEXT[])
├── status ('open' | 'closed' | 'implemented')
├── comments_count (INT)
├── helpful_count (INT)
├── views_count (INT)
├── created_at (TIMESTAMPTZ)
└── updated_at (TIMESTAMPTZ)

feedback_comments
├── id (UUID, PK)
├── feedback_id (FK → feedback_requests, CASCADE)
├── user_id (FK → profiles)
├── body (TEXT)
├── parent_id (FK → feedback_comments, nullable)
├── is_helpful (BOOLEAN)
└── created_at (TIMESTAMPTZ)

feedback_helpful
├── id (UUID, PK)
├── comment_id (FK → feedback_comments, CASCADE)
├── user_id (FK → profiles)
├── created_at (TIMESTAMPTZ)
└── UNIQUE(comment_id, user_id)
```

## Scalability Notes

- **Indexing**: All queries are properly indexed for fast lookups
- **Cursor-based pagination**: No offset issues, works perfectly with millions of rows
- **RLS policies**: Row Level Security ensures data integrity
- **Atomic counters**: Views, comments, helpful counts use PostgreSQL functions
- **Cloudflare R2**: CDN-backed image hosting via existing pipeline
- **No N+1 queries**: Comments fetch replies in batch