'use client'

import { useParams } from 'next/navigation'
import { AssetFolderDetail } from '@/components/assets/asset-library-browser'

export default function BusinessAssetFolderPage() {
  const params = useParams()
  return (
    <AssetFolderDetail folderId={params.folderId as string} basePath="/business/assets" />
  )
}
