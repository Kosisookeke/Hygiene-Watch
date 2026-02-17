const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

export function hasCloudinaryConfig(): boolean {
  return Boolean(CLOUD_NAME && UPLOAD_PRESET)
}

export async function uploadImage(file: File): Promise<string> {
  if (!hasCloudinaryConfig()) {
    throw new Error('Cloudinary not configured')
  }
  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', UPLOAD_PRESET!)
  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: 'POST', body: formData }
  )
  if (!res.ok) {
    const err = await res.text()
    throw new Error(err || 'Upload failed')
  }
  const data = (await res.json()) as { secure_url: string }
  return data.secure_url
}
