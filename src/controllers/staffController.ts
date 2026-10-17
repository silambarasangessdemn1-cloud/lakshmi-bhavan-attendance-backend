import { Request, Response } from 'express';
import { StaffModel } from '../models/Staff.js';
import { AttendanceModel } from '../models/Attendance.js';
import { PaymentModel } from '../models/Payment.js';
import { LoanAdvanceModel } from '../models/LoanAdvance.js';
import { isUsingFallback, fallbackStore, saveFallbackToDisk } from '../config/db.js';

export const getStaff = async (_req: Request, res: Response) => {
  try {
    if (isUsingFallback()) {
      return res.json({ success: true, count: fallbackStore.staff.length, data: fallbackStore.staff });
    }
    const staff = await StaffModel.find().sort({ createdAt: -1 });
    res.json({ success: true, count: staff.length, data: staff });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getStaffById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (isUsingFallback()) {
      const found = fallbackStore.staff.find((s) => s.id === id);
      if (!found) return res.status(404).json({ success: false, message: 'Staff member not found' });
      return res.json({ success: true, data: found });
    }
    const staff = await StaffModel.findOne({ id });
    if (!staff) return res.status(404).json({ success: false, message: 'Staff member not found' });
    res.json({ success: true, data: staff });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createStaff = async (req: Request, res: Response) => {
  try {
    const body = req.body;
    const trimmedId = (body.id || '').trim();
    const trimmedName = (body.name || '').trim();

    if (!trimmedId || !trimmedName) {
      return res.status(400).json({ success: false, message: 'Staff ID and Name are required.' });
    }

    const payload = {
      ...body,
      id: trimmedId,
      name: trimmedName,
      wage: Number(body.wage) || 0,
      otRate: Number(body.otRate) || 0,
      loanStart: Math.max(0, Number(body.loanStart) || 0),
      status: body.status || 'active',
      joiningDate: body.joiningDate || new Date().toISOString().slice(0, 10),
    };

    if (isUsingFallback()) {
      if (fallbackStore.staff.some((s) => s.id.toLowerCase() === trimmedId.toLowerCase())) {
        return res.status(409).json({ success: false, message: `Staff ID "${trimmedId}" already exists.` });
      }
      fallbackStore.staff.push(payload);
      saveFallbackToDisk();
      return res.status(201).json({ success: true, data: payload });
    }

    const existing = await StaffModel.findOne({ id: trimmedId });
    if (existing) {
      return res.status(409).json({ success: false, message: `Staff ID "${trimmedId}" already exists.` });
    }

    const created = await StaffModel.create(payload);
    res.status(201).json({ success: true, data: created });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateStaff = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const newId = updates.id ? updates.id.trim() : id;

    if (isUsingFallback()) {
      const idx = fallbackStore.staff.findIndex((s) => s.id === id);
      if (idx === -1) return res.status(404).json({ success: false, message: 'Staff member not found.' });

      if (newId !== id && fallbackStore.staff.some((s) => s.id.toLowerCase() === newId.toLowerCase())) {
        return res.status(409).json({ success: false, message: `Staff ID "${newId}" already in use.` });
      }

      fallbackStore.staff[idx] = { ...fallbackStore.staff[idx], ...updates, id: newId };

      if (newId !== id) {
        fallbackStore.attendance = fallbackStore.attendance.map((a) =>
          a.staffId === id ? { ...a, staffId: newId, id: `att-${newId}-${a.date}` } : a
        );
        fallbackStore.payments = fallbackStore.payments.map((p) =>
          p.staffId === id ? { ...p, staffId: newId, staffName: updates.name || p.staffName } : p
        );
        fallbackStore.loanAdvances = fallbackStore.loanAdvances.map((l) =>
          l.staffId === id ? { ...l, staffId: newId } : l
        );
      }

      saveFallbackToDisk();
      return res.json({ success: true, data: fallbackStore.staff[idx] });
    }

    if (newId !== id) {
      const conflict = await StaffModel.findOne({ id: newId });
      if (conflict) {
        return res.status(409).json({ success: false, message: `Staff ID "${newId}" already in use.` });
      }
    }

    const updated = await StaffModel.findOneAndUpdate({ id }, { ...updates, id: newId }, { new: true });
    if (!updated) return res.status(404).json({ success: false, message: 'Staff member not found.' });

    if (newId !== id) {
      await AttendanceModel.updateMany({ staffId: id }, { staffId: newId });
      await PaymentModel.updateMany({ staffId: id }, { staffId: newId, staffName: updates.name || updated.name });
      await LoanAdvanceModel.updateMany({ staffId: id }, { staffId: newId });
    }

    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteStaff = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (isUsingFallback()) {
      fallbackStore.staff = fallbackStore.staff.filter((s) => s.id !== id);
      fallbackStore.attendance = fallbackStore.attendance.filter((a) => a.staffId !== id);
      fallbackStore.payments = fallbackStore.payments.filter((p) => p.staffId !== id);
      fallbackStore.loanAdvances = fallbackStore.loanAdvances.filter((l) => l.staffId !== id);
      saveFallbackToDisk();
      return res.json({ success: true, message: `Staff member ${id} and associated records deleted.` });
    }

    await StaffModel.findOneAndDelete({ id });
    await AttendanceModel.deleteMany({ staffId: id });
    await PaymentModel.deleteMany({ staffId: id });
    await LoanAdvanceModel.deleteMany({ staffId: id });

    res.json({ success: true, message: `Staff member ${id} and associated records deleted.` });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
