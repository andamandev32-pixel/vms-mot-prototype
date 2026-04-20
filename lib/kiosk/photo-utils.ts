export function toDataUrl(photo: string): string {
  if (photo.startsWith("data:image/")) return photo;
  return `data:image/jpeg;base64,${photo}`;
}
