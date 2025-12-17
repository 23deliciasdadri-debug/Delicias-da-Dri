-- Migration: Create avatars storage bucket
-- Creates a public bucket for user avatar images with proper RLS policies
-- Create the bucket (public so avatars can be viewed without auth)
INSERT INTO storage.buckets (
        id,
        name,
        public,
        file_size_limit,
        allowed_mime_types
    )
VALUES (
        'avatars',
        'avatars',
        true,
        2097152,
        -- 2MB limit
        ARRAY ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    ) ON CONFLICT (id) DO NOTHING;
-- Policy: Authenticated users can upload to their own folder
CREATE POLICY "Users can upload own avatar" ON storage.objects FOR
INSERT TO authenticated WITH CHECK (
        bucket_id = 'avatars'
        AND (storage.foldername(name)) [1] = auth.uid()::text
    );
-- Policy: Authenticated users can update their own avatar
CREATE POLICY "Users can update own avatar" ON storage.objects FOR
UPDATE TO authenticated USING (
        bucket_id = 'avatars'
        AND (storage.foldername(name)) [1] = auth.uid()::text
    ) WITH CHECK (
        bucket_id = 'avatars'
        AND (storage.foldername(name)) [1] = auth.uid()::text
    );
-- Policy: Authenticated users can delete their own avatar
CREATE POLICY "Users can delete own avatar" ON storage.objects FOR DELETE TO authenticated USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name)) [1] = auth.uid()::text
);
-- Policy: Anyone can view avatars (public bucket)
CREATE POLICY "Anyone can view avatars" ON storage.objects FOR
SELECT TO public USING (bucket_id = 'avatars');