// Singura sursă pentru URL-ul API. Build-urile de producție eșuează (vite.config.ts)
// dacă VITE_API_URL lipsește; default-ul localhost e doar pentru dev.
export function resolveBaseUrl(env: string | undefined, isProd: boolean): string {
  if (env) return env
  if (isProd) throw new Error('VITE_API_URL is not set')
  return 'http://localhost:3000/api/v1'
}

export const BASE_URL = resolveBaseUrl(import.meta.env.VITE_API_URL, import.meta.env.PROD)
