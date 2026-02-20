import express from 'express';
import http from 'http';
import cors from 'cors';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import path from 'path';
import { getDb } from './db/database';
import './db/seed'; // Initialize database with cards
import { apiRouter } from './routes/api';
import { registerSocketHandlers } from './socket/handlers';
import type { ClientToServerEvents, ServerToClientEvents } from '@pineapple/shared';

dotenv.config({ path: path.join(__dirname, '..', '.env.example') });

const PORT = parseInt(process.env.PORT || '3001', 10);

const app = express();
const server = http.createServer(app);

const io = new Server<ClientToServerEvents, ServerToClientEvents>(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production'
      ? false
      : ['http://localhost:5173', 'http://localhost:3000'],
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Initialize DB
getDb();

// REST API routes
app.use('/api', apiRouter);

// Socket.io
registerSocketHandlers(io);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

server.listen(PORT, () => {
  console.log(`🍍 Pineapple Players server running on port ${PORT}`);
});

export { io };
