import { Server } from 'socket.io';
import Message from './models/Message.js';

let io = null;

const wardMembers = new Map();

function addToWard(wardNumber, socketId, info) {
  if (!wardMembers.has(wardNumber)) wardMembers.set(wardNumber, new Map());
  wardMembers.get(wardNumber).set(socketId, info);
}

function removeFromWard(socketId) {
  for (const [ward, members] of wardMembers.entries()) {
    if (members.has(socketId)) {
      members.delete(socketId);
      if (members.size === 0) wardMembers.delete(ward);
      return ward;
    }
  }
  return null;
}

function getWardOnlineUsers(wardNumber) {
  const members = wardMembers.get(wardNumber);
  if (!members) return [];
  const seen = new Set();
  const list = [];
  for (const info of members.values()) {
    if (!seen.has(info.userId)) {
      seen.add(info.userId);
      list.push({ userId: info.userId, userName: info.userName });
    }
  }
  return list;
}

export function initIO(httpServer) {
  io = new Server(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST', 'PUT'] },
  });

  io.on('connection', (socket) => {

    socket.on('join', (userId) => {
      if (userId) socket.join(`room_${userId}`);
    });

    socket.on('joinWard', async ({ wardNumber, userId, userName }) => {
      if (!wardNumber) return;
      const room = `ward_chat_${wardNumber}`;
      socket.join(room);
      socket.data.wardNumber = wardNumber;
      socket.data.userId     = userId;
      socket.data.userName   = userName;

      if (userId) {
        addToWard(wardNumber, socket.id, { userId, userName });
        io.to(room).emit('wardOnlineUsers', {
          wardNumber,
          users: getWardOnlineUsers(wardNumber),
        });

        const sysMsg = await Message.create({
          wardNumber,
          userId,
          userName,
          text: `${userName} joined the ward`,
          type: 'system',
        });
        io.to(room).emit('newWardMessage', sysMsg);
      }

      try {
        const history = await Message.find({ wardNumber })
          .sort({ createdAt: -1 }).limit(60).lean();
        socket.emit('wardHistory', { wardNumber, messages: history.reverse() });
      } catch (_) {}
    });

    socket.on('wardMessage', async ({ wardNumber, text, userId, userName }) => {
      if (!wardNumber || !text?.trim() || !userId) return;
      const clean = text.trim().slice(0, 1000);
      try {
        const msg = await Message.create({ wardNumber, userId, userName, text: clean });
        io.to(`ward_chat_${wardNumber}`).emit('newWardMessage', msg);
      } catch (_) {}
    });

    socket.on('leaveWard', ({ wardNumber, userId, userName }) => {
      if (!wardNumber) return;
      socket.leave(`ward_chat_${wardNumber}`);
      if (userId) {
        removeFromWard(socket.id);
        io.to(`ward_chat_${wardNumber}`).emit('wardOnlineUsers', {
          wardNumber,
          users: getWardOnlineUsers(wardNumber),
        });
      }
    });

    socket.on('disconnect', async () => {
      const ward = removeFromWard(socket.id);
      if (ward) {
        io.to(`ward_chat_${ward}`).emit('wardOnlineUsers', {
          wardNumber: ward,
          users: getWardOnlineUsers(ward),
        });
        const { userId, userName } = socket.data;
        if (userId && userName) {
          try {
            const sysMsg = await Message.create({
              wardNumber: ward, userId, userName,
              text: `${userName} left the ward`, type: 'system',
            });
            io.to(`ward_chat_${ward}`).emit('newWardMessage', sysMsg);
          } catch (_) {}
        }
      }
    });
  });

  return io;
}

export function getIO() {
  if (!io) throw new Error('Socket.io not initialised');
  return io;
}

export function emitToUser(userId, event, payload) {
  if (!io || !userId) return;
  io.to(`room_${userId}`).emit(event, payload);
}
