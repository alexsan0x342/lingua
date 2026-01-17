import "server-only";

import { writeFile } from 'fs/promises';
import { join } from 'path';

export async function saveImageLocally(file: File): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  
  // Generate unique filename
  const timestamp = Date.now();
  const fileName = `${timestamp}-${file.name}`;
  const filePath = join(process.cwd(), 'public', 'images', fileName);
  
  await writeFile(filePath, buffer);
  
  return `/images/${fileName}`;
}

export async function deleteImageLocally(imagePath: string): Promise<boolean> {
  try {
    const fs = await import('fs/promises');
    const fullPath = join(process.cwd(), 'public', imagePath);
    await fs.unlink(fullPath);
    return true;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
}
