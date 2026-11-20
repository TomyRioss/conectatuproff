export const PORTFOLIO_MAX_IMAGES = 5
export const PORTFOLIO_MAX_VIDEOS = 1

const VIDEO_KEY = /\.(mp4|webm|quicktime|mov)$/i

/** Devuelve un mensaje de error si las keys superan los límites, o null si están bien. */
export function portfolioLimitError(keys: string[]): string | null {
  const videos = keys.filter((k) => VIDEO_KEY.test(k)).length
  if (videos > PORTFOLIO_MAX_VIDEOS) return `Máximo ${PORTFOLIO_MAX_VIDEOS} video`
  if (keys.length - videos > PORTFOLIO_MAX_IMAGES) return `Máximo ${PORTFOLIO_MAX_IMAGES} imágenes`
  return null
}
