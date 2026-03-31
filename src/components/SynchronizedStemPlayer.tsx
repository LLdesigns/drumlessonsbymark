import { useEffect, useRef, useState } from 'react'
import WaveSurfer from 'wavesurfer.js'
import { useMasterClock } from './MasterAudioClock'
import type { SongStem } from '../types/song'

// Global cache for WaveSurfer instances to persist across component mounts/unmounts
const waveformCache = new Map<string, {
  wavesurfer: WaveSurfer
  container: HTMLElement
  url: string
}>()

interface SynchronizedStemPlayerProps {
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
}

const SynchronizedStemPlayer = ({
  stem,
  audioUrl,
  isSolo,
  isMuted,
  volume,
  pan: _pan, // Reserved for future panning functionality
  onSoloToggle,
  onMuteToggle,
  onVolumeChange,
  onPanChange: _onPanChange // Reserved for future panning functionality
}: SynchronizedStemPlayerProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const wavesurferRef = useRef<WaveSurfer | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [localDuration, setLocalDuration] = useState(0)
  const masterClock = useMasterClock()
  const isRegisteredRef = useRef(false)
  const initializedUrlRef = useRef<string | null>(null) // Track which URL we've initialized for
  const cacheKey = `${stem.id}-${audioUrl}` // Unique key for this stem+URL combination

  useEffect(() => {
    setMounted(true)
  }, [])

  // Register with master clock when ready
  useEffect(() => {
    if (!wavesurferRef.current || !mounted || isLoading) return

    if (!isRegisteredRef.current) {
      const playerRef = {
        seek: (time: number) => {
          if (wavesurferRef.current && localDuration > 0) {
            try {
              const seekPosition = Math.max(0, Math.min(time / localDuration, 1))
              wavesurferRef.current.seekTo(seekPosition)
            } catch (err) {
              console.error(`Error seeking ${stem.instrument}:`, err)
            }
          }
        },
        play: () => {
          if (wavesurferRef.current && !isMuted) {
            try {
              wavesurferRef.current.play()
            } catch (err) {
              console.error(`Error playing ${stem.instrument}:`, err)
            }
          }
        },
        pause: () => {
          if (wavesurferRef.current) {
            try {
              wavesurferRef.current.pause()
            } catch (err) {
              console.error(`Error pausing ${stem.instrument}:`, err)
            }
          }
        },
        getDuration: () => localDuration,
        getCurrentTime: () => {
          if (wavesurferRef.current && localDuration > 0) {
            try {
              const progress = wavesurferRef.current.getCurrentTime()
              return progress * localDuration
            } catch (err) {
              return 0
            }
          }
          return 0
        }
      }

      masterClock.registerPlayer(stem.id, playerRef)
      isRegisteredRef.current = true
      console.log(`Registered ${stem.instrument} with master clock`)

      return () => {
        masterClock.unregisterPlayer(stem.id)
        isRegisteredRef.current = false
      }
    }
  }, [mounted, isLoading, localDuration, stem.id, stem.instrument, audioUrl]) // Added audioUrl to deps

  // Redraw waveform when container becomes visible again (after tab switch)
  useEffect(() => {
    if (!wavesurferRef.current || !containerRef.current) return
    
    // Use IntersectionObserver to detect when container becomes visible
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && wavesurferRef.current) {
          // Container is visible, ensure waveform is properly rendered
          try {
            // Force a redraw by seeking to current position
            const currentTime = wavesurferRef.current.getCurrentTime()
            const duration = wavesurferRef.current.getDuration()
            if (duration > 0 && currentTime >= 0) {
              const progress = currentTime / duration
              if (!isNaN(progress) && progress >= 0 && progress <= 1) {
                // Small seek to trigger redraw without changing position
                wavesurferRef.current.seekTo(progress)
              }
            }
          } catch (err) {
            // Ignore errors, waveform might not be ready
            console.warn(`Error redrawing waveform for ${stem.instrument}:`, err)
          }
        }
      })
    }, {
      threshold: 0.1 // Trigger when at least 10% visible
    })
    
    if (containerRef.current) {
      observer.observe(containerRef.current)
    }
    
    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current)
      }
    }
  }, [mounted, stem.instrument]) // Re-run when component mounts or remounts

  // Sync with master clock play state
  useEffect(() => {
    if (!wavesurferRef.current || !mounted || isLoading || !isRegisteredRef.current) {
      return
    }

    // Always pause first to ensure clean state
    if (!masterClock.isPlaying) {
      try {
        wavesurferRef.current.pause()
        console.log(`Paused ${stem.instrument} (master clock paused)`)
      } catch (err) {
        console.error(`Error pausing ${stem.instrument}:`, err)
      }
      return
    }

    // Only play if master is playing and stem is not muted
    if (masterClock.isPlaying && !isMuted) {
      try {
        const currentTime = wavesurferRef.current.getCurrentTime()
        const duration = wavesurferRef.current.getDuration()
        
        // Only play if we have valid audio and we're not at the end
        if (duration > 0 && currentTime < duration) {
          wavesurferRef.current.play()
          console.log(`Playing ${stem.instrument} (master clock playing)`)
        }
      } catch (err) {
        console.error(`Error playing ${stem.instrument}:`, err)
      }
    } else if (isMuted) {
      // Explicitly pause if muted
      try {
        wavesurferRef.current.pause()
      } catch (err) {
        console.error(`Error pausing muted ${stem.instrument}:`, err)
      }
    }
  }, [masterClock.isPlaying, isMuted, mounted, isLoading, isRegisteredRef.current, stem.instrument])

  // Update volume when it changes
  useEffect(() => {
    if (wavesurferRef.current) {
      const effectiveVolume = isMuted ? 0 : volume
      wavesurferRef.current.setVolume(effectiveVolume)
    }
  }, [volume, isMuted])

  // Initialize waveform - use cached instance if available
  useEffect(() => {
    // Wait for URL to be available and valid
    if (!mounted || !containerRef.current || !audioUrl || audioUrl.trim() === '') {
      if (audioUrl === '') {
        console.log(`Waiting for URL for ${stem.instrument}...`)
      }
      return
    }
    
    // CRITICAL: Check if we already have this instance loaded - don't reload!
    if (initializedUrlRef.current === audioUrl && wavesurferRef.current) {
      console.log(`Waveform for ${stem.instrument} already loaded - skipping re-initialization`)
      // Ensure it's still in cache
      if (!waveformCache.has(cacheKey) && containerRef.current) {
        waveformCache.set(cacheKey, {
          wavesurfer: wavesurferRef.current,
          container: containerRef.current,
          url: audioUrl
        })
      }
      return
    }
    
    // Check if we have a cached instance for this stem+URL
    const cached = waveformCache.get(cacheKey)
    if (cached && cached.wavesurfer) {
      console.log(`Found cached waveform for ${stem.instrument}`)
      try {
        // WaveSurfer instances are tied to their container
        // If it's the same container, we can reuse the instance
        if (cached.container === containerRef.current) {
          console.log(`Reusing cached waveform instance for ${stem.instrument} - instant load!`)
          wavesurferRef.current = cached.wavesurfer
          initializedUrlRef.current = audioUrl
          const dur = cached.wavesurfer.getDuration()
          if (dur > 0) {
            setLocalDuration(dur)
            setIsLoading(false)
            // Waveform is already loaded and ready - no need to reload!
            return
          }
        } else {
          // Container changed - this shouldn't happen with our tab switching approach
          // But if it does, we need to create a new instance
          console.warn(`Container changed for ${stem.instrument} - this shouldn't happen with tab switching`)
          // Clear the old cache entry since container changed
          waveformCache.delete(cacheKey)
        }
      } catch (e) {
        console.warn('Error checking cached waveform:', e)
        // Clear invalid cache entry
        waveformCache.delete(cacheKey)
        // Continue to create new instance
      }
    }

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
      // Check if container is in DOM and has dimensions
      // Allow initialization even if parent is hidden (for tab switching)
      const rect = container.getBoundingClientRect()
      const hasDimensions = rect.width > 0 && rect.height > 0
      
      // Initialize if container has dimensions, even if off-screen (for tab switching)
      if (!hasDimensions && initAttempts < maxAttempts) {
        // Container might be hidden by parent, but still try to initialize
        // WaveSurfer can render to hidden containers
        initAttempts++
        retryTimeout = setTimeout(initializeWaveform, 100)
        return
      }
      
      // If container has no dimensions after max attempts, it's likely not ready
      if (!hasDimensions && initAttempts >= maxAttempts) {
        console.warn(`Container for ${stem.instrument} has no dimensions after ${maxAttempts} attempts`)
        setIsLoading(false)
        return
      }

      if (wavesurferRef.current && wavesurferRef.current !== cached?.wavesurfer) {
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

        wavesurfer.on('ready', () => {
          const dur = wavesurfer.getDuration()
          setLocalDuration(dur)
          setIsLoading(false)
          initializedUrlRef.current = audioUrl
          
          // Cache the instance for future use
          waveformCache.set(cacheKey, {
            wavesurfer,
            container,
            url: audioUrl
          })
          
          console.log(`Stem ${stem.instrument} ready and cached, duration: ${dur}s`)
          
          // Explicitly ensure no auto-play
          try {
            wavesurfer.pause()
          } catch (e) {
            // Ignore if already paused
          }
        })
        
        wavesurfer.on('decode', () => {
          console.log(`Stem ${stem.instrument} decoded`)
        })
        
        wavesurfer.on('error', (err: Error) => {
          console.error('WaveSurfer error:', err)
          // Don't show error for AbortError (component unmounting or URL change)
          if (err.name !== 'AbortError' && !err.message.includes('aborted') && !err.message.includes('AbortError')) {
            setError(err.message || 'Failed to load audio')
            setIsLoading(false)
          }
        })

        // Load audio immediately - DO NOT auto-play, just preload
        // Validate URL before loading
        if (!audioUrl || audioUrl.trim() === '' || !audioUrl.startsWith('http')) {
          setError('Invalid audio URL')
          setIsLoading(false)
          return
        }
        
        console.log(`Preloading audio for ${stem.instrument} from: ${audioUrl.substring(0, 50)}...`)
        wavesurfer.load(audioUrl).catch((err: Error) => {
          console.error(`Error loading URL for ${stem.instrument}:`, err)
          // Don't show error for AbortError (component unmounting or URL change)
          if (err.name !== 'AbortError' && !err.message.includes('aborted') && !err.message.includes('AbortError')) {
            setError(err.message || 'Failed to load audio URL')
            setIsLoading(false)
          }
        })
      } catch (err: any) {
        console.error('Error creating WaveSurfer:', err)
        setError(err.message || 'Failed to initialize waveform')
        setIsLoading(false)
      }
    }

    // Start initialization immediately when URL is available
    // Small delay to ensure container is rendered
    const initTimer = setTimeout(() => {
      initializeWaveform()
    }, 100)

    return () => {
      clearTimeout(initTimer)
      if (retryTimeout) {
        clearTimeout(retryTimeout)
      }
      // IMPORTANT: Don't destroy the wavesurfer instance or clear refs
      // Keep everything in memory so waveforms persist across tab switches
      // The instance is cached and will be reused when switching back
      // Only clear refs if URL actually changed (handled above)
      if (initializedUrlRef.current !== audioUrl) {
        wavesurferRef.current = null
        initializedUrlRef.current = null
      }
    }
  }, [mounted, audioUrl, cacheKey]) // Added cacheKey to deps

  const formatTime = (seconds: number): string => {
    if (isNaN(seconds) || seconds < 0) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value)
    masterClock.seek(time)
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
      
      {/* Time slider - synchronized across all stems */}
      <div style={{ marginTop: '8px' }}>
        <input
          type="range"
          min="0"
          max={masterClock.duration || 0}
          step="0.1"
          value={masterClock.currentTime}
          onChange={handleSeek}
          style={{
            width: '100%',
            cursor: 'pointer',
            height: '8px',
            borderRadius: '4px',
            background: masterClock.duration > 0 
              ? `linear-gradient(to right, #2563eb 0%, #2563eb ${(masterClock.currentTime / masterClock.duration) * 100}%, #e5e7eb ${(masterClock.currentTime / masterClock.duration) * 100}%, #e5e7eb 100%)`
              : '#e5e7eb',
            outline: 'none',
            WebkitAppearance: 'none',
            appearance: 'none'
          }}
        />
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '12px',
          color: '#6b7280',
          marginTop: '4px'
        }}>
          <span>{formatTime(masterClock.currentTime)}</span>
          <span>{formatTime(masterClock.duration)}</span>
        </div>
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
      </div>
    </div>
  )
}

export default SynchronizedStemPlayer

