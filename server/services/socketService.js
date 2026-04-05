const { Server } = require('socket.io');
const db = require('../db');

let io;
const activeSessions = new Map(); // SessionID -> { sessionId, userId, candidateName, scenarioId, connectedAt }

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    console.log('New connection:', socket.id);

    // 1. Join Admin Room
    socket.on('join_admin_room', () => {
      socket.join('admins');
      // Send current state immediately to the new admin
      socket.emit('ACTIVE_SESSIONS_UPDATE', Array.from(activeSessions.values()));
      console.log('Admin joined and synced:', socket.id);
    });

    // 2. Join Session (Candidate)
    socket.on('join_session_room', ({ sessionId, userId, candidateName, scenarioId }) => {
      socket.join(`session_${sessionId}`);
      socket.sessionId = sessionId;
      socket.userId = userId;
      socket.candidateName = candidateName;

      // Add to active map
      activeSessions.set(sessionId, {
        id: sessionId,
        candidate_name: candidateName,
        user_id: userId,
        scenario_id: scenarioId || 'unknown',
        connectedAt: new Date(),
        last_event: 'Connected'
      });

      // Broadcast the FULL list to all admins instantly
      io.to('admins').emit('ACTIVE_SESSIONS_UPDATE', Array.from(activeSessions.values()));
      console.log(`Candidate ${candidateName} is now LIVE in ${sessionId}`);
    });

    // 3. Real-time Activity Relay
    socket.on('session_event', (event) => {
      const session = activeSessions.get(socket.sessionId);
      if (session) {
        session.last_event = event.command || event.type;
        // Optionally push single activity if the list is too big, but for now full list is safer for "No Delay Count"
        io.to('admins').emit('ACTIVE_SESSIONS_UPDATE', Array.from(activeSessions.values()));
      }
    });

    // 4. Instant Disconnect Detection (Navigation or Tab Close)
    socket.on('disconnect', async () => {
      if (socket.sessionId) {
        console.log(`Candidate ${socket.candidateName} left session ${socket.sessionId}`);
        
        // Remove from active map
        activeSessions.delete(socket.sessionId);

        // Notify admins instantly with updated list
        io.to('admins').emit('ACTIVE_SESSIONS_UPDATE', Array.from(activeSessions.values()));

        // Mark as abandoned in DB for persistence
        try {
          await db.query(`
            UPDATE sessions 
            SET status = 'abandoned', ended_at = NOW() 
            WHERE id = $1 AND status = 'in_progress'
          `, [socket.sessionId]);
        } catch (dbErr) {
          console.warn("DB Background update failed:", dbErr.message);
        }
      }
    });
  });

  return io;
};

const getIO = () => {
  if (!io) throw new Error("Socket.io not initialized!");
  return io;
};

module.exports = { initSocket, getIO };
