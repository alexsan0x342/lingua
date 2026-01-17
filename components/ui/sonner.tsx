"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, ToasterProps } from "sonner"
import { useEffect, useState } from "react"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()
  const [dir, setDir] = useState<"ltr" | "rtl">("ltr")

  useEffect(() => {
    // Get the current direction from the document
    const direction = document.documentElement.dir as "ltr" | "rtl"
    setDir(direction)

    // Listen for direction changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'dir') {
          const newDir = document.documentElement.dir as "ltr" | "rtl"
          setDir(newDir)
        }
      })
    })

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['dir']
    })

    return () => observer.disconnect()
  }, [])

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      dir={dir}
      toastOptions={{
        classNames: {
          toast: dir === 'rtl' ? 'rtl-toast' : '',
          title: dir === 'rtl' ? 'text-right' : '',
          description: dir === 'rtl' ? 'text-right' : '',
          actionButton: dir === 'rtl' ? 'rtl-action' : '',
          cancelButton: dir === 'rtl' ? 'rtl-cancel' : '',
          closeButton: dir === 'rtl' ? 'rtl-close' : '',
        },
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }

