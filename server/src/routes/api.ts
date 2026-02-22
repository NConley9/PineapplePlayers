import { Router } from 'express';
import type { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuid } from 'uuid';
import {
  createRoom,
  findRoomByCode,
  createOrGetPlayer,
  addPlayerToRoom,
  createSuggestion,
  getPlayerGameHistory,
  getGameDetail,
  getRoom,
  getRoomPlayers,
  getActivePlayers,
  updateExpansions,
  getTurnLogs,
  getAnalyticsSummary,
} from '../game/logic';
import { sendSuggestionEmail } from '../services/email';
import { query } from '../db/database';

export const apiRouter = Router();

// ---- File Upload ----

const storage = multer.diskStorage({
  destination: path.join(__dirname, '..', '..', 'uploads'),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuid()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    cb(null, allowed.includes(file.mimetype));
  },
});

const csvUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['text/csv', 'application/csv', 'application/vnd.ms-excel', 'text/plain'];
    cb(null, allowed.includes(file.mimetype));
  },
});

const VALID_CARD_TYPES = new Set(['truth', 'dare', 'challenge', 'group']);
const VALID_EXPANSIONS = new Set(['core', 'vanilla', 'pineapple']);

function parseCsvRows(input: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;

  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    const next = input[i + 1];

    if (ch === '"') {
      if (inQuotes && next === '"') {
        cell += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (!inQuotes && ch === ',') {
      row.push(cell.trim());
      cell = '';
      continue;
    }

    if (!inQuotes && (ch === '\n' || ch === '\r')) {
      if (ch === '\r' && next === '\n') i++;
      row.push(cell.trim());
      if (row.length > 1 || row[0] !== '') rows.push(row);
      row = [];
      cell = '';
      continue;
    }

    cell += ch;
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell.trim());
    if (row.length > 1 || row[0] !== '') rows.push(row);
  }

  return rows;
}

function csvEscape(value: unknown): string {
  const raw = `${value ?? ''}`;
  if (raw.includes('"') || raw.includes(',') || raw.includes('\n') || raw.includes('\r')) {
    return `"${raw.replace(/"/g, '""')}"`;
  }
  return raw;
}

function normalizeHeader(header: string): string {
  return header.toLowerCase().trim().replace(/\s+/g, '_');
}

function normalizeCardType(cardType: string): string {
  return cardType.toLowerCase().trim();
}

function normalizeExpansion(expansion: string): string {
  return expansion.toLowerCase().trim();
}

// ---- Routes ----

// POST /api/rooms - Create a new room
apiRouter.post('/rooms', async (req: Request, res: Response) => {
  try {
    const { host_display_name, host_photo_url, expansions, player_id } = req.body;

    if (!host_display_name) {
      res.status(400).json({ error: 'Display name is required' });
      return;
    }

    const player = await createOrGetPlayer(player_id, host_display_name, host_photo_url);
    const room = await createRoom(player.player_id, expansions || ['core']);
    await addPlayerToRoom(room.room_id, player.player_id, host_display_name, host_photo_url);

    res.json({
      room: await getRoom(room.room_id),
      player,
      room_code: room.room_code,
    });
  } catch (err: any) {
    console.error('Error creating room:', err);
    res.status(500).json({ error: 'Failed to create room' });
  }
});

// POST /api/rooms/join - Join an existing room
apiRouter.post('/rooms/join', async (req: Request, res: Response) => {
  try {
    const { room_code, display_name, photo_url, player_id } = req.body;

    if (!room_code || !display_name) {
      res.status(400).json({ error: 'Room code and display name are required' });
      return;
    }

    const room = await findRoomByCode(room_code.toUpperCase());
    if (!room) {
      res.status(404).json({ error: 'Room not found. Check the code and try again.' });
      return;
    }
    if (room.status === 'ended') {
      res.status(400).json({ error: 'This game has ended.' });
      return;
    }

    // Check player limit
    const active = await getActivePlayers(room.room_id);
    if (active.length >= 16) {
      res.status(400).json({ error: 'This room is full. Maximum 16 players.' });
      return;
    }

    const player = await createOrGetPlayer(player_id, display_name, photo_url);
    const result = await addPlayerToRoom(room.room_id, player.player_id, display_name, photo_url);

    if ('error' in result) {
      res.status(403).json({ error: result.error });
      return;
    }

    res.json({
      room: await getRoom(room.room_id),
      player,
      players: await getRoomPlayers(room.room_id),
    });
  } catch (err: any) {
    console.error('Error joining room:', err);
    res.status(500).json({ error: 'Failed to join room' });
  }
});

// GET /api/rooms/:roomId - Get room state
apiRouter.get('/rooms/:roomId', async (req: Request, res: Response) => {
  try {
    const roomId = req.params.roomId as string;
    const room = await getRoom(roomId);
    if (!room) {
      res.status(404).json({ error: 'Room not found' });
      return;
    }

    const players = await getRoomPlayers(roomId);
    const turnLog = await getTurnLogs(roomId);

    res.json({ room, players, turn_log: turnLog });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to get room' });
  }
});

// PUT /api/rooms/:roomId/expansions - Update expansions (lobby only)
apiRouter.put('/rooms/:roomId/expansions', async (req: Request, res: Response) => {
  try {
    const { player_id, expansions } = req.body;
    const success = await updateExpansions(req.params.roomId as string, player_id, expansions);
    if (!success) {
      res.status(403).json({ error: 'Only the host can change expansions in the lobby' });
      return;
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update expansions' });
  }
});

// POST /api/upload/photo - Upload a player photo
apiRouter.post('/upload/photo', upload.single('photo'), (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded or invalid file type' });
      return;
    }
    const photoUrl = `/uploads/${req.file.filename}`;
    res.json({ photo_url: photoUrl });
  } catch (err: any) {
    res.status(500).json({ error: 'Upload failed' });
  }
});

// POST /api/suggestions - Submit a card suggestion
apiRouter.post('/suggestions', async (req: Request, res: Response) => {
  try {
    const { player_id, card_type, card_text, expansion } = req.body;

    if (!card_type || !card_text || card_text.length < 10) {
      res.status(400).json({ error: 'Card type and text (min 10 chars) are required' });
      return;
    }

    const id = await createSuggestion(player_id || null, card_type, card_text, expansion || '');

    // Fire-and-forget email
    sendSuggestionEmail(card_type, card_text, expansion).catch(err => {
      console.error('Failed to send suggestion email:', err);
    });

    res.json({ suggestion_id: id, success: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to submit suggestion' });
  }
});

// GET /api/players/:playerId/history - Game history for a player
apiRouter.get('/players/:playerId/history', async (req: Request, res: Response) => {
  try {
    const history = await getPlayerGameHistory(req.params.playerId as string);
    res.json({ games: history });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to get game history' });
  }
});

// GET /api/players/:playerId - Get player profile
apiRouter.get('/players/:playerId', async (req: Request, res: Response) => {
  try {
    const result = await query(
      'SELECT player_id, display_name, photo_url, email, auth_provider, created_at FROM players WHERE player_id = $1',
      [req.params.playerId as string]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Player not found' });
      return;
    }
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to get player' });
  }
});

// PUT /api/players/:playerId - Update player profile
apiRouter.put('/players/:playerId', async (req: Request, res: Response) => {
  try {
    const { display_name, photo_url } = req.body;
    const playerId = req.params.playerId as string;
    await query(
      'UPDATE players SET display_name = COALESCE($1, display_name), photo_url = COALESCE($2, photo_url) WHERE player_id = $3',
      [display_name || null, photo_url || null, playerId]
    );
    const playerResult = await query(
      'SELECT player_id, display_name, photo_url, email, auth_provider, created_at FROM players WHERE player_id = $1',
      [playerId]
    );
    res.json(playerResult.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update player' });
  }
});

// GET /api/games/:roomId/detail - Full game detail with turn log
apiRouter.get('/games/:roomId/detail', async (req: Request, res: Response) => {
  try {
    const detail = await getGameDetail(req.params.roomId as string);
    if (!detail.room) {
      res.status(404).json({ error: 'Game not found' });
      return;
    }
    res.json(detail);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to get game detail' });
  }
});

// GET /api/admin/analytics - Analytics summary (excludes games with < 3 turns)
apiRouter.get('/admin/analytics', async (_req: Request, res: Response) => {
  try {
    const analytics = await getAnalyticsSummary();
    res.json(analytics);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to get analytics summary' });
  }
});

// GET /api/admin/profile-photos - List uploaded profile photos
apiRouter.get('/admin/profile-photos', async (_req: Request, res: Response) => {
  try {
    const result = await query(
      `WITH all_photos AS (
         SELECT player_id, display_name, photo_url, created_at
         FROM players
         WHERE photo_url IS NOT NULL AND photo_url <> ''
         UNION ALL
         SELECT player_id, display_name, photo_url, joined_at as created_at
         FROM room_players
         WHERE photo_url IS NOT NULL AND photo_url <> ''
       )
       SELECT DISTINCT ON (photo_url)
         photo_url,
         player_id,
         display_name,
         created_at
       FROM all_photos
       ORDER BY photo_url, created_at DESC`
    );

    const photos = result.rows.sort(
      (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    res.json({ photos });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch profile photos' });
  }
});

// GET /api/admin/cards - List all cards
apiRouter.get('/admin/cards', async (req: Request, res: Response) => {
  try {
    const includeInactive = `${req.query.include_inactive || ''}`.toLowerCase() === 'true';
    let result;
    if (includeInactive) {
      result = await query('SELECT card_id, card_type, card_text, expansion, is_active FROM cards ORDER BY card_id ASC');
    } else {
      result = await query('SELECT card_id, card_type, card_text, expansion, is_active FROM cards WHERE is_active = 1 ORDER BY card_id ASC');
    }
    res.json({ cards: result.rows });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch cards' });
  }
});

// POST /api/admin/cards - Add a card
apiRouter.post('/admin/cards', async (req: Request, res: Response) => {
  try {
    const cardType = normalizeCardType(req.body.card_type || '');
    const cardText = `${req.body.card_text || ''}`.trim();
    const expansion = normalizeExpansion(req.body.expansion || 'core');
    const isActive = req.body.is_active === 0 || req.body.is_active === false ? 0 : 1;

    if (!VALID_CARD_TYPES.has(cardType)) {
      res.status(400).json({ error: 'Invalid card_type. Use truth, dare, challenge, or group.' });
      return;
    }
    if (!cardText) {
      res.status(400).json({ error: 'card_text is required' });
      return;
    }
    if (!VALID_EXPANSIONS.has(expansion)) {
      res.status(400).json({ error: 'Invalid expansion. Use core, vanilla, or pineapple.' });
      return;
    }

    const result = await query(
      'INSERT INTO cards (card_type, card_text, expansion, is_active) VALUES ($1, $2, $3, $4) RETURNING card_id, card_type, card_text, expansion, is_active',
      [cardType, cardText, expansion, isActive]
    );

    res.status(201).json({ card: result.rows[0] });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create card' });
  }
});

// PUT /api/admin/cards/:cardId - Edit a card
apiRouter.put('/admin/cards/:cardId', async (req: Request, res: Response) => {
  try {
    const cardId = parseInt(req.params.cardId as string, 10);
    if (Number.isNaN(cardId)) {
      res.status(400).json({ error: 'Invalid cardId' });
      return;
    }

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (req.body.card_type !== undefined) {
      const cardType = normalizeCardType(req.body.card_type);
      if (!VALID_CARD_TYPES.has(cardType)) {
        res.status(400).json({ error: 'Invalid card_type. Use truth, dare, challenge, or group.' });
        return;
      }
      updates.push(`card_type = $${paramIndex++}`);
      values.push(cardType);
    }

    if (req.body.card_text !== undefined) {
      const cardText = `${req.body.card_text}`.trim();
      if (!cardText) {
        res.status(400).json({ error: 'card_text cannot be empty' });
        return;
      }
      updates.push(`card_text = $${paramIndex++}`);
      values.push(cardText);
    }

    if (req.body.expansion !== undefined) {
      const expansion = normalizeExpansion(req.body.expansion);
      if (!VALID_EXPANSIONS.has(expansion)) {
        res.status(400).json({ error: 'Invalid expansion. Use core, vanilla, or pineapple.' });
        return;
      }
      updates.push(`expansion = $${paramIndex++}`);
      values.push(expansion);
    }

    if (req.body.is_active !== undefined) {
      updates.push(`is_active = $${paramIndex++}`);
      values.push(req.body.is_active === 0 || req.body.is_active === false ? 0 : 1);
    }

    if (updates.length === 0) {
      res.status(400).json({ error: 'No valid fields to update' });
      return;
    }

    values.push(cardId);
    const result = await query(
      `UPDATE cards SET ${updates.join(', ')} WHERE card_id = $${paramIndex} RETURNING card_id, card_type, card_text, expansion, is_active`,
      values
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Card not found' });
      return;
    }

    res.json({ card: result.rows[0] });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update card' });
  }
});

// DELETE /api/admin/cards/:cardId - Remove a card
apiRouter.delete('/admin/cards/:cardId', async (req: Request, res: Response) => {
  try {
    const cardId = parseInt(req.params.cardId as string, 10);
    if (Number.isNaN(cardId)) {
      res.status(400).json({ error: 'Invalid cardId' });
      return;
    }

    const result = await query('DELETE FROM cards WHERE card_id = $1', [cardId]);
    if (result.rowCount === 0) {
      res.status(404).json({ error: 'Card not found' });
      return;
    }

    res.json({ success: true, card_id: cardId });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete card' });
  }
});

// GET /api/admin/cards/export - Export cards as CSV
apiRouter.get('/admin/cards/export', async (_req: Request, res: Response) => {
  try {
    const result = await query(
      'SELECT card_id, card_type, card_text, expansion, is_active FROM cards ORDER BY card_id ASC'
    );
    const cards = result.rows as any[];

    const lines = ['card_id,card_type,card_text,expansion,is_active'];
    for (const c of cards) {
      lines.push([
        csvEscape(c.card_id),
        csvEscape(c.card_type),
        csvEscape(c.card_text),
        csvEscape(c.expansion),
        csvEscape(c.is_active),
      ].join(','));
    }

    const csv = `${lines.join('\n')}\n`;
    const fileName = `pineapple-cards-${new Date().toISOString().slice(0, 10)}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(csv);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to export cards' });
  }
});

// POST /api/admin/cards/import - Import cards from CSV
apiRouter.post('/admin/cards/import', csvUpload.single('file'), async (req: Request, res: Response) => {
  try {
    const csvText = req.file?.buffer?.toString('utf-8') || `${req.body.csv || ''}`;
    if (!csvText.trim()) {
      res.status(400).json({ error: 'CSV file or csv text body is required' });
      return;
    }

    const rows = parseCsvRows(csvText);
    if (rows.length < 2) {
      res.status(400).json({ error: 'CSV must include a header and at least one data row' });
      return;
    }

    const header = rows[0].map(normalizeHeader);
    const indexMap: Record<string, number> = {};
    header.forEach((h, i) => { indexMap[h] = i; });

    const cardTypeIndex = indexMap.card_type ?? indexMap['card_type'];
    const cardTextIndex = indexMap.card_text ?? indexMap['card_text'];
    const expansionIndex = indexMap.expansion ?? indexMap.edition;
    const isActiveIndex = indexMap.is_active;
    const cardIdIndex = indexMap.card_id;

    if (cardTypeIndex === undefined || cardTextIndex === undefined || expansionIndex === undefined) {
      res.status(400).json({
        error: 'CSV headers must include card_type/card type, card_text/card text, and expansion/edition',
      });
      return;
    }

    let created = 0;
    let updated = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const lineNumber = i + 1;

      const rawType = `${row[cardTypeIndex] || ''}`;
      const rawText = `${row[cardTextIndex] || ''}`;
      const rawExpansion = `${row[expansionIndex] || ''}`;
      const rawIsActive = isActiveIndex !== undefined ? `${row[isActiveIndex] || ''}` : '1';
      const rawCardId = cardIdIndex !== undefined ? `${row[cardIdIndex] || ''}` : '';

      const cardType = normalizeCardType(rawType);
      const cardText = rawText.trim();
      const expansion = normalizeExpansion(rawExpansion);
      const isActive = rawIsActive === '0' || rawIsActive.toLowerCase() === 'false' ? 0 : 1;

      if (!cardType && !cardText && !expansion) {
        skipped++;
        continue;
      }

      if (!VALID_CARD_TYPES.has(cardType)) {
        errors.push(`Line ${lineNumber}: invalid card_type '${rawType}'`);
        continue;
      }
      if (!cardText) {
        errors.push(`Line ${lineNumber}: card_text is required`);
        continue;
      }
      if (!VALID_EXPANSIONS.has(expansion)) {
        errors.push(`Line ${lineNumber}: invalid expansion '${rawExpansion}'`);
        continue;
      }

      const parsedCardId = rawCardId ? parseInt(rawCardId, 10) : NaN;
      if (rawCardId && !Number.isNaN(parsedCardId)) {
        // Try to update existing card
        const updateResult = await query(
          'UPDATE cards SET card_type = $1, card_text = $2, expansion = $3, is_active = $4 WHERE card_id = $5',
          [cardType, cardText, expansion, isActive, parsedCardId]
        );
        if ((updateResult.rowCount ?? 0) > 0) {
          updated++;
        } else {
          // Card doesn't exist, create new one
          await query(
            'INSERT INTO cards (card_type, card_text, expansion, is_active) VALUES ($1, $2, $3, $4)',
            [cardType, cardText, expansion, isActive]
          );
          created++;
        }
      } else {
        // No card_id provided, create new card
        await query(
          'INSERT INTO cards (card_type, card_text, expansion, is_active) VALUES ($1, $2, $3, $4)',
          [cardType, cardText, expansion, isActive]
        );
        created++;
      }
    }

    res.json({
      success: true,
      created,
      updated,
      skipped,
      failed: errors.length,
      errors: errors.slice(0, 50),
    });
  } catch (err: any) {
    console.error('Error importing cards:', err);
    res.status(500).json({ error: 'Failed to import cards' });
  }
});
