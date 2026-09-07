"use client";

import { useState } from "react";
import { UserCircle2, Play } from "lucide-react";
import { IntroVideoUploader } from "./IntroVideoUploader";
import { IntroVideoDeleteButton } from "./IntroVideoDeleteButton";
import { Dialog, DialogContent } from "@/components/ui/dialog";

export function IntroVideo({
  name,
  videoUrl,
  isOwner,
}: {
  name: string;
  videoUrl?: string | null;
  isOwner?: boolean;
}) {
  const [open, setOpen] = useState(false);

  if (!videoUrl && !isOwner) return null;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 flex items-start justify-between gap-4 sm:gap-6">
      <div className="min-w-0">
        <h2 className="text-lg font-bold text-brand-dark mb-1">Video de introducción</h2>
        <p className="text-brand-gray text-sm">Preséntate y conecta con potenciales clientes.</p>
        <p className="text-brand-gray text-xs mt-1">Duración: entre 20 y 60 segundos.</p>

        {isOwner && !videoUrl && (
          <div className="mt-4">
            <IntroVideoUploader name={name} />
          </div>
        )}
      </div>

      <div className="shrink-0 relative w-28 h-28 rounded-xl overflow-hidden bg-brand-bg">
        {videoUrl ? (
          <div className="relative w-full h-full">
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label="Reproducir video de introducción"
              className="relative w-full h-full block cursor-pointer"
            >
              <video
                className="w-full h-full object-cover pointer-events-none"
                src={`/api/avatar?key=${encodeURIComponent(videoUrl)}`}
                muted
                playsInline
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors">
                <div className="w-9 h-9 rounded-full bg-white/90 flex items-center justify-center">
                  <Play size={16} className="text-brand-dark fill-brand-dark ml-0.5" />
                </div>
              </div>
            </button>
            {isOwner && <IntroVideoDeleteButton />}
          </div>
        ) : (
          <div className="relative w-full h-full flex flex-col items-center pt-6 gap-1.5">
            <div className="w-11 h-11 rounded-full bg-brand-green/15 flex items-center justify-center">
              <UserCircle2 size={26} className="text-brand-green" strokeWidth={1.5} />
            </div>
            <span className="w-8 h-0.5 rounded-full bg-gray-300" />
            <Play size={10} className="absolute bottom-3 right-3 text-brand-dark fill-brand-dark" />
          </div>
        )}
      </div>

      {videoUrl && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="sm:max-w-lg p-0 overflow-hidden bg-black border-none">
            <video
              controls
              autoPlay
              className="w-full max-h-[80vh]"
              src={`/api/avatar?key=${encodeURIComponent(videoUrl)}`}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
