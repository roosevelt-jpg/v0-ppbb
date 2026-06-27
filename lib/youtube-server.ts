import { getAdminDb } from '@/lib/firebase-admin'
import type { YouTubeConfig, YouTubeVideo } from '@/lib/types'

const YOUTUBE_COLLECTION = 'youtubeConfig'
const DOC_ID = 'default'

/**
 * Normalizes whatever the admin pasted into the "Channel ID" field into a bare
 * YouTube channel ID (UCxxxxxxxxxxxxxxxxxxxxxx). Accepts:
 *   - a raw channel ID (UC...)
 *   - a full channel URL (https://youtube.com/channel/UC...)
 *   - an @handle or handle URL (resolved via the API)
 *   - a /user/<name> or /c/<name> custom URL (resolved via the API)
 */
export async function resolveChannelId(input: string, apiKey: string): Promise<string | null> {
  const raw = (input || '').trim()
  if (!raw) return null

  // 1. Already contains a channel ID anywhere (e.g. /channel/UC...).
  const idMatch = raw.match(/UC[A-Za-z0-9_-]{22}/)
  if (idMatch) return idMatch[0]

  // 2. Handle (e.g. "@PassiveBlessings" or ".../@PassiveBlessings").
  const handleMatch = raw.match(/@([A-Za-z0-9._-]+)/)
  if (handleMatch) {
    const id = await lookupChannel(`forHandle=@${handleMatch[1]}`, apiKey)
    if (id) return id
  }

  // 3. Legacy /user/<name> URL.
  const userMatch = raw.match(/\/user\/([A-Za-z0-9._-]+)/)
  if (userMatch) {
    const id = await lookupChannel(`forUsername=${encodeURIComponent(userMatch[1])}`, apiKey)
    if (id) return id
  }

  // 4. Custom /c/<name> URL or a plain search term — search for the channel.
  const customMatch = raw.match(/\/c\/([A-Za-z0-9._-]+)/)
  const term = customMatch ? customMatch[1] : raw
  const searchUrl =
    `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel` +
    `&q=${encodeURIComponent(term)}&maxResults=1&key=${apiKey}`
  const res = await fetch(searchUrl)
  if (res.ok) {
    const data = await res.json()
    const found = data.items?.[0]?.id?.channelId || data.items?.[0]?.snippet?.channelId
    if (found) return found
  }
  return null
}

async function lookupChannel(queryParam: string, apiKey: string): Promise<string | null> {
  const url = `https://www.googleapis.com/youtube/v3/channels?part=id&${queryParam}&key=${apiKey}`
  const res = await fetch(url)
  if (!res.ok) return null
  const data = await res.json()
  return data.items?.[0]?.id || null
}

/**
 * Fetches the latest videos for a (already resolved) channel ID. Returns the
 * videos plus a human-readable error string when the YouTube API rejects the
 * request, so the caller can surface the real reason.
 */
export async function fetchLatestYouTubeVideos(
  channelId: string,
  apiKey: string,
  maxResults = 4
): Promise<{ videos: YouTubeVideo[]; error?: string }> {
  const searchUrl =
    `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${encodeURIComponent(channelId)}` +
    `&order=date&maxResults=${maxResults}&type=video&key=${apiKey}`
  const response = await fetch(searchUrl)
  const data = await response.json()

  if (!response.ok) {
    const reason = data?.error?.message || `YouTube API error: ${response.status}`
    return { videos: [], error: reason }
  }
  if (!data.items || data.items.length === 0) {
    return { videos: [] }
  }

  const videos: YouTubeVideo[] = data.items
    .filter((item: any) => item.id?.videoId)
    .map((item: any, index: number) => ({
      id: `${index}-${item.id.videoId}`,
      videoId: item.id.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnailUrl:
        item.snippet.thumbnails?.high?.url ||
        item.snippet.thumbnails?.medium?.url ||
        item.snippet.thumbnails?.default?.url ||
        '',
      viewCount: 0,
      publishedAt: new Date(item.snippet.publishedAt),
      duration: '',
      channelTitle: item.snippet.channelTitle,
    }))

  // Enrich with statistics + duration.
  const videoIds = videos.map((v) => v.videoId).join(',')
  if (videoIds) {
    const detailsRes = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=statistics,contentDetails&id=${videoIds}&key=${apiKey}`
    )
    if (detailsRes.ok) {
      const detailsData = await detailsRes.json()
      detailsData.items?.forEach((item: any, index: number) => {
        if (videos[index]) {
          videos[index].viewCount = parseInt(item.statistics?.viewCount || '0')
          videos[index].duration = item.contentDetails?.duration || ''
        }
      })
    }
  }

  return { videos }
}

/** Reads the YouTube config via the Admin SDK (bypasses client rules). */
export async function getYouTubeConfigServer(): Promise<YouTubeConfig | null> {
  const snap = await getAdminDb().collection(YOUTUBE_COLLECTION).doc(DOC_ID).get()
  if (!snap.exists) return null
  return serializeConfig(snap.data() as YouTubeConfig)
}

/**
 * Saves config + fetches the latest videos in one server-side operation.
 * Returns the stored config or an error message.
 */
export async function saveAndRefreshYouTube(
  partial: Partial<YouTubeConfig>
): Promise<{ config?: YouTubeConfig; error?: string }> {
  const apiKey = (partial.apiKey || '').trim()
  if (!apiKey) return { error: 'API key is required.' }
  if (!partial.channelId) return { error: 'Channel ID is required.' }

  const channelId = await resolveChannelId(partial.channelId, apiKey)
  if (!channelId) {
    return { error: 'Could not resolve that Channel ID. Paste the channel URL (youtube.com/channel/UC…), @handle, or ID.' }
  }

  const maxResults = partial.maxVideosDisplay || 4
  const { videos, error } = await fetchLatestYouTubeVideos(channelId, apiKey, maxResults)
  if (error) {
    return { error: `Failed to fetch videos: ${error}` }
  }

  const db = getAdminDb()
  const ref = db.collection(YOUTUBE_COLLECTION).doc(DOC_ID)
  const existing = await ref.get()
  const now = new Date()

  const config: any = {
    id: DOC_ID,
    channelId, // store the normalized ID
    apiKey,
    maxVideosDisplay: maxResults,
    refreshInterval: partial.refreshInterval ?? 24,
    autoRefresh: partial.autoRefresh ?? true,
    isEnabled: partial.isEnabled ?? true,
    videos: videos.map((v) => ({ ...v, publishedAt: v.publishedAt.toISOString() })),
    lastFetched: now.toISOString(),
    updatedAt: now.toISOString(),
    createdAt: existing.exists ? existing.data()?.createdAt || now.toISOString() : now.toISOString(),
  }

  await ref.set(config, { merge: true })
  return { config: serializeConfig(config) }
}

/** Converts any Firestore Timestamps/strings into plain serializable values. */
function serializeConfig(data: any): YouTubeConfig {
  const toIso = (v: any) =>
    v?.toDate ? v.toDate().toISOString() : v instanceof Date ? v.toISOString() : v
  return {
    ...data,
    lastFetched: toIso(data.lastFetched),
    createdAt: toIso(data.createdAt),
    updatedAt: toIso(data.updatedAt),
    videos: (data.videos || []).map((v: any) => ({ ...v, publishedAt: toIso(v.publishedAt) })),
  } as YouTubeConfig
}
