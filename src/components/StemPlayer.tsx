import { useEffect, useRef, useState } from 'react'
import WaveSurfer from 'wavesurfer.js'
import type { SongStem } from '../types/song'

interface StemPlayerProps {
  stem: SongStem
  audioUrl: string
  isSolo: boolean
  isMuted: boolean
  volume: number
  pan: number
  onSoloToggle: () => void
  onMuteToggle: () => void
  onVolumeChange: (volume: number) => void
  onPanChange: (pan: number) => void
  masterPlaying: boolean
  onPlayStateChange: (playing: boolean) => void
}

const StemPlayer = ({
  stem,
  audioUrl,
  isSolo,
  isMuted,
  volume,
  pan: _pan, // Reserved for future panning functionality
  onSoloToggle,
  onMuteToggle,
  onVolumeChange,
  onPanChange: _onPanChange, // Reserved for future panning functionality
  masterPlaying,
  onPlayStateChange
}: StemPlayerProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const wavesurferRef = useRef<WaveSurfer | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Sync with master play state
  useEffect(() => {
    if (!wavesurferRef.current || !mounted || isLoading) {
      if (isLoading) {
        console.log(`Stem ${stem.instrument} not ready yet (loading: ${isLoading})`)
      }
      return
    }

    // Check if this stem should play based on solo/mute logic
    const shouldPlay = masterPlaying && !isMuted && duration > 0

    console.log(`Stem ${stem.instrument}: masterPlaying=${masterPlaying}, isMuted=${isMuted}, duration=${duration}, shouldPlay=${shouldPlay}, isPlaying=${isPlaying}`)

    if (shouldPlay && !isPlaying) {
      // Ensure audio is ready before playing
      const dur = wavesurferRef.current.getDuration()
      if (dur > 0) {
        try {
          console.log(`Playing stem ${stem.instrument}`)
          wavesurferRef.current.play()
        } catch (err) {
          console.error(`Error playing stem ${stem.instrument}:`, err)
        }
      } else {
        console.warn(`Stem ${stem.instrument} has no duration, cannot play`)
      }
    } else if (!shouldPlay && isPlaying) {
      try {
        console.log(`Pausing stem ${stem.instrument}`)
        wavesurferRef.current.pause()
      } catch (err) {
        console.error(`Error pausing stem ${stem.instrument}:`, err)
      }
    }
  }, [masterPlaying, isMuted, isPlaying, mounted, isLoading, duration, stem.instrument])

  // Update volume when it changes
  useEffect(() => {
    if (wavesurferRef.current) {
      const effectiveVolume = isMuted ? 0 : volume
      wavesurferRef.current.setVolume(effectiveVolume)
    }
  }, [volume, isMuted])

  useEffect(() => {
    if (!mounted || !containerRef.current) return

    let retryTimeout: NodeJS.Timeout | null = null
    let initAttempts = 0
    const maxAttempts = 30

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
        const wavesurfer = WaveSurfer.create({
          container: container,
          waveColor: '#3b82f6',
          progressColor: '#2563eb',
          cursorColor: '#1f2937',
          barWidth: 2,
          barGap: 1,
          height: 100,
          normalize: true,
          backend: 'WebAudio',
          mediaControls: false,
          interact: true,
          dragToSeek: true
        })

        wavesurferRef.current = wavesurfer
        wavesurfer.setVolume(isMuted ? 0 : volume)

        wavesurfer.on('play', () => {
          setIsPlaying(true)
          onPlayStateChange(true)
        })
        
        wavesurfer.on('pause', () => {
          setIsPlaying(false)
          onPlayStateChange(false)
        })
        
        wavesurfer.on('ready', () => {
          const dur = wavesurfer.getDuration()
          setIsLoading(false)
          setDuration(dur)
          console.log(`Stem ${stem.instrument} ready, duration: ${dur}s`)
          
          // Preload audio for better performance
          if (wavesurfer.getMediaElement()) {
            wavesurfer.getMediaElement().load()
          }
        })
        
        wavesurfer.on('decode', () => {
          console.log(`Stem ${stem.instrument} decoded`)
        })
        
        wavesurfer.on('timeupdate', (time: number) => {
          setCurrentTime(time)
        })
        
        wavesurfer.on('error', (err: Error) => {
          console.error('WaveSurfer error:', err)
          setError(err.message || 'Failed to load audio')
          setIsLoading(false)
        })

        // Load audio - wavesurfer.js handles caching automatically via browser cache
        console.log(`Loading audio for ${stem.instrument} from:`, audioUrl.substring(0, 50) + '...')
        wavesurfer.load(audioUrl).catch((err: Error) => {
          console.error(`Error loading URL for ${stem.instrument}:`, err)
          setError(err.message || 'Failed to load audio URL')
          setIsLoading(false)
        })
      } catch (err: any) {
        console.error('Error creating WaveSurfer:', err)
        setError(err.message || 'Failed to initialize waveform')
        setIsLoading(false)
      }
    }

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
    }
  }, [mounted, audioUrl, isMuted, volume, onPlayStateChange])

  const formatTime = (seconds: number): string => {
    if (isNaN(seconds) || seconds < 0) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (!mounted) {
    return <div style={{ width: '100%', height: '100px', background: '#f0f0f0' }}>Loading...</div>
  }

  return (
    <div style={{ width: '100%' }}>
      <div 
        ref={containerRef} 
        style={{ 
          width: '100%',
          minHeight: '100px',
          height: '100px',
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
            zIndex: 10
          }}>
            Loading waveform...
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
      </div>
      
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginTop: '8px',
        flexWrap: 'wrap'
      }}>
        {/* Solo/Mute buttons */}
        <button
          onClick={onSoloToggle}
          style={{
            padding: '4px 8px',
            background: isSolo ? '#fbbf24' : '#e5e7eb',
            color: isSolo ? '#1f2937' : '#6b7280',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: '600',
            minWidth: '32px'
          }}
          title={isSolo ? 'Unsolo' : 'Solo'}
        >
          S
        </button>
        
        <button
          onClick={onMuteToggle}
          style={{
            padding: '4px 8px',
            background: isMuted ? '#ef4444' : '#e5e7eb',
            color: isMuted ? 'white' : '#6b7280',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: '600',
            minWidth: '32px'
          }}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          M
        </button>

        {/* Volume control */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1, minWidth: '100px' }}>
          <span style={{ fontSize: '12px', color: '#6b7280', minWidth: '30px' }}>Vol:</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
            style={{ flex: 1, cursor: 'pointer' }}
          />
          <span style={{ fontSize: '12px', color: '#6b7280', minWidth: '35px' }}>
            {Math.round(volume * 100)}%
          </span>
        </div>

        {/* Time display */}
        <div style={{
          fontSize: '12px',
          color: '#6b7280',
          minWidth: '80px',
          textAlign: 'right'
        }}>
          {duration > 0 ? `${formatTime(currentTime)} / ${formatTime(duration)}` : '--:-- / --:--'}
        </div>
      </div>
    </div>
  )
}

export default StemPlayer

