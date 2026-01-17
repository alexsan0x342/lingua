'use client';

import Image from "next/image";

interface CourseImageProps {
  src: string;
  alt: string;
  className?: string;
}

export function CourseImage({ src, alt, className }: CourseImageProps) {
  return (
    <Image
      src={src}
      alt={alt}
      fill
      className={className}
      priority
      unoptimized={src.startsWith('/api/') || src.includes('cdn.lingua-ly.com') || src.includes('cdn.novally.tech')}
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 66vw, 50vw"
      onError={(e) => {
        const target = e.target as HTMLImageElement;
        target.src = '/placeholder-course.svg';
      }}
    />
  );
}