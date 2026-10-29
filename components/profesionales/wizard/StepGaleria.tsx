import { useState } from "react"
import { toast } from "sonner"
import { Loader2, Upload, X, Video as VideoIcon } from "lucide-react"
import { Input } from "@/components/ui/input"
import type { WizardState } from "./types"

const MAX_IMAGES = 5

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
  const [isPortraitVideo, setIsPortraitVideo] = useState(false)

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
      toast.error(`Máximo ${MAX_IMAGES} fotos`)
      return
    }
    const toUpload = files.slice(0, remaining)
    if (files.length > toUpload.length) {
      toast.error(`Máximo ${MAX_IMAGES} fotos, se subieron las primeras ${toUpload.length}`)
    }
    setUploadingImage(true)
    try {
      const uploaded = await Promise.all(toUpload.map((file) => uploadFile(file)))
      update({ gallery: [...state.gallery, ...uploaded.map(({ key }) => ({ key, type: "image" as const, description: "" }))] })
      toast.success("Foto subida")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo subir la foto")
    } finally {
      setUploadingImage(false)
    }
  }

  async function handleVideoUpload(file: File) {
    const duration = await getVideoDuration(file).catch(() => null)
    if (duration === null) {
      toast.error("No se pudo leer la duración del video")
      return
    }
    if (duration < 20 || duration > 180) {
      toast.error("El video debe durar entre 20 segundos y 3 minutos")
      return
    }

    setUploadingVideo(true)
    try {
      const { key } = await uploadFile(file)
      setVideoUrl(key)
      toast.success("Video subido")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo subir el video")
    } finally {
      setUploadingVideo(false)
    }
  }

  function getVideoDuration(file: File) {
    return new Promise<number>((resolve, reject) => {
      const video = document.createElement("video")
      const url = URL.createObjectURL(file)
      video.preload = "metadata"
      video.onloadedmetadata = () => {
        URL.revokeObjectURL(url)
        if (Number.isFinite(video.duration)) resolve(video.duration)
        else reject(new Error("Duración de video inválida"))
      }
      video.onerror = () => {
        URL.revokeObjectURL(url)
        reject(new Error("No se pudo leer la duración del video"))
      }
      video.src = url
    })
  }

  function removeImage(key: string) {
    update({ gallery: state.gallery.filter((g) => g.key !== key) })
  }

  function updateImageDescription(key: string, description: string) {
    update({ gallery: state.gallery.map((image) => image.key === key ? { ...image, description } : image) })
  }

  return (
    <div className="max-w-2xl">
      <h2 className="text-xl sm:text-2xl font-bold text-brand-dark">Mostrá tu trabajo!</h2>
      <p className="text-brand-gray text-sm mt-1">
        Podés omitir este paso y publicar sin fotos ni video.
      </p>

      <div className="mt-6">
        <p className="text-sm font-medium text-brand-dark mb-2">Fotos de tus trabajos (opcional, hasta 5)</p>
        <div className="grid grid-cols-3 gap-2.5 sm:flex sm:flex-wrap sm:gap-4">
          {state.gallery.map((item, i) => (
            <div key={item.key} className="w-full min-w-0 sm:w-40">
              <div className="relative aspect-square w-full overflow-hidden rounded-xl border border-gray-200 bg-brand-bg">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/api/avatar?key=${encodeURIComponent(item.key)}`}
                  alt=""
                  className="h-full w-full object-cover"
                />
                {i === 0 && (
                  <span className="absolute bottom-1 left-1 text-[10px] font-semibold bg-brand-dark text-white px-1.5 py-0.5 rounded">
                    Portada
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => removeImage(item.key)}
                  aria-label="Quitar foto"
                  className="absolute top-1 right-1 w-6 h-6 rounded-full bg-white/90 flex items-center justify-center text-brand-gray hover:text-red-600"
                >
                  <X size={14} />
                </button>
              </div>
              <Input
                value={item.description}
                onChange={(event) => updateImageDescription(item.key, event.target.value)}
                placeholder="Descripción (opcional)"
                aria-label={`Descripción de la foto ${i + 1}`}
                maxLength={300}
                className="mt-2"
              />
            </div>
          ))}

          {state.gallery.length < MAX_IMAGES && (
            <label className="w-full aspect-square sm:w-32 sm:h-32 sm:aspect-auto rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-1.5 text-brand-gray hover:border-brand-violet hover:text-brand-violet cursor-pointer transition-colors min-h-[96px]">
              {uploadingImage ? <Loader2 size={20} className="animate-spin" /> : <Upload size={20} />}
              <span className="text-xs">{uploadingImage ? "Subiendo..." : "Subir foto"}</span>
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
        <p className="text-sm font-medium text-brand-dark mb-2">Video breve (opcional)</p>
        <p className="text-xs text-brand-gray mb-2">Subilo desde tu dispositivo, uno por uno. Duración: de 20 segundos a 3 minutos.</p>
        {videoUrl ? (
          <div className={`relative w-full ${isPortraitVideo ? "max-w-32 aspect-[9/16]" : "max-w-48 aspect-video"} rounded-xl overflow-hidden border border-gray-200 bg-black`}>
            <video
              src={`/api/avatar?key=${encodeURIComponent(videoUrl)}`}
              className="w-full h-full object-contain"
              controls
              playsInline
              preload="metadata"
              onLoadedMetadata={(event) => setIsPortraitVideo(event.currentTarget.videoHeight > event.currentTarget.videoWidth)}
            />
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
          <label className="w-full max-w-48 aspect-video rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-1.5 text-brand-gray hover:border-brand-violet hover:text-brand-violet cursor-pointer transition-colors">
            {uploadingVideo ? <Loader2 size={20} className="animate-spin" /> : <VideoIcon size={20} />}
            <span className="text-xs">{uploadingVideo ? "Subiendo..." : "Subir video"}</span>
            <input
              type="file"
              accept="video/mp4,video/webm,video/quicktime"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                e.target.value = ""
                if (file) handleVideoUpload(file)
              }}
            />
          </label>
        )}
      </div>
    </div>
  )
}
