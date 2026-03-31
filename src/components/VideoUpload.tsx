import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { FileInput } from './ui'

interface VideoUploadProps {
  onUploadComplete: (storagePath: string) => void
  currentPath?: string | null
}

const VideoUpload = ({ onUploadComplete, currentPath }: VideoUploadProps) => {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setError('')
      const file = event.target.files?.[0]
      if (!file) return

      // Validate file type
      if (!file.type.startsWith('video/')) {
        setError('Please select a video file')
        return
      }

      // Validate file size (e.g., 500MB max)
      const maxSize = 500 * 1024 * 1024 // 500MB
      if (file.size > maxSize) {
        setError('File size must be less than 500MB')
        return
      }

      setUploading(true)
      setProgress(10)

      // Generate unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `course-videos/${fileName}`

      // Step 1: Get upload URL from S3 edge function
      setProgress(20)
      const { data: uploadUrlData, error: urlError } = await supabase.functions.invoke('s3-get-upload-url', {
        body: {
          fileName: fileName,
          contentType: file.type,
          folder: 'course-videos'
        }
      })

      if (urlError || !uploadUrlData?.uploadUrl) {
        throw new Error(urlError?.message || 'Failed to get upload URL from S3 service')
      }

      const { uploadUrl, key } = uploadUrlData

      // Step 2: Upload file directly to S3
      setProgress(40)
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type
        }
      })

      if (!uploadResponse.ok) {
        throw new Error(`Failed to upload to S3: ${uploadResponse.statusText}`)
      }

      setProgress(80)

      // Step 3: Optionally get playback URL or use the key
      // The key is the S3 path that we'll store in the database
      const storagePath = key || filePath
      
      setProgress(100)
      onUploadComplete(storagePath)
    } catch (error: any) {
      console.error('Error uploading video:', error)
      setError(error.message || 'Failed to upload video. Please try again.')
    } finally {
      setUploading(false)
      // Reset input
      const input = event.target as HTMLInputElement
      if (input) input.value = ''
    }
  }

  return (
    <div>
      <FileInput
        name="video"
        accept="video/*"
        label={currentPath ? 'Replace Video' : 'Upload Video'}
        onChange={handleFileUpload}
        disabled={uploading}
        buttonText={uploading ? 'Uploading...' : (currentPath ? 'Replace Video' : 'Upload Video')}
        error={error}
      />

      {uploading && progress > 0 && (
        <div style={{
          width: '100%',
          height: '8px',
          background: 'var(--color-bg-tertiary)',
          borderRadius: 'var(--radius-base)',
          overflow: 'hidden',
          marginTop: 'var(--space-2)'
        }}>
          <div style={{
            width: `${progress}%`,
            height: '100%',
            background: 'var(--color-brand-primary)',
            transition: 'width 0.3s ease'
          }} />
        </div>
      )}

      {currentPath && !uploading && (
        <div style={{
          marginTop: 'var(--space-2)',
          fontSize: 'var(--font-size-xs)',
          color: 'var(--color-text-secondary)'
        }}>
          Current video: {currentPath.split('/').pop()}
        </div>
      )}
    </div>
  )
}

// Export helper function for getting playback URLs
export const getVideoPlaybackUrl = async (storagePath: string): Promise<string | null> => {
  try {
    const { data, error } = await supabase.functions.invoke('s3-get-playback-url', {
      body: {
        key: storagePath
      }
    })

    if (error || !data?.playbackUrl) {
      console.error('Error getting playback URL:', error)
      return null
    }

    return data.playbackUrl
  } catch (error) {
    console.error('Error getting playback URL:', error)
    return null
  }
}

export default VideoUpload

