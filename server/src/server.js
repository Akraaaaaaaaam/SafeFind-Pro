
import 'dotenv/config';
import { createServer } from 'http';
import { Server } from 'socket.io';
import app from './app.js';
const PORT = process.env.PORT || 5000;
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true } });
app.set('io', io);
io.on('connection', (socket) => {
  console.log('Socket connected', socket.id);
  socket.on('disconnect', () => console.log('Socket disconnected', socket.id));
});
httpServer.listen(PORT, () => console.log(`SafeFind Pro server running on http://localhost:${PORT}`));
