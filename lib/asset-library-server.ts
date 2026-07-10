import { FieldValue, Timestamp } from 'firebase-admin/firestore'
import { getAdminDb } from '@/lib/firebase-admin'
import { deleteFromStorage } from '@/lib/storage-server'
import type {
  AssetFile,
  AssetFolder,
  AssetFolderStatus,
  AssetFolderVisibility,
} from '@/lib/asset-library-types'

const FOLDERS = 'assetFolders'
const FILES = 'assetFiles'

function toIso(value: unknown): string {
  if (value instanceof Timestamp) return value.toDate().toISOString()
  if (value instanceof Date) return value.toISOString()
  if (typeof value === 'string') return value
  return new Date().toISOString()
}

function mapFolder(id: string, data: FirebaseFirestore.DocumentData): AssetFolder {
  return {
    id,
    name: data.name || 'Untitled folder',
    description: data.description || '',
    tags: Array.isArray(data.tags) ? data.tags : [],
    eventId: data.eventId ?? null,
    eventTitle: data.eventTitle ?? null,
    visibility: (data.visibility || 'both') as AssetFolderVisibility,
    status: (data.status || 'draft') as AssetFolderStatus,
    coverImageUrl: data.coverImageUrl ?? null,
    fileCount: typeof data.fileCount === 'number' ? data.fileCount : 0,
    storageProvider: data.storageProvider || 'firebase',
    createdAt: toIso(data.createdAt),
    updatedAt: toIso(data.updatedAt),
    createdBy: data.createdBy,
  }
}

function mapFile(id: string, data: FirebaseFirestore.DocumentData): AssetFile {
  return {
    id,
    folderId: data.folderId,
    name: data.name || 'Untitled file',
    description: data.description || '',
    tags: Array.isArray(data.tags) ? data.tags : [],
    type: data.type || 'document',
    url: data.url,
    storagePath: data.storagePath,
    mimeType: data.mimeType || 'application/octet-stream',
    size: data.size || 0,
    storageProvider: data.storageProvider || 'firebase',
    createdAt: toIso(data.createdAt),
    updatedAt: toIso(data.updatedAt),
    createdBy: data.createdBy,
  }
}

export async function listAssetFolders(options: {
  status?: AssetFolderStatus | 'all'
  limit?: number
} = {}): Promise<AssetFolder[]> {
  const db = getAdminDb()
  let query: FirebaseFirestore.Query = db.collection(FOLDERS).orderBy('updatedAt', 'desc')
  if (options.status && options.status !== 'all') {
    query = query.where('status', '==', options.status)
  }
  if (options.limit) query = query.limit(options.limit)
  const snap = await query.get()
  return snap.docs.map((doc) => mapFolder(doc.id, doc.data()))
}

export async function getAssetFolder(folderId: string): Promise<AssetFolder | null> {
  const doc = await getAdminDb().collection(FOLDERS).doc(folderId).get()
  if (!doc.exists) return null
  return mapFolder(doc.id, doc.data()!)
}

export async function createAssetFolder(
  input: Omit<AssetFolder, 'id' | 'fileCount' | 'createdAt' | 'updatedAt'>,
  createdBy: string
): Promise<AssetFolder> {
  const now = FieldValue.serverTimestamp()
  const payload = {
    name: input.name.trim(),
    description: input.description?.trim() || '',
    tags: input.tags || [],
    eventId: input.eventId || null,
    eventTitle: input.eventTitle || null,
    visibility: input.visibility || 'both',
    status: input.status || 'draft',
    coverImageUrl: input.coverImageUrl || null,
    fileCount: 0,
    storageProvider: input.storageProvider || 'firebase',
    createdBy,
    createdAt: now,
    updatedAt: now,
  }
  const ref = await getAdminDb().collection(FOLDERS).add(payload)
  const created = await ref.get()
  return mapFolder(created.id, created.data()!)
}

export async function updateAssetFolder(
  folderId: string,
  patch: Partial<
    Pick<
      AssetFolder,
      | 'name'
      | 'description'
      | 'tags'
      | 'eventId'
      | 'eventTitle'
      | 'visibility'
      | 'status'
      | 'coverImageUrl'
    >
  >
): Promise<AssetFolder | null> {
  const ref = getAdminDb().collection(FOLDERS).doc(folderId)
  const existing = await ref.get()
  if (!existing.exists) return null

  const update: Record<string, unknown> = { updatedAt: FieldValue.serverTimestamp() }
  if (patch.name !== undefined) update.name = patch.name.trim()
  if (patch.description !== undefined) update.description = patch.description.trim()
  if (patch.tags !== undefined) update.tags = patch.tags
  if (patch.eventId !== undefined) update.eventId = patch.eventId
  if (patch.eventTitle !== undefined) update.eventTitle = patch.eventTitle
  if (patch.visibility !== undefined) update.visibility = patch.visibility
  if (patch.status !== undefined) update.status = patch.status
  if (patch.coverImageUrl !== undefined) update.coverImageUrl = patch.coverImageUrl

  await ref.update(update)
  const updated = await ref.get()
  return mapFolder(updated.id, updated.data()!)
}

export async function deleteAssetFolder(folderId: string): Promise<boolean> {
  const db = getAdminDb()
  const filesSnap = await db.collection(FILES).where('folderId', '==', folderId).get()
  for (const fileDoc of filesSnap.docs) {
    const data = fileDoc.data()
    if (data.storagePath) await deleteFromStorage(data.storagePath)
    await fileDoc.ref.delete()
  }
  await db.collection(FOLDERS).doc(folderId).delete()
  return true
}

export async function listAssetFiles(folderId: string): Promise<AssetFile[]> {
  const snap = await getAdminDb()
    .collection(FILES)
    .where('folderId', '==', folderId)
    .orderBy('createdAt', 'desc')
    .get()
  return snap.docs.map((doc) => mapFile(doc.id, doc.data()))
}

export async function createAssetFile(
  input: Omit<AssetFile, 'id' | 'createdAt' | 'updatedAt'>,
  createdBy: string
): Promise<AssetFile> {
  const db = getAdminDb()
  const now = FieldValue.serverTimestamp()
  const payload = {
    ...input,
    createdBy,
    createdAt: now,
    updatedAt: now,
  }
  const ref = await db.collection(FILES).add(payload)
  await db
    .collection(FOLDERS)
    .doc(input.folderId)
    .update({
      fileCount: FieldValue.increment(1),
      updatedAt: now,
      ...(input.type === 'photo' && input.url ? { coverImageUrl: input.url } : {}),
    })
  const created = await ref.get()
  return mapFile(created.id, created.data()!)
}

export async function updateAssetFile(
  fileId: string,
  patch: Partial<Pick<AssetFile, 'name' | 'description' | 'tags'>>
): Promise<AssetFile | null> {
  const ref = getAdminDb().collection(FILES).doc(fileId)
  const existing = await ref.get()
  if (!existing.exists) return null
  const update: Record<string, unknown> = { updatedAt: FieldValue.serverTimestamp() }
  if (patch.name !== undefined) update.name = patch.name.trim()
  if (patch.description !== undefined) update.description = patch.description.trim()
  if (patch.tags !== undefined) update.tags = patch.tags
  await ref.update(update)
  const updated = await ref.get()
  return mapFile(updated.id, updated.data()!)
}

export async function deleteAssetFile(fileId: string): Promise<boolean> {
  const db = getAdminDb()
  const ref = db.collection(FILES).doc(fileId)
  const doc = await ref.get()
  if (!doc.exists) return false
  const data = doc.data()!
  if (data.storagePath) await deleteFromStorage(data.storagePath)
  await ref.delete()
  await db
    .collection(FOLDERS)
    .doc(data.folderId)
    .update({
      fileCount: FieldValue.increment(-1),
      updatedAt: FieldValue.serverTimestamp(),
    })
  return true
}

export function folderVisibleToAudience(
  folder: AssetFolder,
  audience: 'member' | 'business'
): boolean {
  if (folder.status !== 'published') return false
  if (folder.visibility === 'both') return true
  if (audience === 'member') return folder.visibility === 'members'
  return folder.visibility === 'business'
}
