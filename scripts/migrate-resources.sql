-- Migration to support ResourceManager interface
-- This adds fields for URL and type-based resources while maintaining backward compatibility

-- Add new columns to Resource table
ALTER TABLE "Resource" 
ADD COLUMN IF NOT EXISTS "url" TEXT,
ADD COLUMN IF NOT EXISTS "type" TEXT DEFAULT 'file',
ADD COLUMN IF NOT EXISTS "isRequired" BOOLEAN DEFAULT false;

-- Update existing resources to use the new structure
-- Convert fileKey URLs to the url field for link types
UPDATE "Resource" 
SET 
  "url" = CASE 
    WHEN "fileKey" LIKE 'http%' THEN "fileKey"
    ELSE NULL
  END,
  "type" = CASE 
    WHEN "fileKey" LIKE 'http%' THEN 'link'
    WHEN "fileType" = 'application/pdf' THEN 'document'
    WHEN "fileType" LIKE 'video/%' THEN 'video'
    WHEN "fileType" LIKE 'image/%' THEN 'file'
    ELSE 'file'
  END;

-- For resources that are now URLs, clear the fileKey
UPDATE "Resource" 
SET "fileKey" = NULL 
WHERE "url" IS NOT NULL;

-- Create an index for better performance
CREATE INDEX IF NOT EXISTS "Resource_type_idx" ON "Resource"("type");
CREATE INDEX IF NOT EXISTS "Resource_lessonId_type_idx" ON "Resource"("lessonId", "type");
