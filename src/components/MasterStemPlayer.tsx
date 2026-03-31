import { useState, useEffect } from 'react'
import SynchronizedStemPlayer from './SynchronizedStemPlayer'
import type { SongStem } from '../types/song'
import { updateStemMetadata, updateStemOrder } from '../lib/song-service'

interface MasterStemPlayerProps {
  stems: SongStem[]
  stemUrls: Record<string, string>
  songId: string
  onStemUpdate?: () => void
  onStemReorder?: (reorderedStems: SongStem[]) => void
}

const MasterStemPlayerContent = ({ stems, stemUrls, songId, onStemUpdate, onStemReorder }: MasterStemPlayerProps) => {
  // masterClock is used by child SynchronizedStemPlayer components
  const [stemStates, setStemStates] = useState<Record<string, {
    isSolo: boolean
    isMuted: boolean
    volume: number
    pan: number
  }>>({})
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  
  // Sort stems by order_index and validate
  const sortedStems = [...stems]
    .filter(stem => stem && stem.id && stem.instrument) // Filter out invalid stems
    .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))

  // Initialize stem states from database
  useEffect(() => {
    const states: Record<string, {
      isSolo: boolean
      isMuted: boolean
      volume: number
      pan: number
    }> = {}

    stems.forEach(stem => {
      states[stem.id] = {
        isSolo: stem.is_solo || false,
        isMuted: stem.is_muted || false,
        volume: stem.volume ?? 1.0,
        pan: stem.pan ?? 0.0
      }
    })

    setStemStates(states)
  }, [stems])

  // Handle solo logic - when one stem is soloed, mute all others
  const handleSoloToggle = async (stemId: string) => {
    const currentState = stemStates[stemId]
    const newSolo = !currentState.isSolo

    // If soloing this stem, unsolo all others
    if (newSolo) {
      const updatedStates = { ...stemStates }
      Object.keys(updatedStates).forEach(id => {
        if (id === stemId) {
          updatedStates[id].isSolo = true
        } else {
          updatedStates[id].isSolo = false
        }
      })
      setStemStates(updatedStates)

      // Update database
      try {
        await Promise.all([
          updateStemMetadata(stemId, { is_solo: true }),
          ...Object.keys(updatedStates)
            .filter(id => id !== stemId)
            .map(id => updateStemMetadata(id, { is_solo: false }))
        ])
        onStemUpdate?.()
      } catch (err) {
        console.error('Error updating solo state:', err)
      }
    } else {
      // Unsolo this stem
      const updatedStates = { ...stemStates }
      updatedStates[stemId].isSolo = false
      setStemStates(updatedStates)

      try {
        await updateStemMetadata(stemId, { is_solo: false })
        onStemUpdate?.()
      } catch (err) {
        console.error('Error updating solo state:', err)
      }
    }
  }

  const handleMuteToggle = async (stemId: string) => {
    const currentState = stemStates[stemId]
    const newMuted = !currentState.isMuted

    const updatedStates = { ...stemStates }
    updatedStates[stemId].isMuted = newMuted
    setStemStates(updatedStates)

    try {
      await updateStemMetadata(stemId, { is_muted: newMuted })
      onStemUpdate?.()
    } catch (err) {
      console.error('Error updating mute state:', err)
    }
  }

  const handleVolumeChange = async (stemId: string, volume: number) => {
    const updatedStates = { ...stemStates }
    updatedStates[stemId].volume = volume
    setStemStates(updatedStates)

    try {
      await updateStemMetadata(stemId, { volume })
      onStemUpdate?.()
    } catch (err) {
      console.error('Error updating volume:', err)
    }
  }

  const handlePanChange = async (stemId: string, pan: number) => {
    const updatedStates = { ...stemStates }
    updatedStates[stemId].pan = pan
    setStemStates(updatedStates)

    try {
      await updateStemMetadata(stemId, { pan })
      onStemUpdate?.()
    } catch (err) {
      console.error('Error updating pan:', err)
    }
  }

  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    setDragOverIndex(index)
  }

  const handleDragLeave = () => {
    setDragOverIndex(null)
  }

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    setDragOverIndex(null)

    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null)
      return
    }

    // Reorder stems
    const newStems = [...sortedStems]
    const [draggedStem] = newStems.splice(draggedIndex, 1)
    newStems.splice(dropIndex, 0, draggedStem)

    // Update order_index for all affected stems
    const stemOrders = newStems.map((stem, index) => ({
      stemId: stem.id,
      order_index: index
    }))

    try {
      await updateStemOrder(songId, stemOrders)
      
      // Update order_index in the new stems array
      const updatedStems = newStems.map((stem, index) => ({
        ...stem,
        order_index: index
      }))
      
      // Notify parent of the reorder without full reload
      onStemReorder?.(updatedStems)
      
      setDraggedIndex(null)
    } catch (err) {
      console.error('Error updating stem order:', err)
      setDraggedIndex(null)
      // On error, we might want to reload to get correct state
      onStemUpdate?.()
    }
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  // Note: formatTime, getStemsToPlay, stemsToPlay, allStemsReady, and readyStemsCount
  // are not currently used but may be needed for future features

  return (
    <div style={{ width: '100%' }}>
      {/* Individual Stem Players */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {sortedStems.length === 0 ? (
          <div style={{
            padding: 'var(--space-4)',
            background: 'var(--color-bg-tertiary)',
            borderRadius: 'var(--radius-base)',
            border: '1px solid var(--color-border)',
            textAlign: 'center',
            color: 'var(--color-text-secondary)'
          }}>
            No stems available
          </div>
        ) : sortedStems.map((stem, index) => {
          const state = stemStates[stem.id]
          const url = stemUrls[stem.id]
          
          // Validate stem has required data
          if (!stem.id || !stem.instrument) {
            console.warn(`Invalid stem data:`, stem)
            return null
          }
          
          if (!state) {
            return (
              <div key={stem.id} style={{
                padding: 'var(--space-4)',
                background: 'var(--color-bg-tertiary)',
                borderRadius: 'var(--radius-base)',
                border: '1px solid var(--color-border)',
                textAlign: 'center',
                color: 'var(--color-text-secondary)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <i className="bi bi-hourglass-split" style={{ animation: 'spin 1s linear infinite' }} />
                  Initializing {stem.instrument}...
                </div>
              </div>
            )
          }
          
          if (!url || url.trim() === '' || !url.startsWith('http')) {
            return (
              <div key={stem.id} style={{
                padding: 'var(--space-4)',
                background: 'var(--color-bg-tertiary)',
                borderRadius: 'var(--radius-base)',
                border: '1px solid var(--color-border)',
                textAlign: 'center',
                color: 'var(--color-text-secondary)'
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <i className="bi bi-hourglass-split" style={{ animation: 'spin 1s linear infinite' }} />
                    Loading audio URL for {stem.instrument}...
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                    {url ? 'Invalid URL format' : 'URL not available'}
                  </div>
                </div>
              </div>
            )
          }

          return (
            <div
              key={stem.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              style={{
                padding: 'var(--space-4)',
                background: 'var(--color-bg-tertiary)',
                borderRadius: 'var(--radius-base)',
                border: '1px solid var(--color-border)',
                opacity: state.isMuted && !state.isSolo ? 0.6 : 1,
                cursor: draggedIndex === index ? 'grabbing' : 'grab',
                position: 'relative',
                transition: draggedIndex === null ? 'all 0.2s ease' : 'none',
                transform: draggedIndex === index ? 'scale(0.95) rotate(2deg)' : dragOverIndex === index ? 'translateY(-4px)' : 'none',
                boxShadow: dragOverIndex === index ? '0 4px 12px rgba(0,0,0,0.15)' : draggedIndex === index ? '0 8px 16px rgba(0,0,0,0.2)' : 'none',
                borderColor: dragOverIndex === index ? '#3b82f6' : draggedIndex === index ? '#2563eb' : 'var(--color-border)',
                zIndex: draggedIndex === index ? 1000 : dragOverIndex === index ? 999 : 1
              }}
            >
              {/* Order Number and Drag Handle */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'start',
                marginBottom: 'var(--space-3)'
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: 'var(--color-bg-secondary)',
                      color: 'var(--color-text-secondary)',
                      fontSize: '12px',
                      fontWeight: '600',
                      border: '1px solid var(--color-border)'
                    }}>
                      {index + 1}
                    </span>
                    <p style={{ margin: 0, fontWeight: 'var(--font-weight-semibold)', fontSize: 'var(--font-size-lg)' }}>
                      <span style={{ textTransform: 'capitalize' }}>{stem.instrument}</span>
                      {state.isSolo && <span style={{ marginLeft: '8px', color: '#fbbf24', fontSize: '12px', fontWeight: 'bold' }}>SOLO</span>}
                      {state.isMuted && <span style={{ marginLeft: '8px', color: '#ef4444', fontSize: '12px', fontWeight: 'bold' }}>MUTED</span>}
                    </p>
                  </div>
                  <p style={{ margin: 'var(--space-1) 0 0 0', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                    {stem.file_name}
                  </p>
                </div>
                {/* Drag Handle */}
                <div
                  style={{
                    cursor: 'grab',
                    color: 'var(--color-text-secondary)',
                    fontSize: '20px',
                    padding: '4px 8px',
                    display: 'flex',
                    alignItems: 'center',
                    userSelect: 'none'
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  title="Drag to reorder"
                >
                  <span>⋮⋮</span>
                </div>
              </div>
              
              <SynchronizedStemPlayer
                key={`player-${stem.id}`}
                stem={stem}
                audioUrl={url}
                isSolo={state.isSolo}
                isMuted={state.isMuted}
                volume={state.volume}
                pan={state.pan}
                onSoloToggle={() => handleSoloToggle(stem.id)}
                onMuteToggle={() => handleMuteToggle(stem.id)}
                onVolumeChange={(vol) => handleVolumeChange(stem.id, vol)}
                onPanChange={(pan) => handlePanChange(stem.id, pan)}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}

// MasterStemPlayer now expects to be used within a MasterAudioClockProvider
// The provider should be at a higher level (e.g., SongAuthor) to persist across tab changes
const MasterStemPlayer = (props: MasterStemPlayerProps) => {
  return <MasterStemPlayerContent {...props} />
}

export default MasterStemPlayer
