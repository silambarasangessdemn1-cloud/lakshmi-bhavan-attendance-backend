import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import masterRoutes from './routes/index.js';
import { seedInitialData } from './seed/seedData.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: '*', // Allow local frontend and any development port
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));

// API Routes
app.use('/api', masterRoutes);

// Root Welcome Route
app.get('/', (_req: Request, res: Response) => {
  res.json({
    name: 'MSS Shree Lakshmi Bhavan - Staff Salary & Attendance Manager API',
    version: '1.0.0',
    documentation: '/api/admin/health',
    status: 'online',
  });
});

// 404 Route Handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, message: 'Endpoint not found' });
});

// Global Error Handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Error] Unhandled API error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// Start Server
async function startServer() {
  await connectDB(process.env.MONGO_URI || process.env.MONGODB_URI);
  await seedInitialData();

  app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`🚀 Shree Lakshmi Bhavan Backend Server is running!`);
    console.log(`📍 Local URL:     http://localhost:${PORT}`);
    console.log(`🩺 Health check:  http://localhost:${PORT}/api/admin/health`);
    console.log(`=======================================================`);
  });
}

startServer();
