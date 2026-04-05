const { Server } = require('socket.io');
const db = require('../db');

let io;
const activeSessions = new Map(); // key -> { id, candidate_name, user_id, scenario_id, connectedAt, last_event }

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
      socket.emit('live_sessions_update', Array.from(activeSessions.values()));
      console.log('Admin joined and synced:', socket.id);
    });

    // 2. Join Session (Candidate - terminal interview sessions)
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
      io.to('admins').emit('live_sessions_update', Array.from(activeSessions.values()));
      console.log(`Candidate ${candidateName} is now LIVE in ${sessionId}`);
    });

    // 3. Join Code Session (Candidate - /code route)
    socket.on('join_code_session', ({ sessionId, candidateName }) => {
      socket.codeSessionId = sessionId;
      socket.candidateName = candidateName;

      // Add to active map using sessionId as key
      activeSessions.set(sessionId, {
        id: sessionId,
        candidate_name: candidateName || 'Anonymous',
        scenario_id: 'rate_limiter',
        connectedAt: new Date(),
        last_event: 'Code session started'
      });

      // Broadcast the FULL list to all admins instantly
      io.to('admins').emit('live_sessions_update', Array.from(activeSessions.values()));
      console.log(`Candidate ${candidateName} started code session ${sessionId}`);
    });

    // 4. Real-time Activity Relay
    socket.on('session_event', (event) => {
      const session = activeSessions.get(socket.sessionId);
      if (session) {
        session.last_event = event.command || event.type;
        io.to('admins').emit('live_sessions_update', Array.from(activeSessions.values()));
      }
    });

    // 5. Instant Disconnect Detection (Navigation or Tab Close)
    socket.on('disconnect', async () => {
      const sessionKey = socket.sessionId || socket.codeSessionId;
      if (sessionKey) {
        console.log(`Candidate ${socket.candidateName} disconnected from session ${sessionKey}`);

        // Remove from active map
        activeSessions.delete(sessionKey);

        // Notify admins instantly with updated list
        io.to('admins').emit('live_sessions_update', Array.from(activeSessions.values()));

        // Mark as abandoned in DB for persistence (terminal sessions only)
        if (socket.sessionId) {
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
