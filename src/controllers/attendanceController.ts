import { Request, Response } from 'express';
import { AttendanceModel } from '../models/Attendance.js';
import { StaffModel } from '../models/Staff.js';
import { isUsingFallback, fallbackStore, saveFallbackToDisk } from '../config/db.js';

export const getAttendance = async (req: Request, res: Response) => {
  try {
    const { date, month, staffId } = req.query as { date?: string; month?: string; staffId?: string };

    if (isUsingFallback()) {
      let filtered = [...fallbackStore.attendance];
      if (date) filtered = filtered.filter((a) => a.date === date);
      if (month) filtered = filtered.filter((a) => a.date.startsWith(month));
      if (staffId) filtered = filtered.filter((a) => a.staffId === staffId);
      return res.json({ success: true, count: filtered.length, data: filtered });
    }

    const query: any = {};
    if (date) query.date = date;
    if (month) query.date = { $regex: `^${month}` };
    if (staffId) query.staffId = staffId;

    const records = await AttendanceModel.find(query).sort({ date: 1 });
    res.json({ success: true, count: records.length, data: records });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const saveAttendanceRecord = async (req: Request, res: Response) => {
  try {
    const body = req.body;
    const { staffId, date, status, inTime, outTime, ot, notes } = body;

    if (!staffId || !date || !status) {
      return res.status(400).json({ success: false, message: 'staffId, date, and status are required.' });
    }

    const id = body.id || `att-${staffId}-${date}`;
    const payload = {
      id,
      staffId,
      date,
      status,
      inTime: inTime || (status === 'present' || status === 'half' ? '09:00' : undefined),
      outTime: outTime || (status === 'present' ? '18:00' : status === 'half' ? '13:30' : undefined),
      ot: Number(ot) || 0,
      notes: notes || '',
    };

    if (isUsingFallback()) {
      const idx = fallbackStore.attendance.findIndex((a) => a.staffId === staffId && a.date === date);
      if (idx >= 0) {
        fallbackStore.attendance[idx] = { ...fallbackStore.attendance[idx], ...payload };
      } else {
        fallbackStore.attendance.push(payload);
      }
      saveFallbackToDisk();
      return res.json({ success: true, data: payload });
    }

    const record = await AttendanceModel.findOneAndUpdate(
      { staffId, date },
      payload,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json({ success: true, data: record });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const saveBulkAttendance = async (req: Request, res: Response) => {
  try {
    const { records } = req.body as { records: any[] };
    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ success: false, message: 'Array of records is required.' });
    }

    if (isUsingFallback()) {
      const map = new Map<string, any>();
      fallbackStore.attendance.forEach((r) => map.set(`${r.staffId}_${r.date}`, r));
      records.forEach((r) => {
        const id = r.id || `att-${r.staffId}-${r.date}`;
        map.set(`${r.staffId}_${r.date}`, { ...r, id });
      });
      fallbackStore.attendance = Array.from(map.values());
      saveFallbackToDisk();
      return res.json({ success: true, message: `Processed ${records.length} records.` });
    }

    const ops = records.map((r) => ({
      updateOne: {
        filter: { staffId: r.staffId, date: r.date },
        update: { $set: { ...r, id: r.id || `att-${r.staffId}-${r.date}` } },
        upsert: true,
      },
    }));

    await AttendanceModel.bulkWrite(ops);
    res.json({ success: true, message: `Bulk updated ${records.length} attendance records.` });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const replaceDateAttendance = async (req: Request, res: Response) => {
  try {
    const { date, records } = req.body as { date: string; records: any[] };
    if (!date) return res.status(400).json({ success: false, message: 'Date is required.' });

    const safeRecords = Array.isArray(records) ? records : [];

    if (isUsingFallback()) {
      fallbackStore.attendance = fallbackStore.attendance.filter((a) => a.date !== date);
      safeRecords.forEach((r) => {
        fallbackStore.attendance.push({
          ...r,
          id: r.id || `att-${r.staffId}-${date}`,
          date,
        });
      });
      saveFallbackToDisk();
      return res.json({ success: true, message: `Replaced attendance for ${date}.`, count: safeRecords.length });
    }

    await AttendanceModel.deleteMany({ date });
    if (safeRecords.length > 0) {
      const formatted = safeRecords.map((r) => ({
        ...r,
        id: r.id || `att-${r.staffId}-${date}`,
        date,
      }));
      await AttendanceModel.insertMany(formatted);
    }

    res.json({ success: true, message: `Replaced attendance for ${date}.`, count: safeRecords.length });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const markAllPresentForDate = async (req: Request, res: Response) => {
  try {
    const { date } = req.body;
    if (!date) return res.status(400).json({ success: false, message: 'Date is required.' });

    let activeStaff: any[] = [];
    if (isUsingFallback()) {
      activeStaff = fallbackStore.staff.filter((s) => s.status !== 'inactive');
    } else {
      activeStaff = await StaffModel.find({ status: { $ne: 'inactive' } });
    }

    const records = activeStaff.map((s) => ({
      id: `att-${s.id}-${date}`,
      staffId: s.id,
      date,
      status: 'present',
      inTime: '09:00',
      outTime: '18:00',
      ot: 0,
      notes: 'Marked present (All-in)',
    }));

    if (isUsingFallback()) {
      fallbackStore.attendance = fallbackStore.attendance.filter((a) => a.date !== date);
      fallbackStore.attendance.push(...records);
      saveFallbackToDisk();
      return res.json({ success: true, count: records.length, data: records });
    }

    await AttendanceModel.deleteMany({ date });
    const inserted = await AttendanceModel.insertMany(records);
    res.json({ success: true, count: inserted.length, data: inserted });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteAttendance = async (req: Request, res: Response) => {
  try {
    const { staffId, date } = req.query as { staffId: string; date: string };
    if (!staffId || !date) {
      return res.status(400).json({ success: false, message: 'staffId and date are required.' });
    }

    if (isUsingFallback()) {
      fallbackStore.attendance = fallbackStore.attendance.filter(
        (a) => !(a.staffId === staffId && a.date === date)
      );
      saveFallbackToDisk();
      return res.json({ success: true, message: `Deleted attendance for ${staffId} on ${date}.` });
    }

    await AttendanceModel.deleteOne({ staffId, date });
    res.json({ success: true, message: `Deleted attendance for ${staffId} on ${date}.` });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
