import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import AdminLayout from '../../components/layout/AdminLayout'
import { useAuthStore } from '../../store/auth'
import { 
  fetchSongById, 
  createSong, 
  updateSong,
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
import WaveformPlayer from '../../components/WaveformPlayer'
import WaveformPlayerTest from '../../components/WaveformPlayerTest'
import type { SongFormData, StemUpload, Song } from '../../types/song'

const SongCreator = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const songId = searchParams.get('id')
  const { userProfile, user } = useAuthStore()
  
  const [activeTab, setActiveTab] = useState<'metadata' | 'stems' | 'review'>('metadata')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Form data
  const [formData, setFormData] = useState<SongFormData>({
    title: '',
    artist: 'play-it-pro',
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
  
  const [stems, setStems] = useState<StemUpload[]>([])
  const [existingStems, setExistingStems] = useState<Song['stems']>([])
  const [stemUrls, setStemUrls] = useState<Record<string, string>>({})
  const [availableGenres, setAvailableGenres] = useState<string[]>([])
  const [, setAvailableTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [genreInput, setGenreInput] = useState('')

  useEffect(() => {
    if (songId) {
      loadSong()
    }
    loadFilters()
  }, [songId])

  const loadSong = async () => {
    if (!songId) return
    
    try {
      setLoading(true)
      const song = await fetchSongById(songId)
      
      if (!song) {
        setError('Song not found')
        return
      }

      // Check permissions
      if (!userProfile?.role || !user?.id || !canManageSong(userProfile.role, song.created_by, user.id)) {
        setError('You do not have permission to edit this song')
        return
      }

      setFormData({
        title: song.title,
        artist: song.artist,
        genre: song.genre || '',
        difficulty: song.difficulty || undefined,
        bpm: song.bpm || undefined,
        key: song.key || '',
        description: song.description || '',
        tags: song.tags || [],
        cover_art_url: song.cover_art_url || undefined,
        cover_art_storage_path: song.cover_art_storage_path || undefined
      })

      setExistingStems(song.stems || [])

      // Load signed URLs for existing stems
      if (song.stems && song.stems.length > 0) {
        const urls: Record<string, string> = {}
        for (const stem of song.stems) {
          const url = await getStemSignedUrl(stem.storage_path)
          if (url) {
            urls[stem.id] = url
          }
        }
        setStemUrls(urls)
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

  const handleAddStem = (file: File) => {
    const tempId = `temp-${Date.now()}-${Math.random()}`
    setStems(prev => [...prev, { 
      id: tempId,
      instrument: '', 
      file,
      order_index: prev.length
    }])
  }

  const handleUpdateStem = (stemId: string, updates: Partial<StemUpload>) => {
    setStems(prev => prev.map(s => 
      s.id === stemId ? { ...s, ...updates } : s
    ))
  }

  const handleRemoveStem = (stemId: string) => {
    setStems(prev => prev.filter(s => s.id !== stemId))
  }

  const handleRemoveExistingStem = async (stemId: string, storagePath: string) => {
    try {
      await deleteSongStem(stemId, storagePath)
      setExistingStems(prev => prev?.filter(s => s.id !== stemId) || [])
    } catch (err: any) {
      setError(err.message || 'Failed to delete stem')
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

  const validateForm = (): boolean => {
    if (!formData.title.trim()) {
      setError('Title is required')
      return false
    }
    if (!formData.artist.trim()) {
      setError('Artist is required')
      return false
    }
    if (!formData.difficulty) {
      setError('Difficulty is required')
      return false
    }
    return true
  }

  const handleSave = async () => {
    if (!user?.id) {
      setError('User not authenticated')
      return
    }

    if (!validateForm()) return

    try {
      setSaving(true)
      setError(null)

      // Create or update song
      let song: Song
      if (songId) {
        song = await updateSong(songId, formData)
      } else {
        song = await createSong(formData, user.id)
      }

      // Upload cover art if new
      if (formData.cover_art_file && song.id) {
        const coverArtUrl = await uploadCoverArt(song.id, formData.cover_art_file)
        await updateSong(song.id, {
          ...formData,
          cover_art_url: coverArtUrl,
          cover_art_storage_path: `song-covers/${song.id}/${formData.cover_art_file.name}`
        })
      }

      // Upload new stems
      for (const stem of stems) {
        if (!stem.instrument || !stem.instrument.trim()) {
          setError(`Please set the instrument for stem: ${stem.file.name}`)
          setSaving(false)
          return
        }
        try {
          const storagePath = await uploadStem(song.id, stem)
          await createSongStem(song.id, {
            instrument: stem.instrument.trim(),
            storage_path: storagePath,
            file_name: stem.file.name,
            file_size: stem.file.size,
            mime_type: stem.file.type,
            order_index: stem.order_index || 0
          })
        } catch (err: any) {
          setError(`Failed to upload stem "${stem.file.name}": ${err.message || 'Unknown error'}`)
          setSaving(false)
          return
        }
      }

      // Clear new stems after upload
      setStems([])
      
      // If this was a new song, update the URL and reload
      if (!songId) {
        navigate(`/admin/songs/create?id=${song.id}`, { replace: true })
        await loadSong()
      } else {
        await loadSong()
      }

      alert('Song saved successfully!')
    } catch (err: any) {
      setError(err.message || 'Failed to save song')
    } finally {
      setSaving(false)
    }
  }

  const handleComplete = async () => {
    await handleSave()
    // Navigate to author page
    if (songId) {
      navigate(`/admin/songs/author?id=${songId}`)
    }
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

  // Create a preview song object for the review tab
  const previewSong: Song = {
    id: songId || 'preview',
    title: formData.title || 'Untitled Song',
    artist: formData.artist || 'play-it-pro',
    genre: formData.genre || null,
    difficulty: formData.difficulty || null,
    bpm: formData.bpm || null,
    key: formData.key || null,
    description: formData.description || null,
    tags: formData.tags || null,
    cover_art_url: formData.cover_art_url || null,
    cover_art_storage_path: formData.cover_art_storage_path || null,
    status: 'draft',
    created_by: user?.id || '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    stems: [
      ...(existingStems || []),
      ...stems.map(s => ({
        id: s.id || `temp-${Date.now()}`,
        song_id: songId || 'preview',
        instrument: s.instrument || 'Unknown',
        storage_path: '',
        file_name: s.file.name,
        file_size: s.file.size,
        mime_type: s.file.type,
        order_index: s.order_index || 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }))
    ]
  }

  return (
    <AdminLayout>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h2 style={{ marginBottom: 'var(--space-6)' }}>
          {songId ? 'Edit Song' : 'Create New Song'}
        </h2>

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

        {/* Cover Art - Above Tabs */}
        <div style={{
          marginBottom: 'var(--space-6)',
          display: 'flex',
          justifyContent: 'center'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '400px',
            aspectRatio: '1',
            background: 'var(--color-bg-secondary)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            position: 'relative'
          }}>
            {formData.cover_art_url ? (
              <>
                <img
                  src={formData.cover_art_url}
                  alt="Cover preview"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
                <div style={{
                  position: 'absolute',
                  bottom: 'var(--space-2)',
                  right: 'var(--space-2)'
                }}>
                  <label style={{
                    padding: 'var(--space-2) var(--space-4)',
                    background: 'var(--color-brand-primary)',
                    color: 'white',
                    borderRadius: 'var(--radius-base)',
                    cursor: 'pointer',
                    fontSize: 'var(--font-size-sm)',
                    display: 'inline-block'
                  }}>
                    Change Cover
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleCoverArtUpload(file)
                      }}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>
              </>
            ) : (
              <label style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'var(--color-text-secondary)',
                gap: 'var(--space-2)'
              }}>
                <i className="bi bi-image" style={{ fontSize: 'var(--font-size-4xl)' }} />
                <span>Upload Cover Art</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleCoverArtUpload(file)
                  }}
                  style={{ display: 'none' }}
                />
              </label>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: 'var(--space-2)',
          marginBottom: 'var(--space-6)',
          borderBottom: '2px solid var(--color-border)'
        }}>
          <button
            onClick={() => setActiveTab('metadata')}
            style={{
              padding: 'var(--space-3) var(--space-6)',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'metadata' ? '2px solid var(--color-brand-primary)' : '2px solid transparent',
              color: activeTab === 'metadata' ? 'var(--color-brand-primary)' : 'var(--color-text-secondary)',
              cursor: 'pointer',
              fontWeight: activeTab === 'metadata' ? 'var(--font-weight-semibold)' : 'var(--font-weight-normal)',
              marginBottom: '-2px'
            }}
          >
            Metadata
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
          <button
            onClick={() => setActiveTab('review')}
            style={{
              padding: 'var(--space-3) var(--space-6)',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'review' ? '2px solid var(--color-brand-primary)' : '2px solid transparent',
              color: activeTab === 'review' ? 'var(--color-brand-primary)' : 'var(--color-text-secondary)',
              cursor: 'pointer',
              fontWeight: activeTab === 'review' ? 'var(--font-weight-semibold)' : 'var(--font-weight-normal)',
              marginBottom: '-2px'
            }}
          >
            Review
          </button>
        </div>

        {/* Metadata Tab */}
        {activeTab === 'metadata' && (
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
                  required
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
            </div>
          </Card>
        )}

        {/* Stems Tab */}
        {activeTab === 'stems' && (
          <div 
            key="stems-tab"
            style={{
              background: 'var(--color-bg-secondary)',
              padding: 'var(--space-6)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--color-border)'
            }}
          >
            <h3 style={{ marginBottom: 'var(--space-4)' }}>Upload Stems</h3>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-6)' }}>
              Upload audio stems and set their metadata. At least one stem is required. Use the waveform player to preview your stems.
            </p>
            
            {/* Test component to verify wavesurfer works */}
            {import.meta.env.DEV && (
              <div style={{ marginBottom: 'var(--space-6)', padding: 'var(--space-4)', background: '#fff3cd', border: '1px solid #ffc107', borderRadius: 'var(--radius-base)' }}>
                <h4 style={{ marginBottom: 'var(--space-2)' }}>Waveform Test (Remove after testing)</h4>
                <WaveformPlayerTest />
              </div>
            )}

            {/* Existing stems */}
            {existingStems && existingStems.length > 0 && (
              <div style={{ marginBottom: 'var(--space-6)' }}>
                <h4 style={{ marginBottom: 'var(--space-4)' }}>Existing Stems</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  {existingStems.map(stem => (
                    <div
                      key={stem.id}
                      style={{
                        padding: 'var(--space-4)',
                        background: 'var(--color-bg-tertiary)',
                        borderRadius: 'var(--radius-base)',
                        border: '1px solid var(--color-border)'
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'start',
                        marginBottom: 'var(--space-3)'
                      }}>
                        <div style={{ flex: 1 }}>
                          <p style={{ margin: 0, fontWeight: 'var(--font-weight-semibold)', fontSize: 'var(--font-size-lg)' }}>
                            <span style={{ textTransform: 'capitalize' }}>{stem.instrument}</span>
                          </p>
                          <p style={{ margin: 'var(--space-1) 0 0 0', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                            {stem.file_name}
                          </p>
                        </div>
                        <button
                          onClick={() => handleRemoveExistingStem(stem.id, stem.storage_path)}
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
                          <i className="bi bi-trash" /> Remove
                        </button>
                      </div>
                      {stemUrls[stem.id] ? (
                        <WaveformPlayer
                          key={`existing-${stem.id}-${activeTab}`}
                          audioUrl={stemUrls[stem.id]}
                          height={120}
                          waveColor="#3b82f6"
                          progressColor="#2563eb"
                        />
                      ) : (
                        <div style={{
                          padding: 'var(--space-4)',
                          background: 'var(--color-bg-primary)',
                          borderRadius: 'var(--radius-base)',
                          textAlign: 'center',
                          color: 'var(--color-text-secondary)',
                          fontSize: 'var(--font-size-sm)'
                        }}>
                          Loading audio URL...
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* New stems */}
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

            {/* Stem list with metadata */}
            {stems.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <h4 style={{ marginBottom: 'var(--space-2)' }}>Stems to Upload</h4>
                {stems.map((stem) => (
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
                    
                    {/* Waveform Player */}
                    <div style={{ marginBottom: 'var(--space-4)' }}>
                      <WaveformPlayer
                        key={`new-${stem.id}-${activeTab}`}
                        audioFile={stem.file}
                        height={120}
                        waveColor="#3b82f6"
                        progressColor="#2563eb"
                      />
                    </div>

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
        )}

        {/* Review Tab - Learner Preview */}
        {activeTab === 'review' && (
          <div style={{
            background: 'var(--color-bg-secondary)',
            padding: 'var(--space-6)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--color-border)'
          }}>
            <h3 style={{ marginBottom: 'var(--space-4)' }}>Learner Preview</h3>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-6)' }}>
              This is how learners will see your song. Review all details before completing.
            </p>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '300px 1fr',
              gap: 'var(--space-8)',
              marginBottom: 'var(--space-8)'
            }}>
              {/* Cover Art */}
              <div>
                {previewSong.cover_art_url ? (
                  <img
                    src={previewSong.cover_art_url}
                    alt={`${previewSong.title} cover`}
                    style={{
                      width: '100%',
                      borderRadius: 'var(--radius-lg)',
                      border: '1px solid var(--color-border)'
                    }}
                  />
                ) : (
                  <div style={{
                    width: '100%',
                    aspectRatio: '1',
                    background: 'var(--color-bg-tertiary)',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--color-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 'var(--font-size-4xl)',
                    color: 'var(--color-text-secondary)'
                  }}>
                    <i className="bi bi-music-note-beamed" />
                  </div>
                )}
              </div>

              {/* Song Info */}
              <div>
                <h1 style={{
                  fontSize: 'var(--font-size-3xl)',
                  fontWeight: 'var(--font-weight-bold)',
                  marginBottom: 'var(--space-2)',
                  color: 'var(--color-text-primary)'
                }}>
                  {previewSong.title || 'Untitled Song'}
                </h1>
                <h2 style={{
                  fontSize: 'var(--font-size-xl)',
                  fontWeight: 'var(--font-weight-semibold)',
                  marginBottom: 'var(--space-4)',
                  color: 'var(--color-text-secondary)'
                }}>
                  {previewSong.artist || 'play-it-pro'}
                </h2>

                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 'var(--space-3)',
                  marginBottom: 'var(--space-6)'
                }}>
                  {previewSong.genre && (
                    <span style={{
                      padding: 'var(--space-2) var(--space-4)',
                      background: 'var(--color-bg-tertiary)',
                      borderRadius: 'var(--radius-base)',
                      fontSize: 'var(--font-size-sm)'
                    }}>
                      {previewSong.genre}
                    </span>
                  )}
                  {previewSong.difficulty && (
                    <span style={{
                      padding: 'var(--space-2) var(--space-4)',
                      borderRadius: 'var(--radius-base)',
                      fontSize: 'var(--font-size-sm)',
                      background: previewSong.difficulty === 'beginner' ? '#10b981' :
                                previewSong.difficulty === 'intermediate' ? '#3b82f6' :
                                previewSong.difficulty === 'advanced' ? '#f59e0b' : '#ef4444',
                      color: 'white'
                    }}>
                      {previewSong.difficulty}
                    </span>
                  )}
                  {previewSong.bpm && (
                    <span style={{
                      padding: 'var(--space-2) var(--space-4)',
                      background: 'var(--color-bg-tertiary)',
                      borderRadius: 'var(--radius-base)',
                      fontSize: 'var(--font-size-sm)'
                    }}>
                      {previewSong.bpm} BPM
                    </span>
                  )}
                  {previewSong.key && (
                    <span style={{
                      padding: 'var(--space-2) var(--space-4)',
                      background: 'var(--color-bg-tertiary)',
                      borderRadius: 'var(--radius-base)',
                      fontSize: 'var(--font-size-sm)'
                    }}>
                      Key: {previewSong.key}
                    </span>
                  )}
                </div>

                {previewSong.description && (
                  <p style={{
                    marginBottom: 'var(--space-6)',
                    lineHeight: '1.6',
                    color: 'var(--color-text-secondary)'
                  }}>
                    {previewSong.description}
                  </p>
                )}

                {previewSong.tags && previewSong.tags.length > 0 && (
                  <div style={{ marginBottom: 'var(--space-6)' }}>
                    <strong style={{ marginRight: 'var(--space-2)' }}>Tags:</strong>
                    {previewSong.tags.map(tag => (
                      <span
                        key={tag}
                        style={{
                          marginRight: 'var(--space-2)',
                          padding: 'var(--space-1) var(--space-2)',
                          background: 'var(--color-bg-tertiary)',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: 'var(--font-size-xs)'
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Available Stems */}
            <div style={{
              background: 'var(--color-bg-tertiary)',
              padding: 'var(--space-6)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--color-border)'
            }}>
              <h3 style={{
                marginBottom: 'var(--space-4)',
                fontSize: 'var(--font-size-xl)',
                fontWeight: 'var(--font-weight-semibold)'
              }}>
                Available Stems
              </h3>
              {previewSong.stems && previewSong.stems.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  {previewSong.stems.map(stem => (
                    <div
                      key={stem.id}
                      style={{
                        padding: 'var(--space-4)',
                        background: 'var(--color-bg-primary)',
                        borderRadius: 'var(--radius-base)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div>
                        <strong style={{ textTransform: 'capitalize' }}>{stem.instrument}</strong>
                        <span style={{ marginLeft: 'var(--space-2)', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                          {stem.file_name}
                        </span>
                      </div>
                      <div style={{
                        padding: 'var(--space-2) var(--space-4)',
                        background: 'var(--color-bg-secondary)',
                        borderRadius: 'var(--radius-base)',
                        fontSize: 'var(--font-size-sm)',
                        color: 'var(--color-text-secondary)'
                      }}>
                        Preview (audio player will appear here)
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: 'var(--color-text-secondary)' }}>No stems available for this song.</p>
              )}
            </div>
          </div>
        )}

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
            Cancel
          </Button>
          <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
            <Button
              onClick={handleSave}
              disabled={saving}
              variant="primary"
            >
              {saving ? 'Saving...' : 'Save Draft'}
            </Button>
            {songId && (
              <Button
                onClick={handleComplete}
                disabled={saving}
                variant="primary"
              >
                {saving ? 'Saving...' : 'Complete & Go to Author Page'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

export default SongCreator
