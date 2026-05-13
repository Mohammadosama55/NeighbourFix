import http from 'http';
import dotenv from 'dotenv';
import app from './app.js';
import connectDB from './config/db.js';
import { initIO } from './socket.js';

dotenv.config();

if (process.env.NODE_ENV !== 'test') {
  connectDB();
}

const PORT = process.env.PORT || 5000;
const httpServer = http.createServer(app);

initIO(httpServer);

httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));

export default app;
