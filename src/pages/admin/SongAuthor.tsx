import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import AdminLayout from '../../components/layout/AdminLayout'
import { useAuthStore } from '../../store/auth'
import { 
  fetchSongById, 
  updateSong,
  updateSongStatus, 
  uploadCoverArt, 
  uploadStem, 
  createSongStem,
  deleteSongStem,
  getAvailableGenres,
  getAvailableTags,
  getStemSignedUrl
} from '../../lib/song-service'
import { canManageSong } from '../../lib/permissions'
import { TextField, Textarea, Select, Button, Card } from '../../components/ui'
import MasterStemPlayer from '../../components/MasterStemPlayer'
import { MasterAudioClockProvider, useMasterClock } from '../../components/MasterAudioClock'
import type { SongFormData, StemUpload, Song, SongStem } from '../../types/song'

// Persistent Play Controls Component - always visible
const PersistentPlayControls = ({ 
  stems, 
  stemUrls 
}: { 
  stems: SongStem[] | null
  stemUrls: Record<string, string>
}) => {
  const masterClock = useMasterClock()
  
  if (!stems || stems.length === 0) {
    return null
  }
  
  const allStemsReady = stems.every(stem => {
    return stemUrls[stem.id] && stemUrls[stem.id].trim() !== '' && stemUrls[stem.id].startsWith('http')
  })
  
  const formatTime = (seconds: number): string => {
    if (isNaN(seconds) || seconds < 0) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }
  
  const toggleMasterPlay = () => {
    if (masterClock.isPlaying) {
      masterClock.pause()
    } else {
      masterClock.play()
    }
  }
  
  const handleStop = () => {
    // Force stop all stems by pausing first, then seeking to start
    masterClock.pause()
    // Seek to 0 to reset all players
    masterClock.seek(0)
  }
  
  return (
    <div style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      background: 'linear-gradient(135deg, var(--color-bg-tertiary) 0%, var(--color-bg-secondary) 100%)',
      padding: '12px 16px',
      borderRadius: 'var(--radius-base)',
      marginBottom: 'var(--space-4)',
      border: '2px solid var(--color-border)',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={toggleMasterPlay}
            disabled={!allStemsReady}
            style={{
              padding: '10px 20px',
              background: allStemsReady 
                ? (masterClock.isPlaying 
                    ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' 
                    : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)')
                : '#9ca3af',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: allStemsReady ? 'pointer' : 'not-allowed',
              fontSize: '14px',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: allStemsReady ? '0 4px 12px rgba(59, 130, 246, 0.3)' : 'none',
              transition: 'all 0.2s ease'
            }}
          >
            {masterClock.isPlaying ? (
              <>
                <span style={{ fontSize: '18px' }}>⏸</span>
                <span>Pause</span>
              </>
            ) : (
              <>
                <span style={{ fontSize: '18px' }}>▶</span>
                <span>Play</span>
              </>
            )}
          </button>
          
          {masterClock.isPlaying && (
            <button
              onClick={handleStop}
              style={{
                padding: '10px 16px',
                background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 4px 12px rgba(107, 114, 128, 0.3)'
              }}
            >
              <span style={{ fontSize: '16px' }}>⏹</span>
              <span>Stop</span>
            </button>
          )}
        </div>
        
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: '2px'
        }}>
          <div style={{
            fontSize: '16px',
            fontWeight: '700',
            color: 'var(--color-text-primary)',
            fontFamily: 'monospace',
            letterSpacing: '1px'
          }}>
            {formatTime(masterClock.currentTime)} / {formatTime(masterClock.duration)}
          </div>
          {masterClock.duration > 0 && (
            <div style={{
              width: '200px',
              height: '4px',
              background: 'var(--color-bg-primary)',
              borderRadius: '2px',
              overflow: 'hidden',
              cursor: 'pointer'
            }}
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect()
              const percent = (e.clientX - rect.left) / rect.width
              const newTime = percent * masterClock.duration
              masterClock.seek(newTime)
            }}
            >
              <div style={{
                width: `${(masterClock.currentTime / masterClock.duration) * 100}%`,
                height: '100%',
                background: masterClock.isPlaying 
                  ? 'linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)'
                  : 'linear-gradient(90deg, #6b7280 0%, #4b5563 100%)',
                transition: 'width 0.1s linear'
              }} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Component for previewing new stems before they're uploaded
const NewStemAudioPreview = ({ file }: { file: File }) => {
  const urlRef = useRef<string | null>(null)

  useEffect(() => {
    // Create blob URL
    urlRef.current = URL.createObjectURL(file)
    
    return () => {
      // Cleanup blob URL on unmount
      if (urlRef.current) {
        URL.revokeObjectURL(urlRef.current)
      }
    }
  }, [file])

  return (
    <div style={{ 
      marginBottom: 'var(--space-4)',
      padding: 'var(--space-3)',
      background: 'var(--color-bg-secondary)',
      borderRadius: 'var(--radius-base)',
      border: '1px solid var(--color-border)',
      textAlign: 'center',
      color: 'var(--color-text-secondary)',
      fontSize: 'var(--font-size-sm)'
    }}>
      <p style={{ margin: 0 }}>
        Audio preview will be available after saving this stem
      </p>
      {urlRef.current && (
        <audio 
          controls 
          style={{ marginTop: 'var(--space-2)', width: '100%' }}
          src={urlRef.current}
        />
      )}
    </div>
  )
}

const SongAuthor = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const songId = searchParams.get('id')
  const { userProfile, user } = useAuthStore()
  
  const [activeTab, setActiveTab] = useState<'details' | 'stems'>('details')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  const [song, setSong] = useState<Song | null>(null)
  const [formData, setFormData] = useState<SongFormData>({
    title: '',
    artist: '',
    genre: '',
    difficulty: undefined,
    bpm: undefined,
    key: '',
    description: '',
    tags: [],
    cover_art_file: undefined,
    cover_art_url: undefined,
    cover_art_storage_path: undefined
  })
  
  const [newStems, setNewStems] = useState<StemUpload[]>([])
  const [stemUrls, setStemUrls] = useState<Record<string, string>>({})
  const [availableGenres, setAvailableGenres] = useState<string[]>([])
  const [, setAvailableTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [genreInput, setGenreInput] = useState('')

  useEffect(() => {
    if (songId) {
      loadSong()
      loadFilters()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [songId]) // Only reload when songId changes

  const loadSong = async () => {
    if (!songId) return
    
    try {
      setLoading(true)
      const loadedSong = await fetchSongById(songId)
      
      if (!loadedSong) {
        setError('Song not found')
        return
      }

      // Check permissions
      if (!userProfile?.role || !user?.id || !canManageSong(userProfile.role, loadedSong.created_by, user.id)) {
        setError('You do not have permission to edit this song')
        return
      }

      // Ensure stems are sorted by order_index before setting
      if (loadedSong.stems && Array.isArray(loadedSong.stems)) {
        loadedSong.stems.sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
      }
      
      setSong(loadedSong)
      setFormData({
        title: loadedSong.title,
        artist: loadedSong.artist,
        genre: loadedSong.genre || '',
        difficulty: loadedSong.difficulty || undefined,
        bpm: loadedSong.bpm || undefined,
        key: loadedSong.key || '',
        description: loadedSong.description || '',
        tags: loadedSong.tags || [],
        cover_art_url: loadedSong.cover_art_url || undefined,
        cover_art_storage_path: loadedSong.cover_art_storage_path || undefined
      })

      // Load signed URLs for existing stems - PRELOAD on page load with retry logic
      // Validate stems exist and have required fields
      if (loadedSong.stems && Array.isArray(loadedSong.stems) && loadedSong.stems.length > 0) {
        // Filter out any invalid stems
        const validStems = loadedSong.stems.filter(s => s && s.id && s.storage_path && s.instrument)
        
        if (validStems.length !== loadedSong.stems.length) {
          console.warn(`Filtered out ${loadedSong.stems.length - validStems.length} invalid stems`)
        }
        
        if (validStems.length === 0) {
          console.warn('No valid stems found after filtering')
          setStemUrls({})
          return
        }
        
        const currentStemIds = Object.keys(stemUrls).sort().join(',')
        const newStemIds = validStems.map(s => s.id).sort().join(',')
        
        // Always reload URLs on page load to ensure freshness, or if stems changed
        const shouldReload = currentStemIds !== newStemIds || Object.keys(stemUrls).length === 0 || Object.keys(stemUrls).length !== validStems.length
        
        if (shouldReload) {
          const urls: Record<string, string> = {}
          const failedStems: Array<{ stem: SongStem; retries: number }> = []
          
          // Helper function to load URL with retry
          const loadStemUrlWithRetry = async (stem: SongStem, maxRetries: number = 3): Promise<string | null> => {
            for (let attempt = 1; attempt <= maxRetries; attempt++) {
              try {
                const url = await getStemSignedUrl(stem.storage_path, 86400)
                if (url && url.trim() !== '' && url.startsWith('http')) {
                  return url
                } else {
                  console.warn(`Attempt ${attempt}/${maxRetries}: Invalid URL for stem ${stem.instrument}`)
                }
              } catch (err) {
                console.warn(`Attempt ${attempt}/${maxRetries}: Failed to load URL for stem ${stem.instrument}:`, err)
                if (attempt < maxRetries) {
                  // Wait before retry (exponential backoff)
                  await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
                }
              }
            }
            return null
          }
          
          // Load all URLs with retry logic
          const urlPromises = validStems.map(async (stem) => {
            const url = await loadStemUrlWithRetry(stem)
            if (url) {
              urls[stem.id] = url
              console.log(`✓ Loaded URL for stem ${stem.instrument} (${stem.id.substring(0, 8)}...)`)
              
              // Preload the audio file for better performance
              try {
                const audio = new Audio()
                audio.preload = 'auto'
                audio.src = url
                audio.load()
              } catch (audioErr) {
                console.warn(`Failed to preload audio for ${stem.instrument}:`, audioErr)
              }
            } else {
              failedStems.push({ stem, retries: 3 })
              console.error(`✗ Failed to load URL for stem ${stem.instrument} after retries`)
            }
          })
          
          await Promise.all(urlPromises)
          
          // Validate that we have URLs for all stems
          const loadedCount = Object.keys(urls).length
          const expectedCount = validStems.length
          
          if (loadedCount === expectedCount) {
            setStemUrls(urls)
            console.log(`✓ Successfully loaded all ${loadedCount} stem URLs`)
          } else if (loadedCount > 0) {
            // Partial success - set what we have but warn
            setStemUrls(urls)
            console.warn(`⚠ Only loaded ${loadedCount} of ${expectedCount} stem URLs. Missing: ${failedStems.map(f => f.stem.instrument).join(', ')}`)
            
            // Retry failed stems one more time
            if (failedStems.length > 0) {
              console.log(`Retrying ${failedStems.length} failed stems...`)
              const retryPromises = failedStems.map(async ({ stem }) => {
                const url = await loadStemUrlWithRetry(stem, 2) // One more retry
                if (url) {
                  setStemUrls(prev => ({ ...prev, [stem.id]: url }))
                  console.log(`✓ Retry successful for ${stem.instrument}`)
                }
              })
              await Promise.all(retryPromises)
            }
          } else {
            console.error('✗ Failed to load any stem URLs')
            setError(`Failed to load audio URLs for stems. Please refresh the page.`)
          }
        } else {
          console.log('Stems unchanged, using cached URLs')
        }
      } else {
        // No stems - clear URLs
        setStemUrls({})
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load song')
    } finally {
      setLoading(false)
    }
  }

  const loadFilters = async () => {
    try {
      const [genres, tags] = await Promise.all([
        getAvailableGenres(),
        getAvailableTags()
      ])
      setAvailableGenres(genres)
      setAvailableTags(tags)
    } catch (err) {
      console.error('Error loading filters:', err)
    }
  }

  const handleInputChange = (field: keyof SongFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      handleInputChange('tags', [...(formData.tags || []), tagInput.trim()])
      setTagInput('')
    }
  }

  const handleRemoveTag = (tag: string) => {
    handleInputChange('tags', formData.tags?.filter(t => t !== tag) || [])
  }

  const handleAddGenre = () => {
    const genre = genreInput.trim()
    if (genre && !availableGenres.includes(genre)) {
      setAvailableGenres(prev => [...prev, genre].sort())
      handleInputChange('genre', genre)
      setGenreInput('')
    } else if (genre && availableGenres.includes(genre)) {
      handleInputChange('genre', genre)
      setGenreInput('')
    }
  }

  const handleSave = async () => {
    if (!songId || !user?.id) {
      setError('Song ID or user not found')
      return
    }

    if (!formData.title.trim()) {
      setError('Title is required')
      return
    }

    if (!formData.artist.trim()) {
      setError('Artist is required')
      return
    }

    try {
      setSaving(true)
      setError(null)
      setSuccess(null)

      // Upload cover art if new
      if (formData.cover_art_file && songId) {
        const coverArtUrl = await uploadCoverArt(songId, formData.cover_art_file)
        await updateSong(songId, {
          ...formData,
          cover_art_url: coverArtUrl,
          cover_art_storage_path: `song-covers/${songId}/${formData.cover_art_file.name}`
        })
      } else {
        await updateSong(songId, formData)
      }

      // Upload new stems
      const uploadedStems: SongStem[] = []
      for (const stem of newStems) {
        if (!stem.instrument || !stem.instrument.trim()) {
          setError(`Please set the instrument for stem: ${stem.file.name}`)
          setSaving(false)
          return
        }
        try {
          const storagePath = await uploadStem(songId, stem)
          const newStem = await createSongStem(songId, {
            instrument: stem.instrument.trim(),
            storage_path: storagePath,
            file_name: stem.file.name,
            file_size: stem.file.size,
            mime_type: stem.file.type,
            order_index: stem.order_index || ((song?.stems?.length || 0) + uploadedStems.length)
          })
          uploadedStems.push(newStem)
        } catch (err: any) {
          setError(`Failed to upload stem "${stem.file.name}": ${err.message || 'Unknown error'}`)
          setSaving(false)
          return
        }
      }

      // If new stems were uploaded, fetch their URLs and add to existing stems
      if (uploadedStems.length > 0 && song) {
        const newUrls: Record<string, string> = {}
        const urlPromises = uploadedStems.map(async (stem) => {
          try {
            const url = await getStemSignedUrl(stem.storage_path, 86400)
            if (url) {
              newUrls[stem.id] = url
            }
          } catch (err) {
            console.error(`Failed to get URL for new stem ${stem.id}:`, err)
          }
        })
        await Promise.all(urlPromises)
        
        // Update state without full reload
        setSong({
          ...song,
          stems: [...(song.stems || []), ...uploadedStems].sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
        })
        setStemUrls(prev => ({ ...prev, ...newUrls }))
      }

      setNewStems([])
      setSuccess('Song saved successfully!')
      
      // Only reload if we need to refresh other data (like cover art changes)
      // For stem additions, we've already updated the state above
    } catch (err: any) {
      setError(err.message || 'Failed to save song')
    } finally {
      setSaving(false)
    }
  }

  const handlePublish = async () => {
    if (!songId) {
      setError('Song ID not found')
      return
    }

    if (!formData.title.trim() || !formData.artist.trim()) {
      setError('Title and Artist are required')
      return
    }

    if (!song?.stems || song.stems.length === 0) {
      setError('At least one stem is required to publish')
      return
    }

    try {
      setPublishing(true)
      setError(null)
      setSuccess(null)

      // Save any pending changes first
      await handleSave()

      // Publish song
      await updateSongStatus(songId, 'live')
      setSuccess('Song published successfully!')
      await loadSong() // Reload to get updated status
    } catch (err: any) {
      setError(err.message || 'Failed to publish song')
    } finally {
      setPublishing(false)
    }
  }

  const handleUnpublish = async () => {
    if (!songId) {
      setError('Song ID not found')
      return
    }

    try {
      setPublishing(true)
      setError(null)
      setSuccess(null)

      await updateSongStatus(songId, 'draft')
      setSuccess('Song unpublished successfully!')
      await loadSong()
    } catch (err: any) {
      setError(err.message || 'Failed to unpublish song')
    } finally {
      setPublishing(false)
    }
  }

  const handleAddStem = (file: File) => {
    const tempId = `temp-${Date.now()}-${Math.random()}`
    setNewStems(prev => [...prev, { 
      id: tempId,
      instrument: '', 
      file,
      order_index: prev.length
    }])
  }

  const handleUpdateStem = (stemId: string, updates: Partial<StemUpload>) => {
    setNewStems(prev => prev.map(s => 
      s.id === stemId ? { ...s, ...updates } : s
    ))
  }

  const handleRemoveStem = (stemId: string) => {
    setNewStems(prev => prev.filter(s => s.id !== stemId))
  }

  const handleRemoveExistingStem = async (stemId: string, storagePath: string) => {
    if (!songId || !song) return
    try {
      await deleteSongStem(stemId, storagePath)
      
      // Update local state without full reload
      const updatedStems = (song.stems || []).filter(s => s.id !== stemId)
      setSong({
        ...song,
        stems: updatedStems
      })
      
      // Remove URL from state
      setStemUrls(prev => {
        const newUrls = { ...prev }
        delete newUrls[stemId]
        return newUrls
      })
      
      setSuccess('Stem removed successfully!')
    } catch (err: any) {
      setError(err.message || 'Failed to delete stem')
      // On error, reload to get correct state
      await loadSong()
    }
  }

  const handleCoverArtUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }
    handleInputChange('cover_art_file', file)
    
    // Preview
    const reader = new FileReader()
    reader.onload = (e) => {
      handleInputChange('cover_art_url', e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  if (loading) {
    return (
      <AdminLayout>
        <div style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
          Loading song...
        </div>
      </AdminLayout>
    )
  }

  if (!song) {
    return (
      <AdminLayout>
        <div style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
          {error || 'Song not found'}
        </div>
      </AdminLayout>
    )
  }

  // Inner component that has access to masterClock
  const SongAuthorContent = () => {
    const masterClock = useMasterClock()
    const prevTabRef = useRef<'details' | 'stems'>(activeTab)

    // Stop playback when tab changes (only if switching away from stems tab)
    useEffect(() => {
      if (prevTabRef.current !== activeTab) {
        // Only stop if switching away from stems tab
        if (prevTabRef.current === 'stems' && activeTab !== 'stems' && masterClock.isPlaying) {
          masterClock.pause()
          masterClock.seek(0)
        }
        prevTabRef.current = activeTab
      }
    }, [activeTab, masterClock])

    return (
      <AdminLayout>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
          <h2 style={{ margin: 0 }}>Song Author: {song.title}</h2>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <span style={{
              padding: 'var(--space-2) var(--space-4)',
              borderRadius: 'var(--radius-base)',
              background: song.status === 'live' ? 'var(--color-success)' : 'var(--color-bg-tertiary)',
              color: song.status === 'live' ? 'white' : 'var(--color-text-primary)',
              fontSize: 'var(--font-size-sm)',
              fontWeight: 'var(--font-weight-semibold)'
            }}>
              {song.status === 'live' ? 'Published' : 'Draft'}
            </span>
          </div>
        </div>

        {/* Persistent Play Controls */}
        <PersistentPlayControls stems={song.stems || null} stemUrls={stemUrls} />
        
        {error && (
          <div style={{
            padding: 'var(--space-4)',
            background: 'var(--color-error)',
            color: 'white',
            borderRadius: 'var(--radius-base)',
            marginBottom: 'var(--space-4)'
          }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{
            padding: 'var(--space-4)',
            background: 'var(--color-success)',
            color: 'white',
            borderRadius: 'var(--radius-base)',
            marginBottom: 'var(--space-4)'
          }}>
            {success}
          </div>
        )}

        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: 'var(--space-2)',
          marginBottom: 'var(--space-6)',
          borderBottom: '2px solid var(--color-border)'
        }}>
          <button
            onClick={() => setActiveTab('details')}
            style={{
              padding: 'var(--space-3) var(--space-6)',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'details' ? '2px solid var(--color-brand-primary)' : '2px solid transparent',
              color: activeTab === 'details' ? 'var(--color-brand-primary)' : 'var(--color-text-secondary)',
              cursor: 'pointer',
              fontWeight: activeTab === 'details' ? 'var(--font-weight-semibold)' : 'var(--font-weight-normal)',
              marginBottom: '-2px'
            }}
          >
            Details
          </button>
          <button
            onClick={() => setActiveTab('stems')}
            style={{
              padding: 'var(--space-3) var(--space-6)',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'stems' ? '2px solid var(--color-brand-primary)' : '2px solid transparent',
              color: activeTab === 'stems' ? 'var(--color-brand-primary)' : 'var(--color-text-secondary)',
              cursor: 'pointer',
              fontWeight: activeTab === 'stems' ? 'var(--font-weight-semibold)' : 'var(--font-weight-normal)',
              marginBottom: '-2px'
            }}
          >
            Stems
          </button>
        </div>

        {/* Details Tab */}
        {activeTab === 'details' && (
          <Card variant="elevated" padding="lg">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
              <TextField
                label="Title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                required
                fullWidth
              />

              <TextField
                label="Artist"
                value={formData.artist}
                onChange={(e) => handleInputChange('artist', e.target.value)}
                required
                fullWidth
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 'var(--space-2)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)' }}>
                    Genre
                  </label>
                  <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                    <Select
                      name="genre"
                      value={formData.genre}
                      onChange={(e) => handleInputChange('genre', e.target.value)}
                      options={[
                        { value: '', label: 'Select Genre' },
                        ...availableGenres.map(g => ({ value: g, label: g }))
                      ]}
                      fullWidth
                      style={{ flex: 1 }}
                    />
                    <TextField
                      value={genreInput}
                      onChange={(e) => setGenreInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddGenre()}
                      placeholder="Add new genre"
                      fullWidth
                      style={{ flex: 1 }}
                    />
                    <Button
                      onClick={handleAddGenre}
                      variant="primary"
                    >
                      Add
                    </Button>
                  </div>
                  {formData.genre && (
                    <div style={{ marginTop: 'var(--space-2)' }}>
                      <span style={{
                        padding: 'var(--space-2) var(--space-3)',
                        background: 'var(--color-bg-tertiary)',
                        borderRadius: 'var(--radius-base)',
                        fontSize: 'var(--font-size-sm)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 'var(--space-2)',
                        color: 'var(--color-text-primary)'
                      }}>
                        {formData.genre}
                        <button
                          onClick={() => handleInputChange('genre', '')}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--color-text-secondary)',
                            cursor: 'pointer',
                            fontSize: 'var(--font-size-lg)',
                            lineHeight: 1,
                            padding: 0,
                            display: 'flex',
                            alignItems: 'center'
                          }}
                          aria-label="Remove genre"
                        >
                          ×
                        </button>
                      </span>
                    </div>
                  )}
                </div>

                <Select
                  label="Difficulty"
                  name="difficulty"
                  value={formData.difficulty || ''}
                  onChange={(e) => handleInputChange('difficulty', e.target.value || undefined)}
                  options={[
                    { value: '', label: 'Select Difficulty' },
                    { value: 'beginner', label: 'Beginner' },
                    { value: 'intermediate', label: 'Intermediate' },
                    { value: 'advanced', label: 'Advanced' },
                    { value: 'expert', label: 'Expert' }
                  ]}
                  fullWidth
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                <TextField
                  label="BPM"
                  type="number"
                  value={formData.bpm?.toString() || ''}
                  onChange={(e) => handleInputChange('bpm', e.target.value ? parseInt(e.target.value) : undefined)}
                  fullWidth
                />

                <TextField
                  label="Key"
                  value={formData.key}
                  onChange={(e) => handleInputChange('key', e.target.value)}
                  placeholder="e.g., C major, A minor"
                  fullWidth
                />
              </div>

              <Textarea
                label="Description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={4}
                fullWidth
              />

              <div>
                <label style={{ display: 'block', marginBottom: 'var(--space-2)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)' }}>
                  Tags
                </label>
                <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                  <TextField
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                    placeholder="Add a tag and press Enter"
                    fullWidth
                    style={{ flex: 1 }}
                  />
                  <Button
                    onClick={handleAddTag}
                    variant="primary"
                  >
                    Add
                  </Button>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                  {formData.tags?.map(tag => (
                    <span
                      key={tag}
                      style={{
                        padding: 'var(--space-2) var(--space-3)',
                        background: 'var(--color-bg-tertiary)',
                        borderRadius: 'var(--radius-base)',
                        fontSize: 'var(--font-size-sm)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-2)',
                        color: 'var(--color-text-primary)'
                      }}
                    >
                      {tag}
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--color-text-secondary)',
                          cursor: 'pointer',
                          fontSize: 'var(--font-size-lg)',
                          lineHeight: 1,
                          padding: 0,
                          display: 'flex',
                          alignItems: 'center'
                        }}
                        aria-label={`Remove tag ${tag}`}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 'var(--space-2)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)' }}>
                  Cover Art
                </label>
                {formData.cover_art_url && (
                  <img
                    src={formData.cover_art_url}
                    alt="Cover preview"
                    style={{
                      width: '200px',
                      height: '200px',
                      objectFit: 'cover',
                      borderRadius: 'var(--radius-base)',
                      marginBottom: 'var(--space-4)',
                      border: '1px solid var(--color-border-default)'
                    }}
                  />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleCoverArtUpload(file)
                  }}
                  style={{
                    width: '100%',
                    padding: 'var(--space-3)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-base)',
                    fontSize: 'var(--font-size-base)',
                    background: 'var(--color-bg-primary)',
                    color: 'var(--color-text-primary)'
                  }}
                />
              </div>
            </div>
          </Card>
        )}

        {/* Stems Tab - Keep mounted but hidden to preserve waveforms */}
        {/* CRITICAL: Always keep display: block and proper dimensions so WaveSurfer can render */}
        <div 
          key="stems-tab-container"
          style={{
            display: 'block', // Always block - never none!
            visibility: activeTab === 'stems' ? 'visible' : 'hidden',
            position: activeTab === 'stems' ? 'relative' : 'absolute',
            left: activeTab === 'stems' ? 'auto' : '-9999px',
            top: activeTab === 'stems' ? 'auto' : '0',
            width: '100%',
            minHeight: '200px', // Always maintain minimum height for waveforms
            overflow: activeTab === 'stems' ? 'visible' : 'hidden',
            pointerEvents: activeTab === 'stems' ? 'auto' : 'none',
            background: 'var(--color-bg-secondary)',
            padding: 'var(--space-6)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--color-border)',
            zIndex: activeTab === 'stems' ? 'auto' : '-1',
            // Ensure container maintains layout even when hidden
            boxSizing: 'border-box'
          }}
        >
          <h3 style={{ marginBottom: 'var(--space-4)' }}>Stems</h3>

          {/* Existing stems with master player */}
          {song.stems && song.stems.length > 0 && (
            <div style={{ marginBottom: 'var(--space-6)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
                <h4 style={{ margin: 0 }}>Existing Stems</h4>
              </div>
              <MasterStemPlayer
                stems={song.stems || []}
                stemUrls={stemUrls}
                songId={song.id}
                onStemUpdate={() => {
                  // Metadata changes (solo, mute, volume) are already persisted to DB
                  // We don't need to reload - the state is already updated in MasterStemPlayer
                  // Only reload if there's an error or we need to sync with server
                }}
                onStemReorder={(reorderedStems) => {
                  // Update local state without full reload
                  if (song) {
                    setSong({
                      ...song,
                      stems: reorderedStems
                    })
                  }
                }}
              />
              
              {/* Remove buttons for each stem */}
              <div style={{ marginTop: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                {song.stems.map(stem => (
                  <div
                    key={stem.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: 'var(--space-2) var(--space-3)',
                      background: 'var(--color-bg-primary)',
                      borderRadius: 'var(--radius-base)',
                      border: '1px solid var(--color-border)'
                    }}
                  >
                    <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                      {stem.instrument} - {stem.file_name}
                    </span>
                    <button
                      onClick={() => handleRemoveExistingStem(stem.id, stem.storage_path)}
                      style={{
                        padding: 'var(--space-1) var(--space-2)',
                        background: 'var(--color-error)',
                        color: 'white',
                        border: 'none',
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer',
                        fontSize: 'var(--font-size-sm)'
                      }}
                    >
                      <i className="bi bi-trash" /> Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add new stems */}
          <div style={{ marginBottom: 'var(--space-4)' }}>
            <label style={{ display: 'block', marginBottom: 'var(--space-2)', fontWeight: 'var(--font-weight-semibold)' }}>
              Add Stem File
            </label>
            <input
              type="file"
              accept="audio/*"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleAddStem(file)
                e.target.value = ''
              }}
              style={{
                width: '100%',
                padding: 'var(--space-3)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-base)',
                fontSize: 'var(--font-size-base)',
                background: 'var(--color-bg-primary)',
                color: 'var(--color-text-primary)'
              }}
            />
          </div>

          {/* New stems list */}
          {newStems.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <h4 style={{ marginBottom: 'var(--space-2)' }}>New Stems</h4>
              {newStems.map((stem) => (
                <div
                  key={stem.id}
                  style={{
                    padding: 'var(--space-4)',
                    background: 'var(--color-bg-tertiary)',
                    borderRadius: 'var(--radius-base)',
                    border: '1px solid var(--color-border)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 'var(--space-3)' }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontWeight: 'var(--font-weight-semibold)', fontSize: 'var(--font-size-lg)' }}>
                        {stem.file.name}
                      </p>
                      <p style={{ margin: 'var(--space-1) 0 0 0', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                        {(stem.file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemoveStem(stem.id!)}
                      style={{
                        padding: 'var(--space-2) var(--space-3)',
                        background: 'var(--color-error)',
                        color: 'white',
                        border: 'none',
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer',
                        fontSize: 'var(--font-size-sm)'
                      }}
                    >
                      Remove
                    </button>
                  </div>
                  
                  {/* Audio Preview - New stems will be available after saving */}
                  <NewStemAudioPreview file={stem.file} />

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: 'var(--space-1)', fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)' }}>
                        Instrument *
                      </label>
                      <TextField
                        value={stem.instrument}
                        onChange={(e) => handleUpdateStem(stem.id!, { instrument: e.target.value })}
                        placeholder="e.g., vocals, drums, bass"
                        fullWidth
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: 'var(--space-1)', fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)' }}>
                        Order Index
                      </label>
                      <TextField
                        type="number"
                        value={stem.order_index?.toString() || '0'}
                        onChange={(e) => handleUpdateStem(stem.id!, { order_index: parseInt(e.target.value) || 0 })}
                        fullWidth
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: 'var(--space-6)',
          gap: 'var(--space-4)'
        }}>
          <Button
            onClick={() => navigate('/admin/songs')}
            variant="secondary"
          >
            Back to Songs
          </Button>
          <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
            <Button
              onClick={handleSave}
              disabled={saving}
              variant="primary"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
            {song.status === 'live' ? (
              <Button
                onClick={handleUnpublish}
                disabled={publishing}
                variant="secondary"
              >
                {publishing ? 'Unpublishing...' : 'Unpublish'}
              </Button>
            ) : (
              <Button
                onClick={handlePublish}
                disabled={publishing}
                variant="primary"
              >
                {publishing ? 'Publishing...' : 'Publish'}
              </Button>
            )}
          </div>
        </div>
      </div>
      </AdminLayout>
    )
  }

  return (
    <MasterAudioClockProvider>
      <SongAuthorContent />
    </MasterAudioClockProvider>
  )
}

export default SongAuthor

