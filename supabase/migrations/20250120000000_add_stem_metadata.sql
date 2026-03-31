-- Add metadata fields to song_stems table
-- This allows each stem to have solo, mute, volume, and other metadata

ALTER TABLE song_stems 
ADD COLUMN IF NOT EXISTS is_solo BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_muted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS volume DECIMAL(3,2) DEFAULT 1.0 CHECK (volume >= 0 AND volume <= 1),
ADD COLUMN IF NOT EXISTS pan DECIMAL(3,2) DEFAULT 0.0 CHECK (pan >= -1 AND pan <= 1),
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Add index for metadata queries
CREATE INDEX IF NOT EXISTS idx_song_stems_metadata ON song_stems USING gin(metadata);

-- Add comment
COMMENT ON COLUMN song_stems.is_solo IS 'Whether this stem is soloed (only this stem plays)';
COMMENT ON COLUMN song_stems.is_muted IS 'Whether this stem is muted';
COMMENT ON COLUMN song_stems.volume IS 'Volume level from 0.0 to 1.0';
COMMENT ON COLUMN song_stems.pan IS 'Pan position from -1.0 (left) to 1.0 (right)';
COMMENT ON COLUMN song_stems.metadata IS 'Additional metadata as JSON (e.g., effects, EQ settings, etc.)';

