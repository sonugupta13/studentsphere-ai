import { Server } from 'socket.io';

let io;
const activeSockets = new Map(); // userId -> socketId

export const initSocket = (server, allowedOrigins) => {
  io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
    },
  });

  io.on('connection', (socket) => {
    console.log('Socket client connected:', socket.id);

    // Private user room for notifications
    socket.on('join', (userId) => {
      if (userId) {
        socket.join(userId.toString());
        activeSockets.set(userId.toString(), socket.id);
        console.log(`User ${userId} joined their private notification room.`);
      }
    });

    // Discussion room for real-time live threads
    socket.on('join_discussion', (discussionId) => {
      if (discussionId) {
        socket.join(discussionId.toString());
        console.log(`Socket client joined discussion room: ${discussionId}`);
      }
    });

    socket.on('leave_discussion', (discussionId) => {
      if (discussionId) {
        socket.leave(discussionId.toString());
        console.log(`Socket client left discussion room: ${discussionId}`);
      }
    });

    socket.on('disconnect', () => {
      console.log('Socket client disconnected:', socket.id);
      for (const [userId, socketId] of activeSockets.entries()) {
        if (socketId === socket.id) {
          activeSockets.delete(userId);
          break;
        }
      }
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized.');
  }
  return io;
};

export const sendNotification = (userId, type, payload) => {
  if (io) {
    io.to(userId.toString()).emit('notification', { type, payload });
  }
};

export const broadcastDiscussionMessage = (discussionId, message) => {
  if (io) {
    io.to(discussionId.toString()).emit('discussion_message', message);
  }
};
