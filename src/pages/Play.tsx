import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/auth'
import { useIsMobile } from '../hooks/useMediaQuery'
import AdminLayout from '../components/layout/AdminLayout'
import TeacherLayout from '../components/layout/TeacherLayout'
import StudentLayout from '../components/layout/StudentLayout'
import { fetchSongs, fetchSongById, getStemSignedUrl, getAvailableGenres } from '../lib/song-service'
import type { Song, SongDifficulty } from '../types/song'

const Play = () => {
  const { songId } = useParams<{ songId?: string }>()
  const navigate = useNavigate()
  const { userProfile } = useAuthStore()
  const isMobile = useIsMobile()
  
  const [songs, setSongs] = useState<Song[]>([])
  const [currentSong, setCurrentSong] = useState<Song | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [genreFilter, setGenreFilter] = useState<string>('')
  const [difficultyFilter, setDifficultyFilter] = useState<SongDifficulty | ''>('')
  const [availableGenres, setAvailableGenres] = useState<string[]>([])
  const [stemUrls, setStemUrls] = useState<Record<string, string>>({})

  useEffect(() => {
    if (songId) {
      loadSongDetail()
    } else {
      loadSongLibrary()
      loadFilters()
    }
  }, [songId])

  const loadSongLibrary = async () => {
    try {
      setLoading(true)
      const { data } = await fetchSongs({
        status: 'live',
        genre: genreFilter || undefined,
        difficulty: difficultyFilter || undefined,
        search: searchTerm || undefined
      })
      setSongs(data || [])
    } catch (error) {
      console.error('Error loading songs:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadSongDetail = async () => {
    if (!songId) return
    
    try {
      setLoading(true)
      const song = await fetchSongById(songId)
      if (!song || song.status !== 'live') {
        navigate('/play')
        return
      }
      setCurrentSong(song)

      // Load signed URLs for stems
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
    } catch (error) {
      console.error('Error loading song:', error)
      navigate('/play')
    } finally {
      setLoading(false)
    }
  }

  const loadFilters = async () => {
    try {
      const genres = await getAvailableGenres()
      setAvailableGenres(genres)
    } catch (error) {
      console.error('Error loading filters:', error)
    }
  }

  useEffect(() => {
    if (!songId) {
      loadSongLibrary()
    }
  }, [searchTerm, genreFilter, difficultyFilter])

  // Song Library View
  if (!songId) {
    const filteredSongs = songs.filter(song => {
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase()
        const matchesSearch = 
          song.title?.toLowerCase().includes(searchLower) ||
          song.artist?.toLowerCase().includes(searchLower) ||
          song.tags?.some(tag => tag.toLowerCase().includes(searchLower))
        if (!matchesSearch) return false
      }
      return true
    })

    const content = (
      <div className="responsive-container" style={{ 
        maxWidth: '1400px'
      }}>
        <h1 style={{
          fontSize: 'clamp(var(--font-size-xl), 5vw, var(--font-size-3xl))',
          fontWeight: 'var(--font-weight-bold)',
          marginBottom: 'var(--space-6)',
          color: 'var(--color-text-primary)'
        }}>
          Song Library
        </h1>

        {/* Filters */}
        <div className="responsive-grid-sm" style={{
          marginBottom: 'var(--space-6)',
          padding: 'var(--space-4)',
          background: 'var(--color-bg-secondary)',
          borderRadius: 'var(--radius-base)',
          border: '1px solid var(--color-border)'
        }}>
          <div>
            <label style={{ display: 'block', marginBottom: 'var(--space-2)', fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)' }}>
              Search
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Title, Artist..."
              style={{
                width: '100%',
                padding: 'var(--space-2) var(--space-3)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-base)',
                fontSize: 'var(--font-size-base)',
                background: 'var(--color-bg-primary)',
                color: 'var(--color-text-primary)'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 'var(--space-2)', fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)' }}>
              Genre
            </label>
            <select
              value={genreFilter}
              onChange={(e) => setGenreFilter(e.target.value)}
              style={{
                width: '100%',
                padding: 'var(--space-2) var(--space-3)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-base)',
                fontSize: 'var(--font-size-base)',
                background: 'var(--color-bg-primary)',
                color: 'var(--color-text-primary)'
              }}
            >
              <option value="">All Genres</option>
              {availableGenres.map(genre => (
                <option key={genre} value={genre}>{genre}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 'var(--space-2)', fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)' }}>
              Difficulty
            </label>
            <select
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value as SongDifficulty | '')}
              style={{
                width: '100%',
                padding: 'var(--space-2) var(--space-3)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-base)',
                fontSize: 'var(--font-size-base)',
                background: 'var(--color-bg-primary)',
                color: 'var(--color-text-primary)'
              }}
            >
              <option value="">All</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
              <option value="expert">Expert</option>
            </select>
          </div>
        </div>

        {/* Songs Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
            Loading songs...
          </div>
        ) : filteredSongs.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: 'var(--space-8)',
            background: 'var(--color-bg-secondary)',
            borderRadius: 'var(--radius-base)',
            border: '1px solid var(--color-border)'
          }}>
            <p style={{ color: 'var(--color-text-secondary)' }}>No songs found.</p>
          </div>
        ) : (
          <div className="responsive-grid">
            {filteredSongs.map((song) => (
              <div
                key={song.id}
                onClick={() => navigate(`/play/${song.id}`)}
                style={{
                  background: 'var(--color-bg-secondary)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--color-border)',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)'
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                {song.cover_art_url ? (
                  <img
                    src={song.cover_art_url}
                    alt={`${song.title} cover`}
                    style={{
                      width: '100%',
                      height: '200px',
                      objectFit: 'cover'
                    }}
                  />
                ) : (
                  <div style={{
                    width: '100%',
                    height: '200px',
                    background: 'var(--color-bg-tertiary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 'var(--font-size-4xl)',
                    color: 'var(--color-text-secondary)'
                  }}>
                    <i className="bi bi-music-note-beamed" />
                  </div>
                )}
                <div style={{ padding: 'var(--space-4)' }}>
                  <h3 style={{
                    margin: 0,
                    marginBottom: 'var(--space-2)',
                    fontSize: 'var(--font-size-lg)',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'var(--color-text-primary)'
                  }}>
                    {song.title}
                  </h3>
                  <p style={{
                    margin: 0,
                    marginBottom: 'var(--space-3)',
                    fontSize: 'var(--font-size-base)',
                    color: 'var(--color-text-secondary)'
                  }}>
                    {song.artist}
                  </p>
                  {song.difficulty && (
                    <span style={{
                      padding: 'var(--space-1) var(--space-2)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: 'var(--font-size-xs)',
                      background: song.difficulty === 'beginner' ? '#10b981' :
                                song.difficulty === 'intermediate' ? '#3b82f6' :
                                song.difficulty === 'advanced' ? '#f59e0b' : '#ef4444',
                      color: 'white'
                    }}>
                      {song.difficulty}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )

    // Use appropriate layout based on role
    if (userProfile?.role === 'admin' || userProfile?.role === 'author' || userProfile?.role === 'employee') {
      return <AdminLayout>{content}</AdminLayout>
    }
    
    if (userProfile?.role === 'teacher') {
      return <TeacherLayout>{content}</TeacherLayout>
    }
    
    if (userProfile?.role === 'student') {
      return <StudentLayout>{content}</StudentLayout>
    }

    // Fallback for unknown roles
    return (
      <div style={{
        minHeight: '100vh',
        background: 'var(--color-bg-primary)',
        color: 'var(--color-text-primary)'
      }}>
        {content}
      </div>
    )
  }

  // Song Detail View - Loading/Error State
  if (!currentSong) {
    const loadingContent = (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh'
      }}>
        {loading ? 'Loading...' : 'Song not found'}
      </div>
    )
    
    // Use appropriate layout based on role
    if (userProfile?.role === 'admin' || userProfile?.role === 'author' || userProfile?.role === 'employee') {
      return <AdminLayout>{loadingContent}</AdminLayout>
    }
    
    if (userProfile?.role === 'teacher') {
      return <TeacherLayout>{loadingContent}</TeacherLayout>
    }
    
    if (userProfile?.role === 'student') {
      return <StudentLayout>{loadingContent}</StudentLayout>
    }
    
    // Fallback
    return (
      <div style={{
        minHeight: '100vh',
        background: 'var(--color-bg-primary)',
        color: 'var(--color-text-primary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {loading ? 'Loading...' : 'Song not found'}
      </div>
    )
  }

  const detailContent = (
    <div className="responsive-container" style={{ 
      maxWidth: '1200px'
    }}>
      <button
        onClick={() => navigate('/play')}
        style={{
          marginBottom: 'var(--space-6)',
          padding: 'var(--space-2) var(--space-4)',
          background: 'var(--color-bg-tertiary)',
          color: 'var(--color-text-primary)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-base)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-2)'
        }}
      >
        <i className="bi bi-arrow-left" /> Back to Library
      </button>

      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '300px 1fr',
        gap: 'var(--space-8)',
        marginBottom: 'var(--space-8)'
      }}>
        {/* Cover Art */}
        <div>
          {currentSong.cover_art_url ? (
            <img
              src={currentSong.cover_art_url}
              alt={`${currentSong.title} cover`}
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
            fontSize: 'clamp(var(--font-size-xl), 5vw, var(--font-size-3xl))',
            fontWeight: 'var(--font-weight-bold)',
            marginBottom: 'var(--space-2)',
            color: 'var(--color-text-primary)'
          }}>
            {currentSong.title}
          </h1>
          <h2 style={{
            fontSize: 'clamp(var(--font-size-base), 3vw, var(--font-size-xl))',
            fontWeight: 'var(--font-weight-semibold)',
            marginBottom: 'var(--space-4)',
            color: 'var(--color-text-secondary)'
          }}>
            {currentSong.artist}
          </h2>

          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 'var(--space-3)',
            marginBottom: 'var(--space-6)'
          }}>
            {currentSong.genre && (
              <span style={{
                padding: 'var(--space-2) var(--space-4)',
                background: 'var(--color-bg-tertiary)',
                borderRadius: 'var(--radius-base)',
                fontSize: 'var(--font-size-sm)'
              }}>
                {currentSong.genre}
              </span>
            )}
            {currentSong.difficulty && (
              <span style={{
                padding: 'var(--space-2) var(--space-4)',
                borderRadius: 'var(--radius-base)',
                fontSize: 'var(--font-size-sm)',
                background: currentSong.difficulty === 'beginner' ? '#10b981' :
                          currentSong.difficulty === 'intermediate' ? '#3b82f6' :
                          currentSong.difficulty === 'advanced' ? '#f59e0b' : '#ef4444',
                color: 'white'
              }}>
                {currentSong.difficulty}
              </span>
            )}
            {currentSong.bpm && (
              <span style={{
                padding: 'var(--space-2) var(--space-4)',
                background: 'var(--color-bg-tertiary)',
                borderRadius: 'var(--radius-base)',
                fontSize: 'var(--font-size-sm)'
              }}>
                {currentSong.bpm} BPM
              </span>
            )}
            {currentSong.key && (
              <span style={{
                padding: 'var(--space-2) var(--space-4)',
                background: 'var(--color-bg-tertiary)',
                borderRadius: 'var(--radius-base)',
                fontSize: 'var(--font-size-sm)'
              }}>
                Key: {currentSong.key}
              </span>
            )}
          </div>

          {currentSong.description && (
            <p style={{
              marginBottom: 'var(--space-6)',
              lineHeight: '1.6',
              color: 'var(--color-text-secondary)'
            }}>
              {currentSong.description}
            </p>
          )}

          {currentSong.tags && currentSong.tags.length > 0 && (
            <div style={{ marginBottom: 'var(--space-6)' }}>
              <strong style={{ marginRight: 'var(--space-2)' }}>Tags:</strong>
              {currentSong.tags.map(tag => (
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
        background: 'var(--color-bg-secondary)',
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
        {currentSong.stems && currentSong.stems.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {currentSong.stems.map(stem => (
              <div
                key={stem.id}
                style={{
                  padding: 'var(--space-4)',
                  background: 'var(--color-bg-tertiary)',
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
                {stemUrls[stem.id] && (
                  <audio controls style={{ 
                    width: isMobile ? '100%' : '300px',
                    maxWidth: '100%'
                  }}>
                    <source src={stemUrls[stem.id]} type={stem.mime_type || 'audio/mpeg'} />
                    Your browser does not support the audio element.
                  </audio>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: 'var(--color-text-secondary)' }}>No stems available for this song.</p>
        )}
      </div>

      <div style={{
        marginTop: 'var(--space-6)',
        padding: 'var(--space-4)',
        background: 'var(--color-bg-secondary)',
        borderRadius: 'var(--radius-base)',
        border: '1px solid var(--color-border)',
        fontSize: 'var(--font-size-sm)',
        color: 'var(--color-text-secondary)',
        fontStyle: 'italic'
      }}>
        <p>Playback features (mute/unmute tracks, tempo control, looping, section markers, metronome) will be available in a future update.</p>
      </div>
    </div>
  )

  // Use appropriate layout based on role
  if (userProfile?.role === 'admin' || userProfile?.role === 'author' || userProfile?.role === 'employee') {
    return <AdminLayout>{detailContent}</AdminLayout>
  }
  
  if (userProfile?.role === 'teacher') {
    return <TeacherLayout>{detailContent}</TeacherLayout>
  }
  
  if (userProfile?.role === 'student') {
    return <StudentLayout>{detailContent}</StudentLayout>
  }

  // Fallback for unknown roles
  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--color-bg-primary)',
      color: 'var(--color-text-primary)'
    }}>
      {detailContent}
    </div>
  )
}

export default Play

