'use client'

import { useParams } from 'next/navigation'
import { AssetFolderDetail } from '@/components/assets/asset-library-browser'

export default function MemberAssetFolderPage() {
  const params = useParams()
  return (
    <AssetFolderDetail folderId={params.folderId as string} basePath="/dashboard/assets" />
  )
}
