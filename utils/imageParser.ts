export function parseImageUrls(imageUrlString: string | null | undefined): string[] {
  if (!imageUrlString) return []
  const str = imageUrlString.trim()
  if (str.startsWith('[') && str.endsWith(']')) {
    try {
      return JSON.parse(str)
    } catch (e) {
      // fallback
    }
  }
  if (str.includes(',')) {
    return str.split(',').map(s => s.trim()).filter(Boolean)
  }
  return [str]
}
