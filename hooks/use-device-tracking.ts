"use client";

import { useEffect, useRef } from "react";
import { useSession } from "./use-session";

const DEVICE_ID_KEY = "device_id";
const TRACKING_INTERVAL = 5 * 60 * 1000; // Track every 5 minutes

export function useDeviceTracking() {
  const { session } = useSession();
  const lastTrackedRef = useRef<number>(0);

  useEffect(() => {
    if (!session?.user?.id) return;

    const trackDevice = async () => {
      const now = Date.now();
      
      // Only track if enough time has passed
      if (now - lastTrackedRef.current < TRACKING_INTERVAL) {
        return;
      }

      try {
        // Get or create device ID
        let deviceId = localStorage.getItem(DEVICE_ID_KEY);
        if (!deviceId) {
          deviceId = generateDeviceId();
          localStorage.setItem(DEVICE_ID_KEY, deviceId);
        }

        // Track device with location
        const response = await fetch("/api/track-device", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ deviceId }),
        });

        if (response.ok) {
          lastTrackedRef.current = now;
          const data = await response.json();
          console.log("Device tracked with location:", data.location);
        }
      } catch (error) {
        console.error("Failed to track device:", error);
      }
    };

    // Track immediately on mount
    trackDevice();

    // Set up interval to track periodically
    const intervalId = setInterval(trackDevice, TRACKING_INTERVAL);

    return () => clearInterval(intervalId);
  }, [session?.user?.id]);
}

function generateDeviceId(): string {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
}
