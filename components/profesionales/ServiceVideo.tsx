"use client"

import { useRef, useState } from "react"

export function ServiceVideo({ videoKey, title }: { videoKey: string; title: string }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPortrait, setIsPortrait] = useState(false)

  async function openFullscreen() {
    const video = videoRef.current
    if (!video) return

    try {
      await video.requestFullscreen()
      await video.play()
    } catch {
      // The browser can reject fullscreen when it is unavailable or disabled.
    }
  }

  return (
    <div className={`relative overflow-hidden rounded-xl bg-brand-dark ${isPortrait ? "aspect-[9/16] max-w-40" : "aspect-video max-w-48"}`}>
      <video
        ref={videoRef}
        src={`/api/avatar?key=${encodeURIComponent(videoKey)}`}
        controls
        playsInline
        preload="metadata"
        aria-label={`Video de ${title}`}
        className="h-full w-full object-contain"
        onLoadedMetadata={(event) => setIsPortrait(event.currentTarget.videoHeight > event.currentTarget.videoWidth)}
      />
      <button
        type="button"
        onClick={openFullscreen}
        className="absolute right-2 top-2 rounded-md bg-brand-dark/80 px-2.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-brand-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
      >
        Pantalla completa
      </button>
    </div>
  )
}
