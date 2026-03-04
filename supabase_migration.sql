-- 1. Create transcriptions table (Global cache)
CREATE TABLE transcriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  song_title TEXT NOT NULL,
  artist TEXT NOT NULL,
  result JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(song_title, artist)
);

-- 2. Create device_history table (Isolated history)
CREATE TABLE device_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID NOT NULL,
  transcription_id UUID REFERENCES transcriptions(id) ON DELETE CASCADE,
  is_hidden BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(device_id, transcription_id)
);

-- 3. Add indexes for performance
CREATE INDEX idx_transcriptions_lookup ON transcriptions (song_title, artist);
CREATE INDEX idx_device_history_lookup ON device_history (device_id, is_hidden, created_at DESC);

-- 4. Disable RLS (Row Level Security) for convenience in this dev app
-- If RLS is enabled without policies, all selects/inserts will fail.
ALTER TABLE transcriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE device_history DISABLE ROW LEVEL SECURITY;
