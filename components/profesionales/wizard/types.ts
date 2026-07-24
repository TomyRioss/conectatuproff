export type Category = { id: string; name: string; slug: string }

export type SessionPackage = { sessionCount: string; price: string; frequencyType: FrequencyType }
export type Faq = { question: string; answer: string }
export type GalleryItem = { key: string; type: "image" | "video" }
export type AvailabilityBlock = { dayOfWeek: number; startTime: string; endTime: string }

export type FrequencyType = "UNICA" | "SEMANAL" | "MENSUAL"

export type WizardState = {
  title: string
  price: string
  durationMin: string
  frequencyType: FrequencyType
  frequencyCount: string
  frequencyPeriods: string
  modality: string
  categoryId: string
  extraSessionPrice: string
  sessionPackages: SessionPackage[]
  description: string
  faqs: Faq[]
  gallery: GalleryItem[]
  availability: AvailabilityBlock[]
}

export const initialWizardState: WizardState = {
  title: "",
  price: "",
  durationMin: "",
  frequencyType: "UNICA",
  frequencyCount: "",
  frequencyPeriods: "",
  modality: "",
  categoryId: "",
  extraSessionPrice: "",
  sessionPackages: [],
  description: "",
  faqs: [],
  gallery: [],
  availability: [],
}

export const STEPS = ["Nombre", "Precio y packs", "Horarios", "Descripción", "Galería", "Revisar"] as const
