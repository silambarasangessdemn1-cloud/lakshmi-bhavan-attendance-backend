"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
const db_js_1 = require("./config/db.js");
const index_js_1 = __importDefault(require("./routes/index.js"));
const seedData_js_1 = require("./seed/seedData.js");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Middleware
app.use((0, cors_1.default)({
    origin: '*', // Allow local frontend and any development port
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
app.use((0, morgan_1.default)('dev'));
// API Routes
app.use('/api', index_js_1.default);
// Root Welcome Route
app.get('/', (_req, res) => {
    res.json({
        name: 'Shree Lakshmi Bhavan - Staff Salary & Attendance Manager API',
        version: '1.0.0',
        documentation: '/api/admin/health',
        status: 'online',
    });
});
// 404 Route Handler
app.use((_req, res) => {
    res.status(404).json({ success: false, message: 'Endpoint not found' });
});
// Global Error Handler
app.use((err, _req, res, _next) => {
    console.error('[Error] Unhandled API error:', err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal Server Error',
    });
});
// Start Server
async function startServer() {
    await (0, db_js_1.connectDB)(process.env.MONGO_URI || process.env.MONGODB_URI);
    await (0, seedData_js_1.seedInitialData)();
    app.listen(PORT, () => {
        console.log(`=======================================================`);
        console.log(`🚀 Shree Lakshmi Bhavan Backend Server is running!`);
        console.log(`📍 Local URL:     http://localhost:${PORT}`);
        console.log(`🩺 Health check:  http://localhost:${PORT}/api/admin/health`);
        console.log(`=======================================================`);
    });
}
startServer();
