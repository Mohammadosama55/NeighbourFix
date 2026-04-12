// import express from 'express';
// import cors from 'cors';
// import dotenv from 'dotenv';
// import path from 'path';
// import { fileURLToPath } from 'url';
// import { dirname } from 'path';
// import authRoutes from './routes/auth.js';
// import complaintRoutes from './routes/complaints.js';



// const __filename = fileURLToPath(import.meta.url);
// const __dirname = dirname(__filename);

// const app = express();
// app.use(cors());
// app.use(express.json());

// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// app.use('/api/auth', authRoutes);
// app.use('/api/complaints', complaintRoutes);

// app.get('/health', (req, res) => {
//   res.json({ status: 'ok', message: 'NeighbourFix API is running' });
// });

// if (process.env.NODE_ENV === 'production') {
//   const publicDir = path.join(__dirname, 'public');
//   app.use(express.static(publicDir));
//   app.get('*', (req, res) => {
//     res.sendFile(path.join(publicDir, 'index.html'));
//   });
// }

// export default app;


import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import authRoutes from './routes/auth.js';
import complaintRoutes from './routes/complaints.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

app.use(cors());
app.use(express.json());

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'NeighbourFix API is running' });
});

// Optional 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

export default app;