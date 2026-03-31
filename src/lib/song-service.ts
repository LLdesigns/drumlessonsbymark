import { supabase } from './supabase'
import type { Song, SongStem, SongFormData, StemUpload, SongStatus, SongDifficulty } from '../types/song'

/**
 * Fetch all songs with optional filters
 */
export async function fetchSongs(options: {
  status?: SongStatus
  genre?: string
  difficulty?: SongDifficulty
  search?: string
  createdBy?: string
  limit?: number
  offset?: number
} = {}) {
  let query = supabase
    .from('songs')
    .select(`
      *,
      stems:song_stems(*)
    `, { count: 'exact' })
    .order('created_at', { ascending: false })

  if (options.status) {
    query = query.eq('status', options.status)
  }

  if (options.genre) {
    query = query.eq('genre', options.genre)
  }

  if (options.difficulty) {
    query = query.eq('difficulty', options.difficulty)
  }

  if (options.search) {
    query = query.or(`title.ilike.%${options.search}%,artist.ilike.%${options.search}%`)
  }

  if (options.createdBy) {
    query = query.eq('created_by', options.createdBy)
  }

  if (options.limit) {
    query = query.limit(options.limit)
  }

  if (options.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 50) - 1)
  }

  const { data, error, count } = await query

  if (error) throw error

  return { data: data as Song[], count: count || 0 }
}

/**
 * Fetch a single song by ID with stems
 */
export async function fetchSongById(songId: string): Promise<Song | null> {
  const { data, error } = await supabase
    .from('songs')
    .select(`
      *,
      stems:song_stems(*)
    `)
    .eq('id', songId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }

  // Sort stems by order_index
  if (data.stems) {
    data.stems.sort((a: SongStem, b: SongStem) => (a.order_index || 0) - (b.order_index || 0))
  }

  return data as Song
}

/**
 * Create a new song
 */
export async function createSong(songData: SongFormData, userId: string): Promise<Song> {
  const { data, error } = await supabase
    .from('songs')
    .insert({
      title: songData.title,
      artist: songData.artist,
      genre: songData.genre || null,
      difficulty: songData.difficulty || null,
      bpm: songData.bpm || null,
      key: songData.key || null,
      description: songData.description || null,
      tags: songData.tags || null,
      cover_art_url: songData.cover_art_url || null,
      cover_art_storage_path: songData.cover_art_storage_path || null,
      status: 'draft',
      created_by: userId
    })
    .select()
    .single()

  if (error) throw error

  return data as Song
}

/**
 * Update an existing song
 */
export async function updateSong(songId: string, songData: Partial<SongFormData & { status?: SongStatus }>): Promise<Song> {
  const updateData: any = {}

  if (songData.title !== undefined) updateData.title = songData.title
  if (songData.artist !== undefined) updateData.artist = songData.artist
  if (songData.genre !== undefined) updateData.genre = songData.genre || null
  if (songData.difficulty !== undefined) updateData.difficulty = songData.difficulty || null
  if (songData.bpm !== undefined) updateData.bpm = songData.bpm || null
  if (songData.key !== undefined) updateData.key = songData.key || null
  if (songData.description !== undefined) updateData.description = songData.description || null
  if (songData.tags !== undefined) updateData.tags = songData.tags || null
  if (songData.cover_art_url !== undefined) updateData.cover_art_url = songData.cover_art_url || null
  if (songData.cover_art_storage_path !== undefined) updateData.cover_art_storage_path = songData.cover_art_storage_path || null
  if (songData.status !== undefined) updateData.status = songData.status

  const { data, error } = await supabase
    .from('songs')
    .update(updateData)
    .eq('id', songId)
    .select()
    .single()

  if (error) throw error

  return data as Song
}

/**
 * Update song status (publish/unpublish)
 */
export async function updateSongStatus(songId: string, status: SongStatus): Promise<Song> {
  const { data, error } = await supabase
    .from('songs')
    .update({ status })
    .eq('id', songId)
    .select()
    .single()

  if (error) throw error

  return data as Song
}

/**
 * Delete a song and all its stems
 */
export async function deleteSong(songId: string): Promise<void> {
  // Delete stems first (CASCADE will handle this, but explicit is better)
  const { error: stemsError } = await supabase
    .from('song_stems')
    .delete()
    .eq('song_id', songId)

  if (stemsError) throw stemsError

  // Delete song
  const { error } = await supabase
    .from('songs')
    .delete()
    .eq('id', songId)

  if (error) throw error
}

/**
 * Upload a stem file to Supabase storage
 */
export async function uploadStem(songId: string, stem: StemUpload): Promise<string> {
  if (!stem.instrument || !stem.instrument.trim()) {
    throw new Error('Instrument is required for stem upload')
  }

  const fileExt = stem.file.name.split('.').pop()
  const instrument = stem.instrument.trim().toLowerCase().replace(/[^a-z0-9]/g, '-')
  const fileName = `${instrument}-${Date.now()}.${fileExt}`
  const filePath = `${songId}/${fileName}`

  const { error: uploadError } = await supabase.storage
    .from('song-stems')
    .upload(filePath, stem.file, {
      cacheControl: '3600',
      upsert: false
    })

  if (uploadError) {
    console.error('Stem upload error:', uploadError)
    throw new Error(`Failed to upload stem: ${uploadError.message}`)
  }

  return filePath
}

/**
 * Upload cover art to Supabase storage
 */
export async function uploadCoverArt(songId: string, file: File): Promise<string> {
  const fileExt = file.name.split('.').pop()
  const fileName = `cover-${Date.now()}.${fileExt}`
  const filePath = `${songId}/${fileName}`

  const { error: uploadError } = await supabase.storage
    .from('song-covers')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    })

  if (uploadError) throw uploadError

  // Get public URL for cover art
  const { data } = supabase.storage
    .from('song-covers')
    .getPublicUrl(filePath)

  return data.publicUrl
}

/**
 * Create a song stem record
 */
export async function createSongStem(songId: string, stem: {
  instrument: string
  storage_path: string
  file_name: string
  file_size?: number
  mime_type?: string
  order_index?: number
}): Promise<SongStem> {
  const { data, error } = await supabase
    .from('song_stems')
    .insert({
      song_id: songId,
      instrument: stem.instrument,
      storage_path: stem.storage_path,
      file_name: stem.file_name,
      file_size: stem.file_size || null,
      mime_type: stem.mime_type || null,
      order_index: stem.order_index || 0
    })
    .select()
    .single()

  if (error) throw error

  return data as SongStem
}

/**
 * Delete a song stem record and file
 */
export async function deleteSongStem(stemId: string, storagePath: string): Promise<void> {
  // Delete file from storage
  const { error: storageError } = await supabase.storage
    .from('song-stems')
    .remove([storagePath])

  if (storageError) throw storageError

  // Delete record
  const { error } = await supabase
    .from('song_stems')
    .delete()
    .eq('id', stemId)

  if (error) throw error
}

/**
 * Get a signed URL for a stem file (for private bucket)
 */
export async function getStemSignedUrl(storagePath: string, expiresIn: number = 3600): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from('song-stems')
    .createSignedUrl(storagePath, expiresIn)

  if (error) {
    console.error('Error creating signed URL:', error)
    return null
  }

  return data.signedUrl
}

/**
 * Update stem metadata (solo, mute, volume, pan, etc.)
 */
export async function updateStemMetadata(stemId: string, metadata: {
  is_solo?: boolean
  is_muted?: boolean
  volume?: number
  pan?: number
  order_index?: number
  metadata?: Record<string, any>
}): Promise<SongStem> {
  const { data, error } = await supabase
    .from('song_stems')
    .update(metadata)
    .eq('id', stemId)
    .select()
    .single()

  if (error) throw error

  return data as SongStem
}

/**
 * Update order_index for multiple stems at once
 */
export async function updateStemOrder(songId: string, stemOrders: { stemId: string; order_index: number }[]): Promise<void> {
  // Update all stems in a transaction-like manner
  const updates = stemOrders.map(({ stemId, order_index }) =>
    supabase
      .from('song_stems')
      .update({ order_index })
      .eq('id', stemId)
      .eq('song_id', songId)
  )

  const results = await Promise.all(updates)
  
  // Check for errors
  for (const result of results) {
    if (result.error) {
      throw result.error
    }
  }
}

/**
 * Get available genres from existing songs
 */
export async function getAvailableGenres(): Promise<string[]> {
  const { data, error } = await supabase
    .from('songs')
    .select('genre')
    .not('genre', 'is', null)

  if (error) throw error

  const genres = [...new Set(data.map(s => s.genre).filter(Boolean) as string[])]
  return genres.sort()
}

/**
 * Get available tags from existing songs
 */
export async function getAvailableTags(): Promise<string[]> {
  const { data, error } = await supabase
    .from('songs')
    .select('tags')
    .not('tags', 'is', null)

  if (error) throw error

  const allTags = data
    .flatMap(s => s.tags || [])
    .filter(Boolean)

  return [...new Set(allTags)].sort()
}

