import { useEffect, useRef, useState } from 'react'
import WaveSurfer from 'wavesurfer.js'

interface WaveformPlayerProps {
  audioUrl?: string
  audioFile?: File
  height?: number
  waveColor?: string
  progressColor?: string
  cursorColor?: string
  barWidth?: number
  barGap?: number
}

const WaveformPlayer = ({
  audioUrl,
  audioFile,
  height = 100,
  waveColor = '#3b82f6',
  progressColor = '#2563eb',
  cursorColor = '#1f2937',
  barWidth = 2,
  barGap = 1
}: WaveformPlayerProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const wavesurferRef = useRef<WaveSurfer | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  // Ensure component is mounted and container is ready
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted || !containerRef.current) return

    let objectUrl: string | null = null
    let retryTimeout: NodeJS.Timeout | null = null
    let initAttempts = 0
    const maxAttempts = 30 // Try for 3 seconds

    const initializeWaveform = () => {
      if (!containerRef.current) {
        if (initAttempts < maxAttempts) {
          initAttempts++
          retryTimeout = setTimeout(initializeWaveform, 100)
        } else {
          setError('Container not found')
          setIsLoading(false)
        }
        return
      }

      const container = containerRef.current
      
      // Check if container is visible and has dimensions
      const rect = container.getBoundingClientRect()
      const isVisible = rect.width > 0 && rect.height > 0 && rect.top < window.innerHeight && rect.bottom > 0
      
      if (!isVisible) {
        if (initAttempts < maxAttempts) {
          initAttempts++
          retryTimeout = setTimeout(initializeWaveform, 100)
        } else {
          setError('Container not visible')
          setIsLoading(false)
        }
        return
      }

      // Destroy existing instance
      if (wavesurferRef.current) {
        try {
          wavesurferRef.current.destroy()
        } catch (e) {
          console.warn('Error destroying wavesurfer:', e)
        }
        wavesurferRef.current = null
      }

      setIsLoading(true)
      setError(null)

      try {
        console.log('Initializing WaveSurfer with container dimensions:', rect.width, 'x', rect.height)

        // Create WaveSurfer instance
        const wavesurfer = WaveSurfer.create({
          container: container,
          waveColor: waveColor,
          progressColor: progressColor,
          cursorColor: cursorColor,
          barWidth: barWidth,
          barGap: barGap,
          height: height,
          normalize: true,
          backend: 'WebAudio',
          mediaControls: false,
          interact: true,
          dragToSeek: true
        })

        wavesurferRef.current = wavesurfer

        // Event listeners
        wavesurfer.on('play', () => {
          setIsPlaying(true)
        })
        
        wavesurfer.on('pause', () => {
          setIsPlaying(false)
        })
        
        wavesurfer.on('ready', () => {
          console.log('Waveform ready, duration:', wavesurfer.getDuration())
          setIsLoading(false)
          setDuration(wavesurfer.getDuration())
        })
        
        wavesurfer.on('timeupdate', (time: number) => {
          setCurrentTime(time)
        })
        
        wavesurfer.on('loading', () => {
          setIsLoading(true)
        })
        
        wavesurfer.on('error', (err: Error) => {
          console.error('WaveSurfer error:', err)
          setError(err.message || 'Failed to load audio')
          setIsLoading(false)
        })

        // Load audio
        if (audioFile) {
          objectUrl = URL.createObjectURL(audioFile)
          console.log('Loading audio file:', audioFile.name)
          wavesurfer.load(objectUrl).catch((err: Error) => {
            console.error('Error loading file:', err)
            setError(err.message || 'Failed to load audio file')
            setIsLoading(false)
          })
        } else if (audioUrl) {
          console.log('Loading audio URL')
          wavesurfer.load(audioUrl).catch((err: Error) => {
            console.error('Error loading URL:', err)
            setError(err.message || 'Failed to load audio URL')
            setIsLoading(false)
          })
        } else {
          setIsLoading(false)
        }
      } catch (err: any) {
        console.error('Error creating WaveSurfer:', err)
        setError(err.message || 'Failed to initialize waveform')
        setIsLoading(false)
      }
    }

    // Start initialization after a short delay to ensure DOM is ready
    const initTimer = setTimeout(() => {
      initializeWaveform()
    }, 200)

    return () => {
      clearTimeout(initTimer)
      if (retryTimeout) {
        clearTimeout(retryTimeout)
      }
      if (wavesurferRef.current) {
        try {
          wavesurferRef.current.destroy()
        } catch (e) {
          console.warn('Error destroying wavesurfer on cleanup:', e)
        }
        wavesurferRef.current = null
      }
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl)
      }
    }
  }, [mounted, audioUrl, audioFile, height, waveColor, progressColor, cursorColor, barWidth, barGap])

  const togglePlayback = () => {
    if (wavesurferRef.current && duration > 0) {
      try {
        wavesurferRef.current.playPause()
      } catch (err) {
        console.error('Error toggling playback:', err)
        setError('Failed to play audio')
      }
    }
  }

  const formatTime = (seconds: number): string => {
    if (isNaN(seconds) || seconds < 0) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (!mounted) {
    return <div style={{ width: '100%', height: `${height}px`, background: '#f0f0f0' }}>Loading...</div>
  }

  return (
    <div style={{ width: '100%' }}>
      <div 
        ref={containerRef} 
        style={{ 
          width: '100%',
          minHeight: `${height}px`,
          height: `${height}px`,
          background: '#ffffff',
          borderRadius: '4px',
          border: '1px solid #e5e7eb',
          position: 'relative',
          cursor: 'pointer'
        }} 
      >
        {isLoading && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: '#6b7280',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            zIndex: 10
          }}>
            <span>Loading waveform...</span>
          </div>
        )}
        {error && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: '#ef4444',
            fontSize: '14px',
            textAlign: 'center',
            zIndex: 10,
            padding: '8px'
          }}>
            {error}
          </div>
        )}
        {!isLoading && !error && !audioUrl && !audioFile && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: '#6b7280',
            fontSize: '14px',
            textAlign: 'center'
          }}>
            No audio provided
          </div>
        )}
      </div>
      
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginTop: '8px'
      }}>
        <button
          onClick={togglePlayback}
          disabled={isLoading || (!audioUrl && !audioFile) || duration === 0 || !!error}
          style={{
            padding: '8px 16px',
            background: duration > 0 && !error ? '#3b82f6' : '#9ca3af',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: isLoading || (!audioUrl && !audioFile) || duration === 0 || !!error ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontWeight: '500'
          }}
        >
          {isLoading ? (
            <>⏳ Loading...</>
          ) : error ? (
            <>⚠️ Error</>
          ) : isPlaying ? (
            <>⏸️ Pause</>
          ) : (
            <>▶️ Play</>
          )}
        </button>
        
        <div style={{
          flex: 1,
          fontSize: '14px',
          color: '#6b7280'
        }}>
          {duration > 0 ? `${formatTime(currentTime)} / ${formatTime(duration)}` : '--:-- / --:--'}
        </div>
      </div>
    </div>
  )
}

export default WaveformPlayer
