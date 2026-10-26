"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fallbackStore = void 0;
exports.loadFallbackFromDisk = loadFallbackFromDisk;
exports.saveFallbackToDisk = saveFallbackToDisk;
exports.connectDB = connectDB;
exports.isMongoDBConnected = isMongoDBConnected;
exports.isUsingFallback = isUsingFallback;
const mongoose_1 = __importDefault(require("mongoose"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
let isConnected = false;
let useLocalFallback = false;
const DATA_DIR = path_1.default.resolve(process.cwd(), 'data');
const DATA_FILE = path_1.default.resolve(DATA_DIR, 'db_fallback.json');
exports.fallbackStore = {
    staff: [],
    attendance: [],
    loanAdvances: [],
    payments: [],
    branches: [],
    users: [],
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
function loadFallbackFromDisk() {
    try {
        if (!fs_1.default.existsSync(DATA_DIR)) {
            fs_1.default.mkdirSync(DATA_DIR, { recursive: true });
        }
        if (fs_1.default.existsSync(DATA_FILE)) {
            const raw = fs_1.default.readFileSync(DATA_FILE, 'utf-8');
            const parsed = JSON.parse(raw);
            Object.assign(exports.fallbackStore, parsed);
        }
    }
    catch (err) {
        console.warn('[Storage] Notice: Could not read local fallback cache:', err);
    }
}
// Persist fallback data to disk
function saveFallbackToDisk() {
    try {
        if (!fs_1.default.existsSync(DATA_DIR)) {
            fs_1.default.mkdirSync(DATA_DIR, { recursive: true });
        }
        fs_1.default.writeFileSync(DATA_FILE, JSON.stringify(exports.fallbackStore, null, 2), 'utf-8');
    }
    catch (err) {
        console.warn('[Storage] Notice: Could not write local fallback cache:', err);
    }
}
async function connectDB(uri) {
    const mongoUri = uri ||
        process.env.MONGO_URI ||
        process.env.MONGODB_URI ||
        'mongodb://127.0.0.1:27017/shree_lakshmi_bhavan';
    loadFallbackFromDisk();
    try {
        console.log(`[Database] Attempting connection to MongoDB (${mongoUri.replace(/:([^:@]+)@/, ':****@')})...`);
        mongoose_1.default.set('strictQuery', false);
        // Timeout quickly (4 seconds) so the server is immediately responsive even if the demo URI is invalid or offline
        await mongoose_1.default.connect(mongoUri, {
            serverSelectionTimeoutMS: 4000,
            connectTimeoutMS: 4000,
        });
        isConnected = true;
        useLocalFallback = false;
        console.log('[Database] ✅ Successfully connected to MongoDB!');
        return true;
    }
    catch (err) {
        isConnected = false;
        useLocalFallback = true;
        console.warn(`[Database] ⚠️ MongoDB connection failed (${err.message}).`);
        console.warn('[Database] 🛡️ Seamlessly activated resilient persistent local storage fallback (data/db_fallback.json).');
        console.warn('[Database] All API endpoints remain 100% operational.');
        return false;
    }
}
function isMongoDBConnected() {
    return isConnected && mongoose_1.default.connection.readyState === 1;
}
function isUsingFallback() {
    return useLocalFallback || !isMongoDBConnected();
}
