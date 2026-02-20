import { io, Socket } from 'socket.io-client';
import { createContext, useContext } from 'react';

// Create socket instance — connects to dev server via Vite proxy
export const socket: Socket = io('/', {
  autoConnect: false,
  transports: ['websocket', 'polling'],
});

export const SocketContext = createContext<Socket>(socket);

export function useSocket(): Socket {
  return useContext(SocketContext);
}
