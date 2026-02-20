import { io, Socket } from 'socket.io-client';
import { createContext, useContext } from 'react';

// Create socket instance — connects to dev server via Vite proxy or production URL
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || '/';
export const socket: Socket = io(SOCKET_URL, {
  autoConnect: false,
  transports: ['websocket', 'polling'],
});

export const SocketContext = createContext<Socket>(socket);

export function useSocket(): Socket {
  return useContext(SocketContext);
}
