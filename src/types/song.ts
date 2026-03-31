// Song and related types

export type SongStatus = 'draft' | 'live'
export type SongDifficulty = 'beginner' | 'intermediate' | 'advanced' | 'expert'

export interface Song {
  id: string
  title: string
  artist: string
  genre?: string | null
  difficulty?: SongDifficulty | null
  bpm?: number | null
  key?: string | null
  description?: string | null
  tags?: string[] | null
  cover_art_url?: string | null
  cover_art_storage_path?: string | null
  status: SongStatus
  created_by: string
  created_at: string
  updated_at: string
  // Joined data
  stems?: SongStem[]
  creator_profile?: {
    first_name?: string | null
    last_name?: string | null
    email?: string | null
  }
}

export interface SongStem {
  id: string
  song_id: string
  instrument: string // e.g., 'vocals', 'drums', 'bass', 'guitar', 'keys', etc.
  storage_path: string
  file_name: string
  file_size?: number | null
  mime_type?: string | null
  order_index: number
  is_solo?: boolean | null
  is_muted?: boolean | null
  volume?: number | null
  pan?: number | null
  metadata?: Record<string, any> | null
  created_at: string
  updated_at: string
}

export interface SongFormData {
  title: string
  artist: string
  genre?: string
  difficulty?: SongDifficulty
  bpm?: number
  key?: string
  description?: string
  tags?: string[]
  cover_art_file?: File
  cover_art_url?: string
  cover_art_storage_path?: string
}

export interface StemUpload {
  id?: string // Temporary ID for new stems
  instrument: string
  file: File
  storage_path?: string // Set after upload
  order_index?: number
}

