const { Server } = require('socket.io');
const db = require('../db');

let io;
const activeSessions = new Map(); // socket.id -> { id, candidate_name, scenario_id, connectedAt, last_event }

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
      socket.emit('update_live_sessions', Array.from(activeSessions.values()));
      console.log('Admin joined and synced:', socket.id);
    });

    // 2. Join Session (Candidate)
    socket.on('join_code_session', ({ sessionId, candidateName, scenario }) => {
      socket.sessionId = sessionId;
      socket.candidateName = candidateName;

      // Add to active map using socket.id to fix ghost sessions
      activeSessions.set(socket.id, {
        id: socket.id,
        candidate_name: candidateName,
        sessionId: sessionId,
        scenario_id: scenario || 'unknown',
        connectedAt: new Date(),
        last_event: 'Connected'
      });

      // Broadcast the FULL list to all admins instantly
      io.to('admins').emit('update_live_sessions', Array.from(activeSessions.values()));
      console.log(`Candidate ${candidateName} is now LIVE in socket ${socket.id}`);
    });

    // 3. Real-time Activity Relay
    socket.on('session_event', (event) => {
      const session = activeSessions.get(socket.id);
      if (session) {
        session.last_event = event.command || event.type;
        io.to('admins').emit('update_live_sessions', Array.from(activeSessions.values()));
      }
    });

    // 4. Instant Disconnect Detection (Navigation or Tab Close)
    socket.on('disconnect', async () => {
      if (activeSessions.has(socket.id)) {
        console.log(`Candidate ${socket.candidateName} on socket ${socket.id} disconnected.`);
        
        // Remove from active map immediately
        activeSessions.delete(socket.id);

        // Notify admins instantly with updated list
        io.to('admins').emit('update_live_sessions', Array.from(activeSessions.values()));

        // Mark as abandoned in DB for persistence if sessionId exists
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
