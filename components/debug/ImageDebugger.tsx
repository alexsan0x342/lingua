"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';

export function ImageDebugger() {
  const [tests, setTests] = useState({
    staticLogo: { status: 'testing', error: null },
    staticFavicon: { status: 'testing', error: null },
    staticPlaceholder: { status: 'testing', error: null },
  });

  const testImages = [
    { key: 'staticLogo', src: '/logo.svg', name: 'Static Logo' },
    { key: 'staticFavicon', src: '/favicon.ico', name: 'Static Favicon' },
    { key: 'staticPlaceholder', src: '/placeholder-course.jpg', name: 'Static Placeholder' },
  ];

  useEffect(() => {
    testImages.forEach(({ key, src }) => {
      const img = new window.Image();
      
      img.onload = () => {
        setTests(prev => ({
          ...prev,
          [key]: { status: 'success', error: null }
        }));
      };
      
      img.onerror = (error) => {
        setTests(prev => ({
          ...prev,
          [key]: { status: 'error', error: error.toString() }
        }));
      };
      
      img.src = src;
    });
  }, []);

  return (
    <div className="p-6 bg-white border rounded-lg shadow">
      <h3 className="text-lg font-bold mb-4">Image Loading Debug</h3>
      
      <div className="space-y-4">
        {testImages.map(({ key, src, name }) => {
          const test = tests[key as keyof typeof tests];
          return (
            <div key={key} className="flex items-center gap-4 p-3 border rounded">
              <div className="w-16 h-16 border rounded overflow-hidden bg-gray-100">
                <Image
                  src={src}
                  alt={name}
                  width={64}
                  height={64}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    console.error(`Failed to load ${name}:`, src);
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              </div>
              
              <div className="flex-1">
                <div className="font-medium">{name}</div>
                <div className="text-sm text-gray-600">URL: {src}</div>
                <div className={`text-sm ${
                  test.status === 'success' ? 'text-green-600' : 
                  test.status === 'error' ? 'text-red-600' : 'text-yellow-600'
                }`}>
                  Status: {test.status}
                  {test.error && ` - ${test.error}`}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 p-3 bg-gray-50 rounded">
        <h4 className="font-medium mb-2">Environment Info:</h4>
        <div className="text-sm space-y-1">
          <div>Current URL: {typeof window !== 'undefined' ? window.location.href : 'N/A'}</div>
          <div>Base URL: {typeof window !== 'undefined' ? window.location.origin : 'N/A'}</div>
          <div>User Agent: {typeof window !== 'undefined' ? navigator.userAgent : 'N/A'}</div>
        </div>
      </div>
    </div>
  );
}