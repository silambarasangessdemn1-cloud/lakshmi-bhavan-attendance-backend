import { Request, Response } from 'express';
import { LoanAdvanceModel } from '../models/LoanAdvance.js';
import { isUsingFallback, fallbackStore, saveFallbackToDisk } from '../config/db.js';

export const getLoanAdvanceEntries = async (req: Request, res: Response) => {
  try {
    const { staffId, month, type } = req.query as { staffId?: string; month?: string; type?: string };

    if (isUsingFallback()) {
      let filtered = [...fallbackStore.loanAdvances];
      if (staffId) filtered = filtered.filter((l) => l.staffId === staffId);
      if (month) filtered = filtered.filter((l) => l.month === month);
      if (type) filtered = filtered.filter((l) => l.type === type);
      filtered.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      return res.json({ success: true, count: filtered.length, data: filtered });
    }

    const query: any = {};
    if (staffId) query.staffId = staffId;
    if (month) query.month = month;
    if (type) query.type = type;

    const entries = await LoanAdvanceModel.find(query).sort({ timestamp: -1 });
    res.json({ success: true, count: entries.length, data: entries });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createLoanAdvanceEntry = async (req: Request, res: Response) => {
  try {
    const body = req.body;
    const { staffId, type, amount, date, month, notes } = body;

    if (!staffId || !type || amount === undefined || !date) {
      return res.status(400).json({ success: false, message: 'staffId, type, amount, and date are required.' });
    }

    const monthStr = month || date.slice(0, 7);
    const id = body.id || `${type}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const timestamp = body.timestamp || Date.now();

    const payload = {
      id,
      staffId,
      type,
      amount: Number(amount) || 0,
      date,
      month: monthStr,
      notes: notes || '',
      timestamp,
    };

    if (isUsingFallback()) {
      fallbackStore.loanAdvances.unshift(payload);
      saveFallbackToDisk();
      return res.status(201).json({ success: true, data: payload });
    }

    const created = await LoanAdvanceModel.create(payload);
    res.status(201).json({ success: true, data: created });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteLoanAdvanceEntry = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (isUsingFallback()) {
      fallbackStore.loanAdvances = fallbackStore.loanAdvances.filter((l) => l.id !== id);
      saveFallbackToDisk();
      return res.json({ success: true, message: `Deleted entry ${id}.` });
    }

    await LoanAdvanceModel.findOneAndDelete({ id });
    res.json({ success: true, message: `Deleted entry ${id}.` });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
