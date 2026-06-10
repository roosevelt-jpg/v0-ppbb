import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  getDocs,
  serverTimestamp 
} from 'firebase/firestore'
import { db } from './firebase'
import { YouTubeConfig, YouTubeVideo } from './types'

const YOUTUBE_COLLECTION = 'youtubeConfig'

export async function getYouTubeConfig(): Promise<YouTubeConfig | null> {
  try {
    const q = query(collection(db, YOUTUBE_COLLECTION), where('id', '==', 'default'))
    const snapshot = await getDocs(q)
    
    if (snapshot.empty) {
      return null
    }
    
    const data = snapshot.docs[0].data() as YouTubeConfig
    return data
  } catch (error) {
    console.error('[v0] Error fetching YouTube config:', error)
    return null
  }
}

export async function saveYouTubeConfig(config: YouTubeConfig): Promise<boolean> {
  try {
    const docRef = doc(db, YOUTUBE_COLLECTION, 'default')
    await setDoc(docRef, {
      ...config,
      updatedAt: serverTimestamp(),
    }, { merge: true })
    return true
  } catch (error) {
    console.error('[v0] Error saving YouTube config:', error)
    return false
  }
}

export async function fetchLatestYouTubeVideos(
  channelId: string,
  apiKey: string,
  maxResults: number = 4
): Promise<YouTubeVideo[]> {
  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&order=date&maxResults=${maxResults}&type=video&key=${apiKey}`
    )
    
    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.status}`)
    }
    
    const data = await response.json()
    
    if (!data.items || data.items.length === 0) {
      return []
    }
    
    const videos: YouTubeVideo[] = data.items.map((item: any, index: number) => ({
      id: `${index}-${item.id.videoId}`,
      videoId: item.id.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnailUrl: item.snippet.thumbnails.medium.url,
      viewCount: 0,
      publishedAt: new Date(item.snippet.publishedAt),
      duration: '',
      channelTitle: item.snippet.channelTitle,
    }))
    
    // Get video details for view counts and duration
    const videoIds = videos.map(v => v.videoId).join(',')
    const detailsResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=statistics,contentDetails&id=${videoIds}&key=${apiKey}`
    )
    
    if (detailsResponse.ok) {
      const detailsData = await detailsResponse.json()
      
      if (detailsData.items) {
        detailsData.items.forEach((item: any, index: number) => {
          if (videos[index]) {
            videos[index].viewCount = parseInt(item.statistics.viewCount || '0')
            videos[index].duration = item.contentDetails.duration
          }
        })
      }
    }
    
    return videos
  } catch (error) {
    console.error('[v0] Error fetching YouTube videos:', error)
    return []
  }
}

export async function updateYouTubeVideos(config: YouTubeConfig): Promise<YouTubeConfig | null> {
  try {
    const videos = await fetchLatestYouTubeVideos(
      config.channelId,
      config.apiKey,
      config.maxVideosDisplay
    )
    
    const updatedConfig: YouTubeConfig = {
      ...config,
      videos,
      lastFetched: new Date(),
    }
    
    const docRef = doc(db, YOUTUBE_COLLECTION, 'default')
    await updateDoc(docRef, {
      videos,
      lastFetched: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    
    return updatedConfig
  } catch (error) {
    console.error('[v0] Error updating YouTube videos:', error)
    return null
  }
}

export function formatDuration(duration: string): string {
  // Convert PT format to readable time (e.g., PT1H2M3S -> 1:02:03)
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/)
  if (!match) return '0:00'
  
  const hours = parseInt(match[1] || '0')
  const minutes = parseInt(match[2] || '0')
  const seconds = parseInt(match[3] || '0')
  
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }
  
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

export function formatViewCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`
  }
  return count.toString()
}
