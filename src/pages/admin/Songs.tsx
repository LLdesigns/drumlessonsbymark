import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminLayout from '../../components/layout/AdminLayout'
import { useAuthStore } from '../../store/auth'
import { fetchSongs, deleteSong, updateSongStatus, getAvailableGenres } from '../../lib/song-service'
import { canManageSong } from '../../lib/permissions'
import type { Song, SongStatus, SongDifficulty } from '../../types/song'

const Songs = () => {
  const navigate = useNavigate()
  const { userProfile, user } = useAuthStore()
  const [songs, setSongs] = useState<Song[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | SongStatus>('all')
  const [genreFilter, setGenreFilter] = useState<string>('')
  const [difficultyFilter, setDifficultyFilter] = useState<SongDifficulty | ''>('')
  const [ownerFilter, setOwnerFilter] = useState<'all' | 'mine'>('all')
  const [availableGenres, setAvailableGenres] = useState<string[]>([])

  useEffect(() => {
    fetchSongList()
    fetchFilters()
  }, [])

  useEffect(() => {
    fetchSongList()
  }, [statusFilter, genreFilter, difficultyFilter, ownerFilter, searchTerm])

  const fetchFilters = async () => {
    try {
      const [genres] = await Promise.all([
        getAvailableGenres()
      ])
      setAvailableGenres(genres)
    } catch (error) {
      console.error('Error fetching filters:', error)
    }
  }

  const fetchSongList = async () => {
    try {
      setLoading(true)
      
      const { data } = await fetchSongs({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        genre: genreFilter || undefined,
        difficulty: difficultyFilter || undefined,
        search: searchTerm || undefined,
        createdBy: ownerFilter === 'mine' && user?.id ? user.id : undefined
      })

      setSongs(data || [])
    } catch (error) {
      console.error('Error fetching songs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (songId: string) => {
    if (!confirm('Are you sure you want to delete this song? This will also delete all stems.')) {
      return
    }

    try {
      await deleteSong(songId)
      fetchSongList()
    } catch (error) {
      console.error('Error deleting song:', error)
      alert('Failed to delete song')
    }
  }

  const handleToggleStatus = async (song: Song) => {
    const newStatus: SongStatus = song.status === 'draft' ? 'live' : 'draft'
    try {
      await updateSongStatus(song.id, newStatus)
      fetchSongList()
    } catch (error) {
      console.error('Error updating song status:', error)
      alert('Failed to update song status')
    }
  }

  const canManage = (song: Song) => {
    if (!userProfile?.role || !user?.id) return false
    return canManageSong(userProfile.role, song.created_by, user.id)
  }

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

  return (
    <AdminLayout>
      <div>
        {/* Header with Create button */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 'var(--space-6)'
        }}>
          <h2 style={{ margin: 0 }}>Song Management</h2>
          <button
            onClick={() => navigate('/admin/songs/create')}
            style={{
              padding: 'var(--space-3) var(--space-6)',
              background: 'var(--color-brand-primary)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--radius-base)',
              cursor: 'pointer',
              fontSize: 'var(--font-size-base)',
              fontWeight: 'var(--font-weight-semibold)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)'
            }}
          >
            <i className="bi bi-plus-circle" /> Create New Song
          </button>
        </div>

        {/* Filters */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 'var(--space-4)',
          marginBottom: 'var(--space-6)',
          padding: 'var(--space-4)',
          background: 'var(--color-bg-secondary)',
          borderRadius: 'var(--radius-base)',
          border: '1px solid var(--color-border)'
        }}>
          {/* Search */}
          <div>
            <label style={{
              display: 'block',
              marginBottom: 'var(--space-2)',
              fontSize: 'var(--font-size-sm)',
              fontWeight: 'var(--font-weight-semibold)'
            }}>
              Search
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Title, Artist, Tags..."
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

          {/* Status Filter */}
          <div>
            <label style={{
              display: 'block',
              marginBottom: 'var(--space-2)',
              fontSize: 'var(--font-size-sm)',
              fontWeight: 'var(--font-weight-semibold)'
            }}>
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | SongStatus)}
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
              <option value="all">All</option>
              <option value="draft">Draft</option>
              <option value="live">Live</option>
            </select>
          </div>

          {/* Genre Filter */}
          <div>
            <label style={{
              display: 'block',
              marginBottom: 'var(--space-2)',
              fontSize: 'var(--font-size-sm)',
              fontWeight: 'var(--font-weight-semibold)'
            }}>
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

          {/* Difficulty Filter */}
          <div>
            <label style={{
              display: 'block',
              marginBottom: 'var(--space-2)',
              fontSize: 'var(--font-size-sm)',
              fontWeight: 'var(--font-weight-semibold)'
            }}>
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

          {/* Owner Filter (for employees) */}
          {(userProfile?.role === 'employee' || userProfile?.role === 'admin') && (
            <div>
              <label style={{
                display: 'block',
                marginBottom: 'var(--space-2)',
                fontSize: 'var(--font-size-sm)',
                fontWeight: 'var(--font-weight-semibold)'
              }}>
                Owner
              </label>
              <select
                value={ownerFilter}
                onChange={(e) => setOwnerFilter(e.target.value as 'all' | 'mine')}
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
                <option value="all">All Songs</option>
                <option value="mine">My Songs</option>
              </select>
            </div>
          )}
        </div>

        {/* Songs Table */}
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
            <button
              onClick={() => navigate('/admin/songs/create')}
              style={{
                marginTop: 'var(--space-4)',
                padding: 'var(--space-3) var(--space-6)',
                background: 'var(--color-brand-primary)',
                color: 'white',
                border: 'none',
                borderRadius: 'var(--radius-base)',
                cursor: 'pointer'
              }}
            >
              Create Your First Song
            </button>
          </div>
        ) : (
          <div style={{
            overflowX: 'auto',
            background: 'var(--color-bg-secondary)',
            borderRadius: 'var(--radius-base)',
            border: '1px solid var(--color-border)'
          }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse'
            }}>
              <thead>
                <tr style={{
                  borderBottom: '2px solid var(--color-border)',
                  background: 'var(--color-bg-tertiary)'
                }}>
                  <th style={{ padding: 'var(--space-4)', textAlign: 'left' }}>Title</th>
                  <th style={{ padding: 'var(--space-4)', textAlign: 'left' }}>Artist</th>
                  <th style={{ padding: 'var(--space-4)', textAlign: 'left' }}>Genre</th>
                  <th style={{ padding: 'var(--space-4)', textAlign: 'left' }}>Difficulty</th>
                  <th style={{ padding: 'var(--space-4)', textAlign: 'left' }}>Stems</th>
                  <th style={{ padding: 'var(--space-4)', textAlign: 'left' }}>Status</th>
                  <th style={{ padding: 'var(--space-4)', textAlign: 'left' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSongs.map((song) => (
                  <tr
                    key={song.id}
                    style={{
                      borderBottom: '1px solid var(--color-border)',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--color-bg-tertiary)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent'
                    }}
                  >
                    <td style={{ padding: 'var(--space-4)' }}>{song.title}</td>
                    <td style={{ padding: 'var(--space-4)' }}>{song.artist}</td>
                    <td style={{ padding: 'var(--space-4)' }}>{song.genre || '-'}</td>
                    <td style={{ padding: 'var(--space-4)' }}>
                      {song.difficulty ? (
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
                      ) : '-'}
                    </td>
                    <td style={{ padding: 'var(--space-4)' }}>
                      {song.stems?.length || 0}
                    </td>
                    <td style={{ padding: 'var(--space-4)' }}>
                      <span style={{
                        padding: 'var(--space-1) var(--space-2)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: 'var(--font-size-xs)',
                        background: song.status === 'live' ? '#10b981' : '#6b7280',
                        color: 'white'
                      }}>
                        {song.status}
                      </span>
                    </td>
                    <td style={{ padding: 'var(--space-4)' }}>
                      <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                        {canManage(song) && (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                navigate(`/admin/songs/author?id=${song.id}`)
                              }}
                              style={{
                                padding: 'var(--space-2)',
                                background: 'transparent',
                                border: '1px solid var(--color-border)',
                                borderRadius: 'var(--radius-sm)',
                                cursor: 'pointer',
                                color: 'var(--color-text-primary)'
                              }}
                              title="Edit"
                            >
                              <i className="bi bi-pencil" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleToggleStatus(song)
                              }}
                              style={{
                                padding: 'var(--space-2)',
                                background: 'transparent',
                                border: '1px solid var(--color-border)',
                                borderRadius: 'var(--radius-sm)',
                                cursor: 'pointer',
                                color: song.status === 'draft' ? '#10b981' : '#f59e0b'
                              }}
                              title={song.status === 'draft' ? 'Publish' : 'Unpublish'}
                            >
                              <i className={`bi bi-${song.status === 'draft' ? 'eye' : 'eye-slash'}`} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDelete(song.id)
                              }}
                              style={{
                                padding: 'var(--space-2)',
                                background: 'transparent',
                                border: '1px solid var(--color-border)',
                                borderRadius: 'var(--radius-sm)',
                                cursor: 'pointer',
                                color: 'var(--color-error)'
                              }}
                              title="Delete"
                            >
                              <i className="bi bi-trash" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

export default Songs

