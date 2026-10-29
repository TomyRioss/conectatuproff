// Helper para URLs de avatar. Los avatares externos (Google) se sirven por el
// proxy /api/avatar: el navegador sufre rate-limit/ORB de lh3.googleusercontent.com
// cuando varias <img> piden a la vez, y el fallback de iniciales queda pegado.
export function avatarProxySrc(src: string | null | undefined): string | null {
  if (!src) return null
  if (/^https:\/\/lh3\.googleusercontent\.com\//.test(src)) {
    return `/api/avatar?key=${encodeURIComponent(src)}`
  }
  return src
}
