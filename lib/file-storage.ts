import crypto from 'crypto';
import path from 'path';

// Secure filename sanitization
function sanitizeFilename(filename: string): string {
  // Remove dangerous characters and patterns
  const sanitized = filename
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, '') // Remove invalid characters
    .replace(/^\.+/, '') // Remove leading dots
    .replace(/\.+$/, '') // Remove trailing dots
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .substring(0, 100); // Limit length
  
  return sanitized || 'file'; // Fallback name
}

// Bunny.net storage configuration
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_EXTENSIONS = [
  '.pdf', '.doc', '.docx', '.txt', '.md', '.rtf',
  '.jpg', '.jpeg', '.png', '.gif', '.webp',
  '.zip', '.rar', '.7z',
  '.mp3', '.mp4', '.avi', '.mov',
  '.xls', '.xlsx', '.csv',
  '.ppt', '.pptx'
];

export interface FileUploadResult {
  success: boolean;
  fileKey?: string;
  originalName?: string;
  size?: number;
  error?: string;
}

export async function saveAssignmentFile(
  file: File,
  userId: string,
  assignmentId: string
): Promise<FileUploadResult> {
  try {
    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return {
        success: false,
        error: `File size too large. Maximum allowed: ${MAX_FILE_SIZE / 1024 / 1024}MB`
      };
    }

    // Validate file extension
    const fileExtension = path.extname(file.name).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(fileExtension)) {
      return {
        success: false,
        error: `File type not allowed. Allowed types: ${ALLOWED_EXTENSIONS.join(', ')}`
      };
    }

    // Sanitize filename
    const sanitizedFileName = sanitizeFilename(file.name);
    if (!sanitizedFileName || sanitizedFileName.length === 0) {
      return {
        success: false,
        error: 'Invalid filename'
      };
    }

    // Create unique file key for Bunny.net
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString('hex');
    const fileName = `${timestamp}_${randomString}_${sanitizedFileName}`;
    const fileKey = `assignments/${assignmentId}/${userId}/${fileName}`;

    // Get Bunny.net credentials
    const storageApiKey = process.env.BUNNY_STORAGE_API_KEY;
    const storageZone = process.env.BUNNY_STORAGE_ZONE_NAME;
    const storageHostname = process.env.BUNNY_STORAGE_HOSTNAME || 'storage.bunnycdn.com';

    if (!storageApiKey || !storageZone) {
      return {
        success: false,
        error: 'Bunny.net storage not configured'
      };
    }

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Bunny.net Storage
    const uploadUrl = `https://${storageHostname}/${storageZone}/${fileKey}`;
    
    console.log('📤 Uploading file to Bunny.net:', uploadUrl);
    
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'AccessKey': storageApiKey,
        'Content-Type': file.type || 'application/octet-stream',
      },
      body: buffer,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('❌ Bunny.net upload failed:', errorText);
      return {
        success: false,
        error: 'Failed to upload file to Bunny.net'
      };
    }

    console.log('✅ File uploaded successfully to Bunny.net:', fileKey);

    return {
      success: true,
      fileKey: fileKey,
      originalName: file.name,
      size: file.size
    };

  } catch (error) {
    console.error('File upload error:', error);
    return {
      success: false,
      error: 'Failed to save file'
    };
  }
}

export function getBunnyFileUrl(fileKey: string): string {
  const cdnUrl = process.env.NEXT_PUBLIC_BUNNY_STORAGE_URL || '';
  return `${cdnUrl}/${fileKey}`;
}

export function isValidFileKey(fileKey: string): boolean {
  // Basic validation to prevent path traversal
  if (!fileKey || fileKey.includes('..') || fileKey.includes('\\')) {
    return false;
  }
  
  // Should match our format: assignments/assignmentId/userId/filename.ext or resources/...
  const parts = fileKey.split('/');
  if (parts.length < 3) {
    return false;
  }
  
  // First part should be a valid prefix
  const validPrefixes = ['assignments', 'resources', 'lesson', 'course', 'logo', 'favicon', 'submissions'];
  if (!validPrefixes.includes(parts[0])) {
    return false;
  }
  
  return true;
}

export async function deleteFromBunny(fileKey: string): Promise<boolean> {
  try {
    const storageApiKey = process.env.BUNNY_STORAGE_API_KEY;
    const storageZone = process.env.BUNNY_STORAGE_ZONE_NAME;
    const storageHostname = process.env.BUNNY_STORAGE_HOSTNAME || 'storage.bunnycdn.com';

    if (!storageApiKey || !storageZone) {
      console.error('Bunny.net storage not configured');
      return false;
    }

    const deleteUrl = `https://${storageHostname}/${storageZone}/${fileKey}`;
    
    console.log('🗑️ Deleting from Bunny.net:', deleteUrl);
    
    const deleteResponse = await fetch(deleteUrl, {
      method: 'DELETE',
      headers: {
        'AccessKey': storageApiKey,
      },
    });

    if (!deleteResponse.ok) {
      const errorText = await deleteResponse.text();
      console.error('❌ Bunny.net delete failed:', errorText);
      return false;
    }

    console.log('✅ File deleted from Bunny.net:', fileKey);
    return true;
  } catch (error) {
    console.error('Error deleting file from Bunny.net:', error);
    return false;
  }
}
