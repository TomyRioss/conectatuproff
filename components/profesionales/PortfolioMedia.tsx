"use client"

import { useState } from "react"
import { Play } from "lucide-react"

// ponytail: tipo inferido por extensión de la key (sin columna en DB)
export function isVideoKey(key: string) {
  return /\.(mp4|webm|quicktime|mov)$/i.test(key)
}

export type MediaOrientation = "portrait" | "landscape"

export function PortfolioMedia({
  mediaKey,
  alt,
  controls = false,
  contain = false,
  className = "",
  onOrientation,
}: {
  mediaKey: string
  alt: string
  controls?: boolean
  contain?: boolean
  className?: string
  onOrientation?: (o: MediaOrientation) => void
}) {
  const [failed, setFailed] = useState(false)
  const src = `/api/avatar?key=${encodeURIComponent(mediaKey)}`

  if (!isVideoKey(mediaKey)) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={alt} className={`w-full h-full ${contain ? "object-contain" : "object-cover"} ${className}`} />
    )
  }

  return (
    <div className={`relative w-full h-full bg-brand-dark ${className}`}>
      <video
        src={src}
        controls={controls}
        muted={!controls}
        playsInline
        preload="metadata"
        aria-label={alt}
        className="w-full h-full object-contain"
        onLoadedMetadata={(e) => {
          const v = e.currentTarget
          onOrientation?.(v.videoHeight > v.videoWidth ? "portrait" : "landscape")
        }}
        onError={() => {
          console.error("PortfolioMedia: no se pudo cargar el video", mediaKey)
          setFailed(true)
        }}
      />
      {failed && (
        <span className="absolute inset-0 flex items-center justify-center text-xs text-white">
          No se pudo cargar el video
        </span>
      )}
      {!controls && !failed && (
        <span className="pointer-events-none absolute bottom-1.5 right-1.5 rounded-full bg-black/60 p-1 text-white">
          <Play size={12} className="fill-white" />
        </span>
      )}
    </div>
  )
}
