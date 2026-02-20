import { Pool, PoolClient } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

pool.on('error', (err: Error) => {
  console.error('Unexpected error on idle client', err);
});

export async function getDb(): Promise<PoolClient> {
  return pool.connect();
}

export async function query(text: string, params?: any[]) {
  const client = await pool.connect();
  try {
    return await client.query(text, params);
  } finally {
    client.release();
  }
}

export async function initializeDatabase(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS players (
        player_id TEXT PRIMARY KEY,
        display_name TEXT NOT NULL,
        photo_url TEXT,
        email TEXT UNIQUE,
        password_hash TEXT,
        auth_provider TEXT NOT NULL DEFAULT 'guest',
        device_token TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS rooms (
        room_id TEXT PRIMARY KEY,
        room_code TEXT NOT NULL UNIQUE,
        host_player_id TEXT NOT NULL REFERENCES players(player_id),
        status TEXT NOT NULL DEFAULT 'lobby',
        expansions TEXT NOT NULL DEFAULT '["core"]',
        current_turn_player_id TEXT REFERENCES players(player_id),
        turn_order TEXT NOT NULL DEFAULT '[]',
        turn_number INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        ended_at TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS cards (
        card_id SERIAL PRIMARY KEY,
        card_type TEXT NOT NULL,
        card_text TEXT NOT NULL,
        expansion TEXT NOT NULL DEFAULT 'core',
        is_active INTEGER NOT NULL DEFAULT 1
      );

      CREATE TABLE IF NOT EXISTS game_decks (
        room_id TEXT PRIMARY KEY REFERENCES rooms(room_id),
        draw_pile TEXT NOT NULL DEFAULT '[]',
        discard_pile TEXT NOT NULL DEFAULT '[]'
      );

      CREATE TABLE IF NOT EXISTS turn_logs (
        log_id TEXT PRIMARY KEY,
        room_id TEXT NOT NULL REFERENCES rooms(room_id),
        player_id TEXT NOT NULL REFERENCES players(player_id),
        card_drawn_1 INTEGER REFERENCES cards(card_id),
        card_drawn_2 INTEGER REFERENCES cards(card_id),
        card_selected INTEGER REFERENCES cards(card_id),
        outcome TEXT,
        turn_number INTEGER NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS room_players (
        room_id TEXT NOT NULL REFERENCES rooms(room_id),
        player_id TEXT NOT NULL REFERENCES players(player_id),
        display_name TEXT NOT NULL,
        photo_url TEXT,
        is_active INTEGER NOT NULL DEFAULT 1,
        is_kicked INTEGER NOT NULL DEFAULT 0,
        kick_count INTEGER NOT NULL DEFAULT 0,
        joined_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (room_id, player_id)
      );

      CREATE TABLE IF NOT EXISTS kick_votes (
        vote_id TEXT PRIMARY KEY,
        room_id TEXT NOT NULL REFERENCES rooms(room_id),
        target_player_id TEXT NOT NULL REFERENCES players(player_id),
        initiated_by TEXT NOT NULL REFERENCES players(player_id),
        votes_for INTEGER NOT NULL DEFAULT 0,
        votes_against INTEGER NOT NULL DEFAULT 0,
        voters TEXT NOT NULL DEFAULT '{}',
        status TEXT NOT NULL DEFAULT 'pending',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        resolved_at TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS card_suggestions (
        suggestion_id TEXT PRIMARY KEY,
        player_id TEXT REFERENCES players(player_id),
        card_type TEXT NOT NULL,
        card_text TEXT NOT NULL,
        expansion TEXT DEFAULT '',
        status TEXT NOT NULL DEFAULT 'new',
        reviewed_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_rooms_code ON rooms(room_code);
      CREATE INDEX IF NOT EXISTS idx_rooms_status ON rooms(status);
      CREATE INDEX IF NOT EXISTS idx_room_players_room ON room_players(room_id);
      CREATE INDEX IF NOT EXISTS idx_turn_logs_room ON turn_logs(room_id);
      CREATE INDEX IF NOT EXISTS idx_cards_expansion ON cards(expansion);
    `);
    console.log('Database schema initialized');
  } finally {
    client.release();
  }
}

export default { query, getDb, initializeDatabase };
