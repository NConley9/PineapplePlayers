import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(__dirname, '..', '..', 'pineapple.db');

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initializeSchema(db);
  }
  return db;
}

function initializeSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS players (
      player_id TEXT PRIMARY KEY,
      display_name TEXT NOT NULL,
      photo_url TEXT,
      email TEXT UNIQUE,
      password_hash TEXT,
      auth_provider TEXT NOT NULL DEFAULT 'guest',
      device_token TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
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
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      ended_at TEXT
    );

    CREATE TABLE IF NOT EXISTS cards (
      card_id INTEGER PRIMARY KEY AUTOINCREMENT,
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
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS room_players (
      room_id TEXT NOT NULL REFERENCES rooms(room_id),
      player_id TEXT NOT NULL REFERENCES players(player_id),
      display_name TEXT NOT NULL,
      photo_url TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      is_kicked INTEGER NOT NULL DEFAULT 0,
      kick_count INTEGER NOT NULL DEFAULT 0,
      joined_at TEXT NOT NULL DEFAULT (datetime('now')),
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
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      resolved_at TEXT
    );

    CREATE TABLE IF NOT EXISTS card_suggestions (
      suggestion_id TEXT PRIMARY KEY,
      player_id TEXT REFERENCES players(player_id),
      card_type TEXT NOT NULL,
      card_text TEXT NOT NULL,
      expansion TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'new',
      reviewed_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_rooms_code ON rooms(room_code);
    CREATE INDEX IF NOT EXISTS idx_rooms_status ON rooms(status);
    CREATE INDEX IF NOT EXISTS idx_room_players_room ON room_players(room_id);
    CREATE INDEX IF NOT EXISTS idx_turn_logs_room ON turn_logs(room_id);
    CREATE INDEX IF NOT EXISTS idx_cards_expansion ON cards(expansion);
  `);
}

export default getDb;
