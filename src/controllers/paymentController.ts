import { Request, Response } from 'express';
import { PaymentModel } from '../models/Payment.js';
import { isUsingFallback, fallbackStore, saveFallbackToDisk } from '../config/db.js';

export const getPayments = async (req: Request, res: Response) => {
  try {
    const { staffId, month } = req.query as { staffId?: string; month?: string };

    if (isUsingFallback()) {
      let filtered = [...fallbackStore.payments];
      if (staffId) filtered = filtered.filter((p) => p.staffId === staffId);
      if (month) filtered = filtered.filter((p) => p.month === month);
      filtered.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      return res.json({ success: true, count: filtered.length, data: filtered });
    }

    const query: any = {};
    if (staffId) query.staffId = staffId;
    if (month) query.month = month;

    const payments = await PaymentModel.find(query).sort({ timestamp: -1 });
    res.json({ success: true, count: payments.length, data: payments });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const recordPayment = async (req: Request, res: Response) => {
  try {
    const body = req.body;
    const { staffId, month, staffName, gross, net } = body;

    if (!staffId || !month || !staffName) {
      return res.status(400).json({ success: false, message: 'staffId, month, and staffName are required.' });
    }

    const id = body.id || `pay-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const timestamp = body.timestamp || Date.now();

    const payload = {
      ...body,
      id,
      timestamp,
      gross: Number(gross) || 0,
      net: Number(net) || 0,
      advance: Number(body.advance) || 0,
      loanDeduct: Number(body.loanDeduct) || 0,
      loanAdded: Number(body.loanAdded) || 0,
    };

    if (isUsingFallback()) {
      // Upsert: replace if existing payment for staffId and month exists to prevent duplicates!
      const existingIdx = fallbackStore.payments.findIndex(
        (p) => p.staffId === staffId && p.month === month
      );

      if (existingIdx >= 0) {
        fallbackStore.payments[existingIdx] = {
          ...fallbackStore.payments[existingIdx],
          ...payload,
          id: fallbackStore.payments[existingIdx].id || id,
        };
      } else {
        fallbackStore.payments.unshift(payload);
      }
      saveFallbackToDisk();
      return res.status(201).json({ success: true, data: payload });
    }

    // MongoDB Upsert on staffId + month to guarantee idempotency and avoid duplicate deductions
    const updated = await PaymentModel.findOneAndUpdate(
      { staffId, month },
      { $set: payload },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(201).json({ success: true, data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deletePayment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (isUsingFallback()) {
      fallbackStore.payments = fallbackStore.payments.filter((p) => p.id !== id);
      saveFallbackToDisk();
      return res.json({ success: true, message: `Payment ${id} deleted.` });
    }

    await PaymentModel.findOneAndDelete({ id });
    res.json({ success: true, message: `Payment ${id} deleted.` });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
