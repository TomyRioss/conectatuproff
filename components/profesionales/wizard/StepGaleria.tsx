import { useState } from "react"
import { toast } from "sonner"
import { Loader2, Upload, X, Video as VideoIcon } from "lucide-react"
import type { WizardState } from "./types"

const MAX_IMAGES = 3

export function StepGaleria({
  state,
  update,
  videoUrl,
  setVideoUrl,
}: {
  state: WizardState
  update: (patch: Partial<WizardState>) => void
  videoUrl: string
  setVideoUrl: (key: string) => void
}) {
  const [uploadingImage, setUploadingImage] = useState(false)
  const [uploadingVideo, setUploadingVideo] = useState(false)

  async function uploadFile(file: File) {
    const formData = new FormData()
    formData.append("file", file)
    const res = await fetch("/api/profesional/servicios/upload-media", { method: "POST", body: formData })
    const data = await res.json().catch(() => null)
    if (!res.ok) throw new Error(data?.error ?? "No se pudo subir")
    return data as { key: string; type: "image" | "video" }
  }

  async function handleImageUpload(files: File[]) {
    const remaining = MAX_IMAGES - state.gallery.length
    if (remaining <= 0) {
      toast.error(`Máximo ${MAX_IMAGES} imágenes`)
      return
    }
    const toUpload = files.slice(0, remaining)
    if (files.length > toUpload.length) {
      toast.error(`Máximo ${MAX_IMAGES} imágenes, se subieron las primeras ${toUpload.length}`)
    }
    setUploadingImage(true)
    try {
      const uploaded = await Promise.all(toUpload.map((file) => uploadFile(file)))
      update({ gallery: [...state.gallery, ...uploaded.map(({ key }) => ({ key, type: "image" as const }))] })
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo subir la imagen")
    } finally {
      setUploadingImage(false)
    }
  }

  async function handleVideoUpload(file: File) {
    setUploadingVideo(true)
    try {
      const { key } = await uploadFile(file)
      setVideoUrl(key)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo subir el video")
    } finally {
      setUploadingVideo(false)
    }
  }

  function removeImage(key: string) {
    update({ gallery: state.gallery.filter((g) => g.key !== key) })
  }

  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-bold text-brand-dark">Galería</h2>
      <p className="text-brand-gray text-sm mt-1">
        La primera imagen es la portada del servicio. Máximo {MAX_IMAGES} imágenes y 1 video.
      </p>

      <div className="mt-6">
        <p className="text-sm font-medium text-brand-dark mb-2">Imágenes</p>
        <div className="flex flex-wrap gap-4">
          {state.gallery.map((item, i) => (
            <div key={item.key} className="relative w-32 h-32 rounded-xl overflow-hidden border border-gray-200 bg-brand-bg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/avatar?key=${encodeURIComponent(item.key)}`}
                alt=""
                className="w-full h-full object-cover"
              />
              {i === 0 && (
                <span className="absolute bottom-1 left-1 text-[10px] font-semibold bg-brand-dark text-white px-1.5 py-0.5 rounded">
                  Portada
                </span>
              )}
              <button
                type="button"
                onClick={() => removeImage(item.key)}
                aria-label="Quitar imagen"
                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-white/90 flex items-center justify-center text-brand-gray hover:text-red-600"
              >
                <X size={14} />
              </button>
            </div>
          ))}

          {state.gallery.length < MAX_IMAGES && (
            <label className="w-32 h-32 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-1.5 text-brand-gray hover:border-brand-violet hover:text-brand-violet cursor-pointer transition-colors">
              {uploadingImage ? <Loader2 size={20} className="animate-spin" /> : <Upload size={20} />}
              <span className="text-xs">{uploadingImage ? "Subiendo..." : "Subir imagen"}</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="hidden"
                onChange={(e) => {
                  const files = Array.from(e.target.files ?? [])
                  if (files.length) handleImageUpload(files)
                  e.target.value = ""
                }}
              />
            </label>
          )}
        </div>
      </div>

      <div className="mt-8">
        <p className="text-sm font-medium text-brand-dark mb-2">Video (opcional)</p>
        {videoUrl ? (
          <div className="relative w-56 aspect-video rounded-xl overflow-hidden border border-gray-200 bg-black">
            <video src={`/api/avatar?key=${encodeURIComponent(videoUrl)}`} className="w-full h-full object-cover" muted />
            <button
              type="button"
              onClick={() => setVideoUrl("")}
              aria-label="Quitar video"
              className="absolute top-1 right-1 w-6 h-6 rounded-full bg-white/90 flex items-center justify-center text-brand-gray hover:text-red-600"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <label className="w-56 aspect-video rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-1.5 text-brand-gray hover:border-brand-violet hover:text-brand-violet cursor-pointer transition-colors">
            {uploadingVideo ? <Loader2 size={20} className="animate-spin" /> : <VideoIcon size={20} />}
            <span className="text-xs">{uploadingVideo ? "Subiendo..." : "Subir video"}</span>
            <input
              type="file"
              accept="video/mp4,video/webm,video/quicktime"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleVideoUpload(file)
              }}
            />
          </label>
        )}
      </div>
    </div>
  )
}
