export type Category = { id: string; name: string; slug: string }

export type Faq = { question: string; answer: string }
export type GalleryItem = { key: string; type: "image" | "video"; description: string }
export type AvailabilityBlock = { dayOfWeek: number; startTime: string; endTime: string }

export type FrequencyType = "UNICA" | "SEMANAL" | "MENSUAL"

export type WizardState = {
  title: string
  price: string
  durationMin: string
  frequencyType: FrequencyType | ""
  frequencyCount: string
  frequencyPeriods: string
  modality: string
  categoryId: string
  extraSessionPrice: string
  description: string
  faqs: Faq[]
  gallery: GalleryItem[]
  availability: AvailabilityBlock[]
}

export const initialWizardState: WizardState = {
  title: "",
  price: "",
  durationMin: "",
  frequencyType: "",
  frequencyCount: "",
  frequencyPeriods: "",
  modality: "",
  categoryId: "",
  extraSessionPrice: "",
  description: "",
  faqs: [],
  gallery: [],
  availability: [],
}

export const STEPS = ["Nombre", "Precio y duración", "Horarios", "Descripción", "Mostrá tu trabajo!", "Revisar"] as const
