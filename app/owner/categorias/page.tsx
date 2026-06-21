"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, ChevronDown, ChevronRight, ImageIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface Subcategory {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  subcategories: Subcategory[];
}

type DialogType = "cat-add" | "cat-edit" | "sub-add" | "sub-edit" | "cat-delete" | "sub-delete" | null;

async function uploadImage(file: File, prefix: string): Promise<string> {
  const res = await fetch(`/api/owner/upload-url?contentType=${encodeURIComponent(file.type)}&prefix=${prefix}`);
  if (!res.ok) throw new Error("No se pudo obtener URL de subida");
  const { uploadUrl, publicUrl } = await res.json();
  const put = await fetch(uploadUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
  if (!put.ok) throw new Error("Error al subir imagen");
  return publicUrl;
}

export default function CategoriasPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const [dialog, setDialog] = useState<{
    type: DialogType;
    categoryId?: string;
    subId?: string;
    current?: string;
    currentImage?: string | null;
  }>({ type: null });
  const [inputVal, setInputVal] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageTab, setImageTab] = useState<"upload" | "url">("upload");
  const [imageUrl, setImageUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function fetchCategories() {
    const res = await fetch("/api/owner/categorias");
    if (!res.ok) { toast.error("Error al cargar categorías"); return; }
    setCategories(await res.json());
    setLoading(false);
  }

  useEffect(() => { fetchCategories(); }, []);

  function openDialog(type: DialogType, opts?: { categoryId?: string; subId?: string; current?: string; currentImage?: string | null }) {
    setDialog({ type, ...opts });
    setInputVal(opts?.current ?? "");
    setImageFile(null);
    setImagePreview(opts?.currentImage ?? null);
    setImageUrl(opts?.currentImage ?? "");
    setImageTab("upload");
  }

  function closeDialog() {
    setDialog({ type: null });
    setInputVal("");
    setImageFile(null);
    setImagePreview(null);
    setImageUrl("");
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  function toggleExpand(id: string) {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);
    try {
      const { type, categoryId, subId } = dialog;
      let resolvedImageUrl: string | undefined;

      if (imageTab === "upload" && imageFile) {
        const prefix = type?.startsWith("cat") ? "categorias" : "subcategorias";
        resolvedImageUrl = await uploadImage(imageFile, prefix);
      } else if (imageTab === "url" && imageUrl.trim()) {
        resolvedImageUrl = imageUrl.trim();
      }

      const body: Record<string, unknown> = { name: inputVal };
      if (resolvedImageUrl) body.imageUrl = resolvedImageUrl;

      let res: Response;

      if (type === "cat-add") {
        res = await fetch("/api/owner/categorias", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } else if (type === "cat-edit") {
        res = await fetch(`/api/owner/categorias/${categoryId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } else if (type === "sub-add") {
        res = await fetch(`/api/owner/categorias/${categoryId}/subcategorias`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } else if (type === "sub-edit") {
        res = await fetch(`/api/owner/categorias/${categoryId}/subcategorias/${subId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } else if (type === "cat-delete") {
        res = await fetch(`/api/owner/categorias/${categoryId}`, { method: "DELETE" });
      } else if (type === "sub-delete") {
        res = await fetch(`/api/owner/categorias/${categoryId}/subcategorias/${subId}`, { method: "DELETE" });
      } else { return; }

      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Error"); return; }

      toast.success("Guardado");
      await fetchCategories();
      closeDialog();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error inesperado");
    } finally {
      setSaving(false);
    }
  }

  const isDelete = dialog.type === "cat-delete" || dialog.type === "sub-delete";
  const showImageUpload = !isDelete && dialog.type !== null;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold font-display" style={{ color: "#1A1A2E" }}>Categorías</h1>
        <button
          onClick={() => openDialog("cat-add")}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity"
          style={{ background: "#1EC97E" }}
        >
          <Plus size={16} /> Nueva categoría
        </button>
      </div>

      {loading ? (
        <p className="text-sm" style={{ color: "#6B7280" }}>Cargando...</p>
      ) : categories.length === 0 ? (
        <p className="text-sm" style={{ color: "#6B7280" }}>No hay categorías todavía.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {categories.map(cat => {
            const isOpen = expanded.has(cat.id);
            return (
              <div key={cat.id} className="rounded-xl overflow-hidden border" style={{ background: "#fff", borderColor: "#E5E7EB" }}>
                <div className="flex items-center gap-3 px-4 py-3">
                  <button onClick={() => toggleExpand(cat.id)} style={{ color: "#6B7280" }}>
                    {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </button>
                  {cat.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={cat.imageUrl} alt={cat.name} width={32} height={32} className="rounded-lg object-cover w-8 h-8" />
                  )}
                  <span className="flex-1 font-medium text-sm" style={{ color: "#1A1A2E" }}>{cat.name}</span>
                  <span className="text-xs" style={{ color: "#6B7280" }}>{cat.subcategories.length} subcats</span>
                  <button
                    onClick={() => openDialog("cat-edit", { categoryId: cat.id, current: cat.name, currentImage: cat.imageUrl })}
                    className="p-1.5 rounded-lg transition-colors hover:bg-purple-50"
                    style={{ color: "#6B7280" }}
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => openDialog("cat-delete", { categoryId: cat.id, current: cat.name })}
                    className="p-1.5 rounded-lg transition-colors hover:bg-red-50"
                    style={{ color: "#6B7280" }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                {isOpen && (
                  <div className="px-4 py-3 flex flex-col gap-2" style={{ borderTop: "1px solid #F3F4F6" }}>
                    {cat.subcategories.map(sub => (
                      <div key={sub.id} className="flex items-center gap-2 pl-6">
                        {sub.imageUrl && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={sub.imageUrl} alt={sub.name} className="rounded object-cover w-6 h-6" />
                        )}
                        <span className="flex-1 text-sm" style={{ color: "#6B7280" }}>{sub.name}</span>
                        <button
                          onClick={() => openDialog("sub-edit", { categoryId: cat.id, subId: sub.id, current: sub.name, currentImage: sub.imageUrl })}
                          className="p-1.5 rounded-lg transition-colors hover:bg-purple-50"
                          style={{ color: "#6B7280" }}
                        >
                          <Pencil size={12} />
                        </button>
                        <button
                          onClick={() => openDialog("sub-delete", { categoryId: cat.id, subId: sub.id, current: sub.name })}
                          className="p-1.5 rounded-lg transition-colors hover:bg-red-50"
                          style={{ color: "#6B7280" }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => openDialog("sub-add", { categoryId: cat.id })}
                      className="flex items-center gap-1 pl-6 text-xs font-medium hover:underline mt-1"
                      style={{ color: "#6C5CE7" }}
                    >
                      <Plus size={12} /> Agregar subcategoría
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={dialog.type !== null} onOpenChange={open => !open && closeDialog()}>
        <DialogContent className="bg-white text-[#1A1A2E] border-gray-200">
          <DialogHeader>
            <DialogTitle className="text-[#1A1A2E]">
              {dialog.type === "cat-add" && "Nueva categoría"}
              {dialog.type === "cat-edit" && "Editar categoría"}
              {dialog.type === "sub-add" && "Nueva subcategoría"}
              {dialog.type === "sub-edit" && "Editar subcategoría"}
              {dialog.type === "cat-delete" && "Eliminar categoría"}
              {dialog.type === "sub-delete" && "Eliminar subcategoría"}
            </DialogTitle>
          </DialogHeader>

          {isDelete ? (
            <p className="text-sm" style={{ color: "#6B7280" }}>
              ¿Confirmás que querés eliminar <strong style={{ color: "#1A1A2E" }}>{dialog.current}</strong>? Esta acción no se puede deshacer.
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              <input
                autoFocus
                value={inputVal}
                onChange={e => setInputVal(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !imageFile && handleSave()}
                placeholder="Nombre"
                className="w-full rounded-xl px-3 py-2 text-sm outline-none focus:ring-2"
                style={{
                  border: "1px solid #E5E7EB",
                  color: "#1A1A2E",
                  background: "#fff",
                }}
              />

              {showImageUpload && (
                <div className="flex flex-col gap-2">
                  <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: "#E5E7EB" }}>
                    {(["upload", "url"] as const).map(tab => (
                      <button
                        key={tab}
                        onClick={() => setImageTab(tab)}
                        className="flex-1 py-1.5 text-xs font-medium transition-colors"
                        style={{
                          background: imageTab === tab ? "#6C5CE7" : "#fff",
                          color: imageTab === tab ? "#fff" : "#6B7280",
                        }}
                      >
                        {tab === "upload" ? "Subir archivo" : "URL"}
                      </button>
                    ))}
                  </div>

                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

                  {imageTab === "upload" ? (
                    imagePreview && !imageUrl ? (
                      <div className="relative w-full h-28 rounded-xl overflow-hidden border" style={{ borderColor: "#E5E7EB" }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={imagePreview} alt="preview" className="w-full h-full object-cover" />
                        <button
                          onClick={() => { setImageFile(null); setImagePreview(null); }}
                          className="absolute top-2 right-2 bg-white rounded-full p-1 shadow text-xs"
                          style={{ color: "#6B7280" }}
                        >✕</button>
                      </div>
                    ) : (
                      <button
                        onClick={() => fileRef.current?.click()}
                        className="w-full h-24 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1 transition-colors hover:border-purple-400"
                        style={{ borderColor: "#E5E7EB", color: "#6B7280" }}
                      >
                        <ImageIcon size={20} />
                        <span className="text-xs">Elegir imagen</span>
                      </button>
                    )
                  ) : (
                    <div className="flex flex-col gap-2">
                      <input
                        value={imageUrl}
                        onChange={e => setImageUrl(e.target.value)}
                        placeholder="https://ejemplo.com/imagen.jpg"
                        className="w-full rounded-xl px-3 py-2 text-sm outline-none focus:ring-2"
                        style={{ border: "1px solid #E5E7EB", color: "#1A1A2E", background: "#fff" }}
                      />
                      <p className="text-xs" style={{ color: "#6B7280" }}>
                        Tiene que ser URL directa a imagen (.jpg, .png, .webp). No sirven links a páginas web.
                      </p>
                      {imageUrl.trim() && (
                        <div className="w-full h-28 rounded-xl overflow-hidden border flex items-center justify-center" style={{ borderColor: "#E5E7EB", background: "#F3F4F8" }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={imageUrl.trim()}
                            alt="preview"
                            className="w-full h-full object-cover"
                            onError={e => {
                              (e.target as HTMLImageElement).style.display = "none";
                              (e.target as HTMLImageElement).nextElementSibling?.removeAttribute("hidden");
                            }}
                          />
                          <span hidden className="text-xs" style={{ color: "#6B7280" }}>No se puede previsualizar</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <button
              onClick={closeDialog}
              className="px-4 py-2 text-sm transition-colors"
              style={{ color: "#6B7280" }}
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving || (!isDelete && !inputVal.trim())}
              className="px-4 py-2 text-sm font-semibold text-white rounded-xl transition-opacity disabled:opacity-60"
              style={{ background: isDelete ? "#EF4444" : "#6C5CE7" }}
            >
              {saving ? "Guardando..." : isDelete ? "Eliminar" : "Guardar"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
