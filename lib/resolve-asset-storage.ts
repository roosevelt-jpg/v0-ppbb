import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getIntegrationServer } from '@/lib/integrations/handlers-server'
import { INTEGRATION_OWNER_USER_ID } from '@/lib/integrations/constants'
import { uploadBufferToStorage } from '@/lib/storage-server'
import { uploadToGoogleDrive } from '@/lib/google-drive-storage'
import type { AssetStorageProvider } from '@/lib/asset-library-types'

interface UploadResult {
  url: string
  path: string
  contentType: string
  size: number
}
export async function getActiveAssetStorageProvider(): Promise<AssetStorageProvider> {
  try {
    const config = await getIntegrationServer(INTEGRATION_OWNER_USER_ID, 'eventAssetsStorage')
    const provider = config?.credentials?.provider as AssetStorageProvider | undefined
    if (
      provider === 'firebase' ||
      provider === 'aws_s3' ||
      provider === 'google_cloud' ||
      provider === 'google_drive'
    ) {
      return provider
    }
  } catch {
    // fall through to Firebase default
  }
  return 'firebase'
}

async function uploadToAwsS3(
  buffer: Buffer,
  mimeType: string,
  folderPath: string,
  originalName: string
): Promise<UploadResult & { provider: AssetStorageProvider }> {
  const integration = await getIntegrationServer(INTEGRATION_OWNER_USER_ID, 'cloudStorage')
  const creds = integration?.credentials
  if (!creds?.accessKeyId || !creds?.secretAccessKey || !creds?.bucketName) {
    throw new Error('AWS S3 is selected but Cloud Storage (S3) integration is not configured.')
  }

  const region = creds.region || 'us-east-1'
  const ext = originalName.includes('.') ? originalName.split('.').pop() : mimeType.split('/')[1]
  const key = `event-assets/${folderPath.replace(/^\/+|\/+$/g, '')}/${Date.now()}-${originalName || `file.${ext}`}`

  const client = new S3Client({
    region,
    credentials: {
      accessKeyId: creds.accessKeyId,
      secretAccessKey: creds.secretAccessKey,
    },
  })

  await client.send(
    new PutObjectCommand({
      Bucket: creds.bucketName,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
    })
  )

  const url = creds.publicBaseUrl
    ? `${creds.publicBaseUrl.replace(/\/$/, '')}/${key}`
    : `https://${creds.bucketName}.s3.${region}.amazonaws.com/${key}`

  return {
    url,
    path: key,
    contentType: mimeType,
    size: buffer.length,
    provider: 'aws_s3',
  }
}
async function uploadToGoogleCloud(
  buffer: Buffer,
  mimeType: string,
  folderPath: string,
  originalName: string
): Promise<UploadResult & { provider: AssetStorageProvider }> {
  const integration = await getIntegrationServer(INTEGRATION_OWNER_USER_ID, 'googleCloudStorage')
  const bucketName = integration?.credentials?.bucketName
  if (bucketName) {
    // Uses Firebase Admin bucket when project matches; explicit path under event-assets/
    const result = await uploadBufferToStorage(
      buffer,
      mimeType,
      `event-assets/${folderPath}`,
      originalName
    )
    return { ...result, provider: 'google_cloud' }
  }
  const result = await uploadBufferToStorage(buffer, mimeType, `event-assets/${folderPath}`, originalName)
  return { ...result, provider: 'google_cloud' }
}

/**
 * Upload event asset bytes using the provider selected in Integrations.
 * Defaults to Firebase / Google Cloud Storage (cheapest when already on Firebase).
 */
export async function uploadEventAsset(
  buffer: Buffer,
  mimeType: string,
  folderPath: string,
  originalName: string
): Promise<UploadResult & { provider: AssetStorageProvider; driveFileId?: string | null }> {
  const provider = await getActiveAssetStorageProvider()

  switch (provider) {
    case 'aws_s3':
      return uploadToAwsS3(buffer, mimeType, folderPath, originalName)
    case 'google_cloud':
      return uploadToGoogleCloud(buffer, mimeType, folderPath, originalName)
    case 'google_drive':
      return uploadToGoogleDrive(buffer, mimeType, folderPath, originalName)
    default:
      break
  }

  const result = await uploadBufferToStorage(buffer, mimeType, `event-assets/${folderPath}`, originalName)
  return { ...result, provider: 'firebase', driveFileId: null }
}
