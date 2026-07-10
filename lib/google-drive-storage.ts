import { Readable } from 'stream'
import { google } from 'googleapis'
import { getIntegrationServer } from '@/lib/integrations/handlers-server'
import { INTEGRATION_OWNER_USER_ID } from '@/lib/integrations/constants'
import type { AssetStorageProvider } from '@/lib/asset-library-types'

export interface DriveUploadResult {
  url: string
  path: string
  contentType: string
  size: number
  provider: AssetStorageProvider
  driveFileId: string
}

function parseServiceAccountJson(input: string): Record<string, unknown> {
  try {
    return JSON.parse(input)
  } catch {
    const repaired = input.replace(
      /("private_key"\s*:\s*")([\s\S]*?)("(?:\s*,|\s*}))/,
      (_match, prefix, keyBody, suffix) => {
        const escaped = keyBody
          .replace(/\r\n/g, '\\n')
          .replace(/\r/g, '\\n')
          .replace(/\n/g, '\\n')
          .replace(/\t/g, '\\t')
        return `${prefix}${escaped}${suffix}`
      }
    )
    return JSON.parse(repaired)
  }
}

async function getDriveClient() {
  const integration = await getIntegrationServer(INTEGRATION_OWNER_USER_ID, 'googleDrive')
  const creds = integration?.credentials
  if (!creds?.serviceAccountJson || !creds?.folderId) {
    throw new Error(
      'Google Drive is selected but Google Drive integration is not configured (service account + folder ID).'
    )
  }

  const serviceAccount = parseServiceAccountJson(creds.serviceAccountJson)
  const auth = new google.auth.GoogleAuth({
    credentials: serviceAccount as Parameters<typeof google.auth.GoogleAuth>[0]['credentials'],
    scopes: ['https://www.googleapis.com/auth/drive.file'],
  })

  return {
    drive: google.drive({ version: 'v3', auth }),
    folderId: creds.folderId.trim(),
  }
}

export async function uploadToGoogleDrive(
  buffer: Buffer,
  mimeType: string,
  folderPath: string,
  originalName: string
): Promise<DriveUploadResult> {
  const { drive, folderId } = await getDriveClient()
  const safeName = originalName || `asset-${Date.now()}`

  const created = await drive.files.create({
    requestBody: {
      name: safeName,
      parents: [folderId],
      description: `Passive Blessings event asset (${folderPath})`,
    },
    media: {
      mimeType,
      body: Readable.from(buffer),
    },
    fields: 'id, name, webViewLink, webContentLink, thumbnailLink, mimeType, size',
  })

  const fileId = created.data.id
  if (!fileId) {
    throw new Error('Google Drive upload failed — no file ID returned.')
  }

  // Allow anyone with the link to view (typical for shared event galleries).
  try {
    await drive.permissions.create({
      fileId,
      requestBody: { role: 'reader', type: 'anyone' },
    })
  } catch {
    // Folder may inherit permissions from parent shared folder.
  }

  const refreshed = await drive.files.get({
    fileId,
    fields: 'id, webViewLink, webContentLink, thumbnailLink, mimeType, size',
  })

  const url =
    refreshed.data.webViewLink ||
    refreshed.data.webContentLink ||
    `https://drive.google.com/file/d/${fileId}/view`

  return {
    url,
    path: `drive://${fileId}`,
    contentType: refreshed.data.mimeType || mimeType,
    size: Number(refreshed.data.size || buffer.length),
    provider: 'google_drive',
    driveFileId: fileId,
  }
}

export async function deleteFromGoogleDrive(driveFileId: string): Promise<void> {
  if (!driveFileId) return
  try {
    const { drive } = await getDriveClient()
    await drive.files.delete({ fileId: driveFileId })
  } catch (error) {
    console.warn('[assets] Google Drive delete failed:', error)
  }
}
