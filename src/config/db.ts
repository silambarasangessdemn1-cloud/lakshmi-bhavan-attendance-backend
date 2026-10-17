import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

let isConnected = false;
let useLocalFallback = false;

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DATA_FILE = path.resolve(DATA_DIR, 'db_fallback.json');

// In-memory / file-backed fallback store when MongoDB is unreachable
export interface FallbackData {
  staff: any[];
  attendance: any[];
  loanAdvances: any[];
  payments: any[];
  settings: any;
}

export const fallbackStore: FallbackData = {
  staff: [],
  attendance: [],
  loanAdvances: [],
  payments: [],
  settings: {
    companyName: 'Shree Lakshmi Bhavan',
    tagline: 'Staff Salary & Attendance Manager',
    address: '',
    phone: '',
    currency: 'INR',
    currencySymbol: '₹',
  },
};

// Load initial fallback data from disk if present
export function loadFallbackFromDisk() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      Object.assign(fallbackStore, parsed);
    }
  } catch (err) {
    console.warn('[Storage] Notice: Could not read local fallback cache:', err);
  }
}

// Persist fallback data to disk
export function saveFallbackToDisk() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(fallbackStore, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[Storage] Notice: Could not write local fallback cache:', err);
  }
}

export async function connectDB(uri?: string): Promise<boolean> {
  const mongoUri =
    uri ||
    process.env.MONGO_URI ||
    process.env.MONGODB_URI ||
    'mongodb://127.0.0.1:27017/shree_lakshmi_bhavan';
  loadFallbackFromDisk();

  try {
    console.log(`[Database] Attempting connection to MongoDB (${mongoUri.replace(/:([^:@]+)@/, ':****@')})...`);
    mongoose.set('strictQuery', false);

    // Timeout quickly (4 seconds) so the server is immediately responsive even if the demo URI is invalid or offline
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 4000,
      connectTimeoutMS: 4000,
    });

    isConnected = true;
    useLocalFallback = false;
    console.log('[Database] ✅ Successfully connected to MongoDB!');
    return true;
  } catch (err: any) {
    isConnected = false;
    useLocalFallback = true;
    console.warn(`[Database] ⚠️ MongoDB connection failed (${err.message}).`);
    console.warn('[Database] 🛡️ Seamlessly activated resilient persistent local storage fallback (data/db_fallback.json).');
    console.warn('[Database] All API endpoints remain 100% operational.');
    return false;
  }
}

export function isMongoDBConnected(): boolean {
  return isConnected && mongoose.connection.readyState === 1;
}

export function isUsingFallback(): boolean {
  return useLocalFallback || !isMongoDBConnected();
}
