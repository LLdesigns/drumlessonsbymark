import { createContext, useContext, useRef, useState, useEffect } from 'react'
import type { ReactNode } from 'react'

interface MasterAudioClockContextType {
  currentTime: number
  isPlaying: boolean
  duration: number
  play: () => void
  pause: () => void
  seek: (time: number) => void
  registerPlayer: (id: string, player: AudioPlayerRef) => void
  unregisterPlayer: (id: string) => void
}

interface AudioPlayerRef {
  seek: (time: number) => void
  play: () => void
  pause: () => void
  getDuration: () => number
  getCurrentTime: () => number
}

const MasterAudioClockContext = createContext<MasterAudioClockContextType | null>(null)

export const useMasterClock = () => {
  const context = useContext(MasterAudioClockContext)
  if (!context) {
    throw new Error('useMasterClock must be used within MasterAudioClockProvider')
  }
  return context
}

interface MasterAudioClockProviderProps {
  children: ReactNode
}

export const MasterAudioClockProvider = ({ children }: MasterAudioClockProviderProps) => {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const playersRef = useRef<Map<string, AudioPlayerRef>>(new Map())
  const animationFrameRef = useRef<number | null>(null)
  const lastUpdateTimeRef = useRef<number>(Date.now())

  // Update duration when any player's duration changes
  useEffect(() => {
    const updateDuration = () => {
      let maxDuration = 0
      playersRef.current.forEach((player) => {
        const playerDuration = player.getDuration()
        if (playerDuration > maxDuration) {
          maxDuration = playerDuration
        }
      })
      setDuration(maxDuration)
    }

    // Update duration periodically
    const interval = setInterval(updateDuration, 100)
    return () => clearInterval(interval)
  }, [])

  // Master clock loop
  useEffect(() => {
    if (isPlaying) {
      const updateTime = () => {
        const now = Date.now()
        const delta = (now - lastUpdateTimeRef.current) / 1000 // Convert to seconds
        lastUpdateTimeRef.current = now

        setCurrentTime((prevTime) => {
          const newTime = prevTime + delta
          // Don't exceed duration
          const clampedTime = duration > 0 ? Math.min(newTime, duration) : newTime
          
          // If we've reached the end, pause
          if (duration > 0 && newTime >= duration) {
            setIsPlaying(false)
            return duration
          }
          
          return clampedTime
        })

        animationFrameRef.current = requestAnimationFrame(updateTime)
      }

      lastUpdateTimeRef.current = Date.now()
      animationFrameRef.current = requestAnimationFrame(updateTime)
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [isPlaying, duration])

  // Sync all players to current time periodically (but less frequently to avoid performance issues)
  useEffect(() => {
    if (!isPlaying) return

    const syncInterval = setInterval(() => {
      playersRef.current.forEach((player) => {
        const playerTime = player.getCurrentTime()
        const timeDiff = Math.abs(playerTime - currentTime)
        
        // Sync if difference is more than 0.2 seconds
        if (timeDiff > 0.2) {
          player.seek(currentTime)
        }
      })
    }, 500) // Check every 500ms

    return () => clearInterval(syncInterval)
  }, [currentTime, isPlaying])

  const play = () => {
    setIsPlaying(true)
    playersRef.current.forEach((player) => {
      try {
        player.play()
      } catch (err) {
        console.error('Error playing player:', err)
      }
    })
  }

  const pause = () => {
    console.log('Master clock pause called, stopping all players...')
    setIsPlaying(false)
    // Force pause all players immediately
    playersRef.current.forEach((player, id) => {
      try {
        player.pause()
        console.log(`Paused player ${id}`)
      } catch (err) {
        console.error(`Error pausing player ${id}:`, err)
      }
    })
    // Also stop the animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
  }

  const seek = (time: number) => {
    const clampedTime = Math.max(0, Math.min(time, duration || Infinity))
    setCurrentTime(clampedTime)
    lastUpdateTimeRef.current = Date.now()
    
    // Pause during seek for smoother experience
    const wasPlaying = isPlaying
    if (wasPlaying) {
      setIsPlaying(false)
    }
    
    // Seek all players synchronously
    playersRef.current.forEach((player) => {
      try {
        player.seek(clampedTime)
      } catch (err) {
        console.error('Error seeking player:', err)
      }
    })
    
    // Resume if it was playing (after a brief delay to ensure seek completes)
    if (wasPlaying) {
      setTimeout(() => {
        setIsPlaying(true)
      }, 50)
    }
  }

  const registerPlayer = (id: string, player: AudioPlayerRef) => {
    playersRef.current.set(id, player)
    // Update duration when new player registers
    const playerDuration = player.getDuration()
    if (playerDuration > duration) {
      setDuration(playerDuration)
    }
  }

  const unregisterPlayer = (id: string) => {
    playersRef.current.delete(id)
  }

  const value: MasterAudioClockContextType = {
    currentTime,
    isPlaying,
    duration,
    play,
    pause,
    seek,
    registerPlayer,
    unregisterPlayer
  }

  return (
    <MasterAudioClockContext.Provider value={value}>
      {children}
    </MasterAudioClockContext.Provider>
  )
}

