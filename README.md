# Shree Lakshmi Bhavan — Attendance & Payroll Backend

Express.js and MongoDB REST API backend for Shree Lakshmi Bhavan staff salary and attendance management.

## Features
- **Express.js & TypeScript**: Type-safe RESTful API architecture.
- **MongoDB & Mongoose**: Full schema models for Staff, Attendance, Loans & Advances, Payments, and Company Settings.
- **Resilient Fallback Engine**: If the MongoDB connection is unreachable or offline, the server automatically activates persistent local JSON storage (`data/db_fallback.json`), ensuring 100% API availability.
- **Auto-Seeding**: Automatically seeds realistic initial staff members for Shree Lakshmi Bhavan on first run.
- **Backup & Restore**: Native JSON export and import endpoints for one-click database backups.

## Environment Variables (`.env`)
```env
PORT=5050
MONGODB_URI=mongodb+srv://demoUser:demoPassword123@cluster0.demo.mongodb.net/shree_lakshmi_bhavan?retryWrites=true&w=majority
CLIENT_URL=http://localhost:3000
```

## Running the Server
```bash
# Install dependencies
npm install

# Start in development mode (with hot-reload)
npm run dev

# Build TypeScript
npm run build

# Start production server
npm start
```

## API Endpoints
- **Health**: `GET /api/admin/health`
- **Staff**: `GET, POST /api/staff`, `GET, PUT, DELETE /api/staff/:id`
- **Attendance**: `GET /api/attendance`, `POST /api/attendance/record`, `POST /api/attendance/bulk`, `POST /api/attendance/replace-date`, `POST /api/attendance/mark-all-present`, `DELETE /api/attendance`
- **Loans & Advances**: `GET, POST /api/loans-advances`, `DELETE /api/loans-advances/:id`
- **Payments (Disbursements)**: `GET, POST /api/payments`, `DELETE /api/payments/:id`
- **Settings**: `GET, PUT /api/settings`, `POST /api/settings/reset`
- **Database Backup**: `GET /api/admin/export`, `POST /api/admin/import`, `POST /api/admin/reset`
