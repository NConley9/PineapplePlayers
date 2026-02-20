# Pineapple Players — Functional Specification Document

A web-based, mobile-first card game designed to break the ice and encourage playful interaction at swinger and ENM parties. Players join a shared room via code, take turns drawing and playing cards (Truths, Dares, Challenges, Group actions), and the app tracks completions — while all actual gameplay happens in person.

---

## 1. Project Overview

**Project Name:** Pineapple Players

**Objectives:**
- Provide an easy-to-use, phone-friendly party game that facilitates icebreaking and escalating play at in-person adult social events
- Allow hosts to customize game intensity by including/excluding modular card expansions
- Track game history (cards played, completed vs. passed) per player for post-game review
- Support drop-in/drop-out play so players can join or leave without disrupting the game
- Require zero app installation — runs entirely in a mobile browser

**Scope — Included:**
- Real-time multiplayer room system (join via 4–6 character room code)
- Turn-based card draw and play mechanics
- Modular expansion system (Core, Vanilla, Pineapple — extensible for future developer-added packs)
- Player profiles with optional persistent accounts (hybrid auth: guest + optional email registration)
- Kick/ban voting system
- Card suggestion pipeline with email notification
- Game history and per-game log
- Admin tools for analytics and card management (add/edit/delete/search/filter)
- CSV import/export for full card list management
- Analytics tracking with exclusion rule for short games (< 3 turns)
- 18+ age gate on first visit

**Scope — Excluded:**
- Native mobile apps (iOS/Android) — web only
- In-app chat or video
- Payment/monetization features
- AI-generated cards or dynamic content
- User-created custom expansion packs — new expansions are developer-managed only

---

## 2. Data Structure

### Entities & Attributes

#### Player

| Field | Type | Notes |
|---|---|---|
| `player_id` | UUID | Primary key |
| `display_name` | string(30) | Required; unique per room |
| `photo_url` | string | URL to uploaded/captured photo; nullable |
| `email` | string | Nullable; required only for registered accounts |
| `password_hash` | string | Nullable; null for guest players |
| `auth_provider` | enum | `guest`, `email`, `oauth` |
| `device_token` | string | For device-based identity persistence |
| `created_at` | timestamp | |

#### Room

| Field | Type | Notes |
|---|---|---|
| `room_id` | UUID | Primary key |
| `room_code` | string(6) | Unique, uppercase alphanumeric, generated on creation |
| `host_player_id` | FK → Player | Player who created the room |
| `status` | enum | `lobby`, `in_progress`, `ended` |
| `expansions` | array\<string\> | Selected expansion keys; `["core"]` always present |
| `current_turn_player_id` | FK → Player | Nullable; null in lobby |
| `turn_order` | array\<UUID\> | Ordered list of player IDs |
| `turn_number` | int | Current turn index; starts at 1 when game starts |
| `created_at` | timestamp | |
| `ended_at` | timestamp | Nullable; set when last active player leaves during `in_progress` |

#### Card

| Field | Type | Notes |
|---|---|---|
| `card_id` | int | Primary key, auto-increment |
| `card_type` | enum | `truth`, `dare`, `challenge`, `group` |
| `card_text` | string(500) | The prompt/instruction text |
| `expansion` | string | `core`, `vanilla`, `pineapple`, or future developer-added keys |
| `is_active` | boolean | Default `true`; inactive cards excluded from deck builds |

#### GameDeck (runtime, per-room)

| Field | Type | Notes |
|---|---|---|
| `room_id` | FK → Room | |
| `draw_pile` | array\<card_id\> | Shuffled, ordered remaining cards |
| `discard_pile` | array\<card_id\> | Cards that have been played |

When `draw_pile` is empty and a draw is requested, `discard_pile` is reshuffled into `draw_pile`.

#### TurnLog

| Field | Type | Notes |
|---|---|---|
| `log_id` | UUID | Primary key |
| `room_id` | FK → Room | |
| `player_id` | FK → Player | Who played this turn |
| `card_drawn_1` | FK → Card | First card drawn |
| `card_drawn_2` | FK → Card | Second card drawn |
| `card_selected` | FK → Card | The card the player chose to play |
| `outcome` | enum | `completed`, `passed` |
| `turn_number` | int | Sequential within the game |
| `created_at` | timestamp | |

#### RoomPlayer (join table)

| Field | Type | Notes |
|---|---|---|
| `room_id` | FK → Room | |
| `player_id` | FK → Player | |
| `is_active` | boolean | `false` if player left voluntarily |
| `is_kicked` | boolean | `false` unless removed by vote |
| `kick_count` | int | Times kicked from this room; ≥ 2 = banned |
| `joined_at` | timestamp | |

#### KickVote

| Field | Type | Notes |
|---|---|---|
| `vote_id` | UUID | Primary key |
| `room_id` | FK → Room | |
| `target_player_id` | FK → Player | Player being voted on |
| `initiated_by` | FK → Player | |
| `votes_for` | int | Count of "kick" votes |
| `votes_against` | int | Count of "keep" votes |
| `status` | enum | `pending`, `kicked`, `stayed` |
| `created_at` | timestamp | |
| `resolved_at` | timestamp | |

#### CardSuggestion

| Field | Type | Notes |
|---|---|---|
| `suggestion_id` | UUID | Primary key |
| `player_id` | FK → Player | Nullable (guests may suggest) |
| `card_type` | enum | `truth`, `dare`, `challenge`, `group` |
| `card_text` | string(500) | Suggested card text |
| `expansion` | string | Suggested expansion, or blank |
| `status` | enum | `new`, `accepted`, `rejected` |
| `reviewed_at` | timestamp | Nullable |
| `created_at` | timestamp | |

### Data Flow

1. **Room creation** — Host selects expansions → server builds deck from `Card` table filtered by selected expansions (where `is_active = true`) → shuffles → stores as `GameDeck`
2. **Turn execution** — Active player draws 2 from `draw_pile` → selects 1 → both move to `discard_pile` → `TurnLog` entry written → `current_turn_player_id` advances
3. **Deck exhaustion** — When `draw_pile` < 2, `discard_pile` is reshuffled into `draw_pile`
4. **Game end** — If all active players leave during `in_progress`, room `status` → `ended`, `ended_at` set

---

## 3. Forms & Input

### Create Game Form

| Field | Type | Validation | Notes |
|---|---|---|---|
| Host display name | text | Required, 2–30 chars | Pre-filled if logged in |
| Host photo | file/camera | Optional; max 5 MB, JPEG/PNG | Capture or upload |
| Expansions | checkbox group | `Core` always checked & disabled | Vanilla, Pineapple toggleable |

**Submission:** Creates room, generates room code, redirects host to lobby.

### Join Game Form

| Field | Type | Validation | Notes |
|---|---|---|---|
| Room code | text (uppercase) | Required, 4–6 alphanumeric | Auto-uppercased on input |
| Display name | text | Required, 2–30 chars; unique within room | Pre-filled if logged in |
| Photo | file/camera | Optional | |

**Submission:** Validates code exists and room is joinable (not ended, player not banned). Adds player to room. Redirects to lobby/game.

**Error States:**
- Invalid room code → "Room not found"
- Room ended → "This game has ended"
- Banned → "You have been banned from this room"
- Name taken in room → "That name is already in use in this room"

### Profile Form

| Field | Type | Validation | Notes |
|---|---|---|---|
| Display name | text | Required, 2–30 chars | |
| Photo | file/camera | Optional; max 5 MB | |
| Email | email | Required for account creation; optional for guests | |
| Password | password | Min 8 chars, if creating account | |

### Suggest a Card Form

| Field | Type | Validation | Notes |
|---|---|---|---|
| Card type | select | Required | Options: Truth, Dare, Challenge, Group |
| Card text | textarea | Required, 10–500 chars | |
| Suggested expansion | select | Optional | Core, Vanilla, Pineapple |

**Submission:** Saves to `CardSuggestion` table. Sends email notification to `nick@nickconley.com` with suggestion details. Shows confirmation toast.

---

## 4. Views & UI

**Design Language:** Modern, clean, mobile-first. Color palette: deep reds, purples, warm oranges. Dark background with vibrant accents. Edgy, sexy pineapple motif — stylized pineapple iconography, subtle tropical texture patterns. Typography: bold sans-serif headers, clean body text.

### Screen Inventory

| Screen | Description |
|---|---|
| **Age Gate** | Full-screen overlay on first visit. "You must be 18 or older to play. By continuing, you confirm you are at least 18 years of age." with **"I am 18+"** and **"Exit"** buttons. |
| **Home** | Landing page with primary actions: Join Room, Create Game, Profile, Suggest a Card, Admin Analytics |
| **Create Game** | Expansion selection + host info entry |
| **Join Room** | Room code + player info entry |
| **Lobby** | Pre-game waiting room; player list, room code display, host can start game |
| **Game — Waiting** | Non-active player view; shows current player, player list, current card being played |
| **Game — Active Turn (Draw)** | Active player draws 2 cards; chooses 1 |
| **Game — Active Turn (Play)** | Shows selected card; Completed / Pass buttons |
| **Game — Turn Result** | Brief display after outcome selected; End Turn button |
| **Kick Vote Modal** | Overlay for vote initiation and voting |
| **Game History** | List of past games for the player |
| **Game Detail** | Turn-by-turn log of a specific game |
| **Profile** | View/edit player info |
| **Suggest a Card** | Card suggestion form |
| **Admin Analytics** | Summary metrics view for qualifying games (≥ 3 turns) |
| **Admin Card Management** | Card gallery with add/edit/delete, search/filter, CSV import/export |

### Age Gate Behavior

- Displayed once per device on first visit (before any other screen)
- Confirmation stored in `localStorage` / cookie — does not re-prompt on return visits
- Selecting "Exit" redirects to a blank page or closes the tab
- No date-of-birth entry required — simple affirmation `[ASSUMPTION]`

### UI Layout & Navigation

- **Home** is the root view. Top bar: Pineapple Players logo + player avatar (if set). Primary player actions are shown as large tiles, with an additional admin entry.
- **Lobby → Game** transition is seamless (same URL context, state change).
- **Game views** have a persistent bottom bar showing: player list (horizontal scroll of avatars), room code, and a "Leave Game" button.
- **Card display** uses a centered card component with color-coded borders: Red = Dare, Purple = Truth, Orange = Challenge, Gold = Group.
- **Active turn draw** shows two cards face-down; tapping flips to reveal. Player taps their chosen card to select it.
- **Navigation** back to Home is available from Lobby (leave room) and post-game.

### View Functionality

**Home:**
- Includes a dedicated entry to Admin Analytics.

**Lobby:**
- Real-time player list updates as players join/leave.
- Host sees a "Start Game" button (solo testing supported; game can start with host only).
- All players see the room code prominently displayed (tap to copy).
- Host can toggle expansions before starting.

**Game — Waiting:**
- Displays: "It's [Player Name]'s turn" with their avatar.
- Shows the card the active player selected (after they select it) so all players know what's being played.
- Shows a "Suggest Kick" button next to each player in the player list (except self).

**Game — Active Turn (Draw):**
- Two cards rendered face-down with a card-flip animation on tap.
- After both are revealed, player taps one to select. The unselected card goes to discard.
- Proceeds automatically to the Play view.

**Game — Active Turn (Play):**
- Selected card displayed prominently with its full text.
- Two buttons: **"Completed" ✓** (green accent) and **"Pass" ✗** (muted).
- After pressing either, the result is logged and the **"End Turn"** button appears.

**Game — Turn Result / End Turn:**
- Pressing "End Turn" advances `current_turn_player_id` to the next active player in `turn_order`, sends a real-time notification to that player, and transitions the current player to the Waiting view.

**Kick Vote Modal:**
- Triggered when any player taps "Suggest Kick" on another player.
- All players (except the target) see a modal: "[Player] has suggested kicking [Target]. Vote: Kick / Keep"
- Timer: 60 seconds to vote. Non-votes count as "Keep."
- If `votes_for > total_eligible_voters / 2`, player is removed. Their `kick_count` increments. If `kick_count ≥ 2`, they are banned from this room.
- Kicked player sees: "You have been removed from the game" and is redirected to Home.

---

## 5. Admin Dashboard

**Access (Current):** Exposed in-app via admin routes (`/admin/analytics`, `/admin/cards`) for development/testing.

**Access (Planned):** Add authenticated admin-only access control before production release. `[TBD — admin auth method, e.g., email/password or OAuth]`

### Screens

| Screen | Description |
|---|---|
| **Admin Analytics** | Summary stats from qualifying games (≥ 3 turns): total games, avg turns, avg players, turns by expansion |
| **Card Manager** | CRUD interface for all cards. Search by text/ID, filter by type/expansion, include inactive toggle, bulk import/export CSV |
| **Card Suggestions** | List of player-submitted suggestions with status (new, reviewed, accepted, rejected). Accept action copies card into the Card table with chosen expansion. |
| **Active Rooms** | List of currently active rooms with player count, status, and ability to force-end a room |
| **Game History** | Searchable log of all past games; click into any game to see turn-by-turn log |
| **Player List** | Searchable list of registered players; view profile, game history, and kick/ban history |
| **Analytics** | See Analytics section below |

### Card Manager — Functionality

- Add / edit / delete individual cards (type, text, expansion)
- Search cards by text or card ID
- Filter cards by card type and expansion
- Bulk import from CSV (file upload or raw CSV text)
- CSV header support: `card_type/card_text/expansion` and `Card Type/Card Text/Edition`
- Optional upsert by `card_id` on import (update existing card if ID matches)
- Bulk export to CSV
- Toggle card active/inactive (inactive cards are excluded from deck builds without deleting them)
- Refresh and select-to-edit workflow in a card gallery

### Card Suggestions — Workflow

1. Admin sees new suggestions sorted by date (newest first)
2. Admin can **Accept** (moves to Card table with admin-chosen type/expansion), **Reject** (marks rejected, optional reason), or **Edit & Accept**
3. Accepted/rejected status saved; no notification sent back to the suggesting player `[ASSUMPTION]`

---

## 6. Analytics

### Tracked Metrics (Current Implementation)

| Metric | Description | Granularity |
|---|---|---|
| Total games | Count of games included in analytics | Live aggregate |
| Average turns | Mean turn count across included games | Live aggregate |
| Average players | Mean player count across included games | Live aggregate |
| Turns by expansion | Turn volume grouped by card expansion | Live aggregate |

**Analytics Inclusion Rule:** Exclude games with fewer than 3 logged turns.

### Admin Analytics View

- Summary cards at top (total games, average turns, average players)
- Expansion breakdown list (`core`, `vanilla`, `pineapple`) by turn volume
- Explicit notice that games with `< 3 turns` are excluded

**Implementation Note:** Analytics are computed from existing transactional data (`Room`, `TurnLog`, `RoomPlayer`) and filtered by turn count threshold. No separate analytics event store required initially. `[ASSUMPTION — if scale demands it, a dedicated analytics pipeline can be added later]`

---

## 7. Automation & Integration

### Automated Processes

| Process | Trigger | Behavior |
|---|---|---|
| **Deck build** | Host starts game | Query `Card` table filtered by selected expansions (where `is_active = true`) → shuffle → populate `GameDeck.draw_pile` |
| **Deck reshuffle** | `draw_pile.length < 2` at draw time | Move all `discard_pile` cards into `draw_pile`, shuffle |
| **Turn advance** | Active player presses "End Turn" | Update `current_turn_player_id` to next in `turn_order` (skip inactive players); push real-time notification |
| **Auto-end game** | Last active player leaves while game is in progress | Set `Room.status = ended`, `Room.ended_at = now()` |
| **Kick vote timeout** | 60 seconds after vote initiated | Resolve vote with current tallies; non-votes = "Keep" |
| **Turn skip on disconnect** | Active player leaves mid-turn | Auto-advance turn to next player; log the abandoned turn as `passed` |

### Integrations

| Integration | Purpose | Details |
|---|---|---|
| **Email (SMTP or transactional service)** | Card suggestion notification | On `CardSuggestion` creation, send email to `nick@nickconley.com` with card type, text, suggested expansion, and submitting player name. Use a transactional email service (e.g., SendGrid, Resend, Postmark, or similar). `[TBD — service selection]` |
| **Real-time messaging** | Room state sync | WebSocket or equivalent real-time channel per room. Events: `player_joined`, `player_left`, `game_started`, `turn_started`, `card_selected`, `turn_ended`, `kick_vote_initiated`, `kick_vote_cast`, `kick_vote_resolved`, `game_ended` |
| **File storage** | Player photos | Upload to cloud storage (S3, Firebase Storage, or equivalent). Serve via CDN. Max 5 MB, JPEG/PNG. Images resized server-side to 400×400 max. `[TBD — storage provider]` |

---

## 8. Process Flow

### 8.1 Age Verification

1. **Player** → Opens app for the first time on a device
2. **System** → Checks for age confirmation flag in local storage
3. **If not found** → Display Age Gate overlay (blocks all interaction)
4. **Player** → Taps "I am 18+" → System sets flag → Proceeds to Home
5. **Player** → Taps "Exit" → Redirected away from app

### 8.2 Create & Start a Game

1. **Host** → Opens app → Home screen
2. **Host** → Taps "Create Game"
3. **Host** → Enters display name, optional photo, selects expansions → Submits
4. **System** → Creates `Room` (status: `lobby`), generates unique `room_code`, adds host as first `RoomPlayer`
5. **System** → Redirects host to Lobby; displays room code
6. **Players** → Enter room code + name on Join form → System validates → Adds to `RoomPlayer` → Real-time update to all in lobby
7. **Host** → Taps "Start Game" (available immediately for solo or group play)
8. **System** → Builds deck from selected expansions → Shuffles → Sets `Room.status = in_progress` → Randomizes `turn_order` → Sets `current_turn_player_id` to first player → Pushes `game_started` + `turn_started` events

### 8.3 Turn Lifecycle

1. **System** → Notifies active player: "It's your turn!"
2. **Active Player** → Sees two face-down cards → Taps each to reveal
3. **Active Player** → Selects one card to play → System pushes `card_selected` to all players (everyone sees the card text)
4. **Active Player** → Performs the action in person
5. **Active Player** → Taps "Completed" or "Pass"
6. **System** → Writes `TurnLog` entry (player, cards drawn, card selected, outcome)
7. **Active Player** → Taps "End Turn"
8. **System** → Advances `current_turn_player_id` to next active player in `turn_order` → Pushes `turn_ended` + `turn_started`
9. **Repeat** from step 1

### 8.4 Player Join Mid-Game

1. **New Player** → Enters room code + name on Join form
2. **System** → Validates room exists, is `in_progress`, player not banned
3. **System** → Adds player to `RoomPlayer`, appends to end of `turn_order` → Pushes `player_joined`
4. **New Player** → Enters game in Waiting state; will get their turn when rotation reaches them

### 8.5 Player Leave

1. **Player** → Taps "Leave Game"
2. **System** → Sets `RoomPlayer.is_active = false` → Removes from `turn_order`
3. **If departing player was active** → System auto-advances turn (logs turn as `passed`)
4. **If no active players remain and room is `in_progress`** → System ends game
5. **System** → Pushes `player_left` event

### 8.6 Kick Vote

1. **Initiator** → Taps "Suggest Kick" on target player
2. **System** → Creates `KickVote` (status: `pending`) → Pushes `kick_vote_initiated` to all except target
3. **All eligible players** → See modal → Vote "Kick" or "Keep" → System pushes `kick_vote_cast` (updates tallies in real-time)
4. **System** → After 60s or when all eligible have voted:
   - If `votes_for > eligible_voters / 2` → Kick: set `RoomPlayer.is_kicked = true`, increment `kick_count`, remove from `turn_order`, push `kick_vote_resolved` (result: kicked). If player was active, auto-advance turn.
   - Otherwise → Stay: push `kick_vote_resolved` (result: stayed)
5. **If `kick_count ≥ 2`** → Player is banned; cannot rejoin this room

### 8.7 Card Suggestion

1. **Player** → Taps "Suggest a Card" from Home
2. **Player** → Fills form (type, text, optional expansion) → Submits
3. **System** → Saves `CardSuggestion` → Sends email to `nick@nickconley.com` with details → Shows success toast

---

## 9. Non-Functional Requirements

| Requirement | Target |
|---|---|
| **Mobile responsiveness** | All views fully functional on screens ≥ 320px wide; no horizontal scrolling |
| **Real-time latency** | State updates (turn changes, player joins, votes) delivered to all clients within 1 second |
| **Page load** | Initial load < 3s on 4G connection |
| **Concurrent rooms** | Support ≥ 100 simultaneous active rooms `[TBD — refine based on expected usage]` |
| **Player photos** | Upload completes within 5s on 4G; images served via CDN |
| **Browser support** | Latest 2 versions of Safari (iOS), Chrome (Android), Chrome/Firefox/Edge (desktop) |
| **Session persistence** | Player can close and reopen browser and rejoin their active room (via device token / session cookie) |
| **Data retention** | Game history retained indefinitely for registered users; guest game history retained 90 days `[TBD]` |
| **Player limits** | 1–16 players per room |

---

## 10. Error Handling

| Scenario | Behavior |
|---|---|
| Room code not found | "Room not found. Check the code and try again." |
| Room is full (16 players) | "This room is full. Maximum 16 players." |
| Player banned from room | "You've been banned from this room." |
| Duplicate name in room | "That name is already taken. Choose another." |
| Network disconnect during game | Player's client attempts reconnect for 30 seconds. If successful, resumes. If not, player is marked inactive; turn auto-advances if it was their turn. Player can rejoin manually. |
| Photo upload fails | "Photo upload failed. Try again or skip for now." |
| Email send fails (card suggestion) | Suggestion is still saved. Email failure logged server-side. User sees success (suggestion was recorded). |

---

## 11. Assumptions & Risks

### Assumptions

- `[ASSUMPTION]` All gameplay actions (completing dares, answering truths) are self-reported; the app does not verify or enforce them
- `[ASSUMPTION]` The host who creates the game is a regular player and takes turns like everyone else
- `[ASSUMPTION]` Turn order is randomized at game start and fixed thereafter (new players appended to the end)
- `[ASSUMPTION]` Only one kick vote can be active at a time per room
- `[ASSUMPTION]` A game can be started with the Vanilla expansion alone (Core + Vanilla) even if it results in a smaller deck
- `[ASSUMPTION]` Solo games are allowed for testing and game can start with a single player
- `[ASSUMPTION]` Guest players (no account) can still suggest cards and play; their history exists only on their device/session
- `[ASSUMPTION]` Age gate is a simple affirmation ("I am 18+"), not a date-of-birth or ID verification system
- `[ASSUMPTION]` Analytics are computed from transactional data; no separate event-tracking service needed at launch
- `[ASSUMPTION]` Analytics/history exclude short test runs with fewer than 3 turns
- `[ASSUMPTION]` New expansions are added exclusively by the developer via the admin card manager; players cannot create custom packs

### Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Abusive card suggestions | Low | Email review by developer; no auto-publish pipeline |
| Player harassment via kick system | Medium | Require > 50% vote; limit one active vote at a time; show vote to all except target |
| Small deck with only Core or Core + Vanilla | Low | Display warning if deck < 20 cards; reshuffle ensures game can continue indefinitely |
| Browser/tab closure mid-turn | Medium | 30-second reconnect window + auto-advance fallback |
| Photo storage costs | Low | Resize images server-side; set max file size; `[TBD — monitor and set retention policy]` |
| Age gate is unenforceable | Low | Industry-standard affirmation approach; no sensitive data collected from minors; terms of use cover liability |

---

## 12. Open Questions

1. **Email service** — Which transactional email provider should be used for card suggestion notifications? `[TBD]`
2. **Hosting & storage** — Preferred cloud provider for hosting, real-time infrastructure, and photo storage? `[TBD]`
3. **Admin auth** — Current admin tools are accessible in-app for dev. How should production admin login and authorization work? `[TBD]`
4. **Terms of use / privacy policy** — Required for an app with user accounts and photo uploads. Need drafting? `[TBD]`
5. **Card balancing** — Current seeded card set is 58 cards (weighted toward Dare/Truth). Should minimum counts per type be established? `[TBD]`

---

## 13. Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React + Vite + Tailwind CSS (TypeScript) |
| **Backend** | Node.js + Express (TypeScript) |
| **Real-time** | Socket.io |
| **Database** | SQLite via `better-sqlite3` (dev) — swappable to PostgreSQL for production |
| **Email** | Nodemailer (SMTP provider TBD) |
| **File Uploads** | Multer + local uploads folder (dev) — cloud storage TBD for production |
| **Monorepo** | npm workspaces (`packages/shared`, `server`, `client`) |

---

## 14. Implemented Admin API Surface

### Analytics

- `GET /api/admin/analytics` — returns summary metrics; excludes games with `< 3` turns.

### Card Management

- `GET /api/admin/cards?include_inactive=true|false` — list cards.
- `POST /api/admin/cards` — create card.
- `PUT /api/admin/cards/:cardId` — update card.
- `DELETE /api/admin/cards/:cardId` — delete card.
- `GET /api/admin/cards/export` — export full card list as CSV.
- `POST /api/admin/cards/import` — import cards from CSV (multipart file or raw CSV body).
