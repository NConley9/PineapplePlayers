import { Pool } from 'pg';

type TableConfig = {
  table: string;
  columns: string[];
};

const schemaSql = `
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
`;

const tableConfigs: TableConfig[] = [
  {
    table: 'players',
    columns: ['player_id', 'display_name', 'photo_url', 'email', 'password_hash', 'auth_provider', 'device_token', 'created_at'],
  },
  {
    table: 'cards',
    columns: ['card_id', 'card_type', 'card_text', 'expansion', 'is_active'],
  },
  {
    table: 'rooms',
    columns: [
      'room_id',
      'room_code',
      'host_player_id',
      'status',
      'expansions',
      'current_turn_player_id',
      'turn_order',
      'turn_number',
      'created_at',
      'ended_at',
    ],
  },
  {
    table: 'game_decks',
    columns: ['room_id', 'draw_pile', 'discard_pile'],
  },
  {
    table: 'room_players',
    columns: ['room_id', 'player_id', 'display_name', 'photo_url', 'is_active', 'is_kicked', 'kick_count', 'joined_at'],
  },
  {
    table: 'turn_logs',
    columns: [
      'log_id',
      'room_id',
      'player_id',
      'card_drawn_1',
      'card_drawn_2',
      'card_selected',
      'outcome',
      'turn_number',
      'created_at',
    ],
  },
  {
    table: 'kick_votes',
    columns: [
      'vote_id',
      'room_id',
      'target_player_id',
      'initiated_by',
      'votes_for',
      'votes_against',
      'voters',
      'status',
      'created_at',
      'resolved_at',
    ],
  },
  {
    table: 'card_suggestions',
    columns: ['suggestion_id', 'player_id', 'card_type', 'card_text', 'expansion', 'status', 'reviewed_at', 'created_at'],
  },
];

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

async function copyTable(
  sourcePool: Pool,
  targetPool: Pool,
  table: string,
  columns: string[],
): Promise<{ sourceCount: number; targetCount: number }> {
  const sourceRows = await sourcePool.query(`SELECT ${columns.join(', ')} FROM ${table}`);
  const rows = sourceRows.rows;

  if (rows.length > 0) {
    const rowChunks = chunk(rows, 500);
    for (const rowChunk of rowChunks) {
      const values: unknown[] = [];
      const valueGroups: string[] = [];

      rowChunk.forEach((row, rowIndex) => {
        const placeholders: string[] = [];
        columns.forEach((column, columnIndex) => {
          values.push(row[column]);
          placeholders.push(`$${rowIndex * columns.length + columnIndex + 1}`);
        });
        valueGroups.push(`(${placeholders.join(', ')})`);
      });

      const insertSql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES ${valueGroups.join(', ')}`;
      await targetPool.query(insertSql, values);
    }
  }

  const targetCountResult = await targetPool.query(`SELECT COUNT(*)::int AS count FROM ${table}`);

  return {
    sourceCount: rows.length,
    targetCount: targetCountResult.rows[0].count,
  };
}

async function main() {
  const sourceDatabaseUrl = process.env.SOURCE_DATABASE_URL;
  const targetDatabaseUrl = process.env.TARGET_DATABASE_URL;

  if (!sourceDatabaseUrl || !targetDatabaseUrl) {
    throw new Error('Set SOURCE_DATABASE_URL and TARGET_DATABASE_URL environment variables.');
  }

  const sourcePool = new Pool({
    connectionString: sourceDatabaseUrl,
    ssl: { rejectUnauthorized: false },
  });

  const targetPool = new Pool({
    connectionString: targetDatabaseUrl,
    ssl: { rejectUnauthorized: false },
  });

  try {
    console.log('Ensuring target schema exists...');
    await targetPool.query(schemaSql);

    console.log('Clearing target tables...');
    await targetPool.query(`
      TRUNCATE TABLE
        card_suggestions,
        kick_votes,
        turn_logs,
        room_players,
        game_decks,
        rooms,
        cards,
        players
      RESTART IDENTITY CASCADE;
    `);

    console.log('Copying rows...');
    for (const config of tableConfigs) {
      const result = await copyTable(sourcePool, targetPool, config.table, config.columns);
      const status = result.sourceCount === result.targetCount ? 'OK' : 'MISMATCH';
      console.log(
        `${config.table.padEnd(20)} source=${String(result.sourceCount).padEnd(6)} target=${String(result.targetCount).padEnd(6)} ${status}`,
      );
    }

    console.log('Fixing cards sequence...');
    await targetPool.query(`
      SELECT setval(
        pg_get_serial_sequence('cards', 'card_id'),
        COALESCE((SELECT MAX(card_id) FROM cards), 1),
        (SELECT COUNT(*) > 0 FROM cards)
      );
    `);

    console.log('Migration completed successfully.');
  } finally {
    await sourcePool.end();
    await targetPool.end();
  }
}

main().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});
