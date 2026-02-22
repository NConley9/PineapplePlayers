export function resolvePhotoUrl(url?: string | null): string | null {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('data:') || url.startsWith('blob:')) return url;

  const base = import.meta.env.VITE_API_URL || '';

  if (url.startsWith('/uploads/')) {
    if (base) return `${base}${url}`;
    return url;
  }

  if (url.startsWith('/')) return url;

  if (!base) return url;
  return `${base}/${url}`;
}
