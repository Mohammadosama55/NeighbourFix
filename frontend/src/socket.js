import { io } from 'socket.io-client';

let socket = null;

export function connectSocket(userId) {
  if (socket && socket.connected) {
    if (userId) socket.emit('join', userId);
    return socket;
  }

  socket = io('/', {
    path: '/socket.io',
    transports: ['websocket', 'polling'],
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
  });

  socket.on('connect', () => {
    if (userId) socket.emit('join', userId);
  });

  socket.on('connect_error', (err) => {
    console.warn('[socket] connect error:', err.message);
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function getSocket() {
  return socket;
}
