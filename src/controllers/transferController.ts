import { Request, Response } from 'express';
import { TransferRequestModel } from '../models/TransferRequest.js';
import { StaffModel } from '../models/Staff.js';
import { BranchModel } from '../models/Branch.js';
import { isUsingFallback, fallbackStore, saveFallbackToDisk } from '../config/db.js';

// GET /api/transfers - List transfer requests (Admins see their branch; Superadmin sees all)
export const getTransferRequests = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    const { status, branchId } = req.query;

    if (isUsingFallback()) {
      let list = fallbackStore.transferRequests || [];

      if (user && user.role !== 'superadmin' && user.branchId) {
        list = list.filter(
          (r) => r.fromBranchId === user.branchId || r.toBranchId === user.branchId
        );
      } else if (branchId && branchId !== 'all') {
        list = list.filter(
          (r) => r.fromBranchId === branchId || r.toBranchId === branchId
        );
      }

      if (status && status !== 'all') {
        list = list.filter((r) => r.status === status);
      }

      return res.json({ success: true, count: list.length, data: list });
    }

    const filter: any = {};
    if (user && user.role !== 'superadmin' && user.branchId) {
      filter.$or = [{ fromBranchId: user.branchId }, { toBranchId: user.branchId }];
    } else if (branchId && branchId !== 'all') {
      filter.$or = [{ fromBranchId: branchId }, { toBranchId: branchId }];
    }

    if (status && status !== 'all') {
      filter.status = status;
    }

    const requests = await TransferRequestModel.find(filter).sort({ createdAt: -1 }).lean();
    res.json({ success: true, count: requests.length, data: requests });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/transfers - Admin submits a transfer request (or Superadmin can execute immediately)
export const createTransferRequest = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    const { staffId, toBranchId, reason } = req.body;

    if (!staffId || !toBranchId) {
      return res.status(400).json({
        success: false,
        message: 'Staff ID and Target Branch are required.',
      });
    }

    // 1. Fetch Staff
    let staffDoc: any = null;
    let targetBranchDoc: any = null;
    let fromBranchDoc: any = null;

    if (isUsingFallback()) {
      staffDoc = (fallbackStore.staff || []).find((s) => s.id === staffId);
      targetBranchDoc = (fallbackStore.branches || []).find((b) => b.id === toBranchId);
      fromBranchDoc = staffDoc
        ? (fallbackStore.branches || []).find((b) => b.id === staffDoc.branchId)
        : null;
    } else {
      staffDoc = await StaffModel.findOne({ id: staffId }).lean();
      targetBranchDoc = await BranchModel.findOne({ id: toBranchId }).lean();
      if (staffDoc?.branchId) {
        fromBranchDoc = await BranchModel.findOne({ id: staffDoc.branchId }).lean();
      }
    }

    if (!staffDoc) {
      return res.status(404).json({ success: false, message: 'Staff member not found.' });
    }

    if (!targetBranchDoc) {
      return res.status(404).json({ success: false, message: 'Target branch not found.' });
    }

    const currentBranchId = staffDoc.branchId || '';
    if (currentBranchId === toBranchId) {
      return res.status(400).json({
        success: false,
        message: 'Staff member is already assigned to this branch.',
      });
    }

    // Branch Admin can only request transfer for staff in their own branch
    if (user && user.role !== 'superadmin' && user.branchId && currentBranchId !== user.branchId) {
      return res.status(403).json({
        success: false,
        message: 'You can only request transfer for staff belonging to your assigned branch.',
      });
    }

    // If Superadmin makes the request, they can optionally execute immediately
    const isSuper = user?.role === 'superadmin';
    const autoApprove = isSuper && req.body.autoApprove === true;

    const id = `tr_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
    const newRequestPayload = {
      id,
      staffId: staffDoc.id,
      staffName: staffDoc.name,
      fromBranchId: currentBranchId,
      fromBranchName: fromBranchDoc ? fromBranchDoc.name : 'Unassigned Branch',
      toBranchId: targetBranchDoc.id,
      toBranchName: targetBranchDoc.name,
      reason: (reason || '').trim(),
      requestedByUserId: user?.id || 'admin',
      requestedByUserName: user?.name || 'Branch Admin',
      requestedByUserRole: user?.role || 'admin',
      status: (autoApprove ? 'approved' : 'pending') as any,
      reviewedByUserId: autoApprove ? user?.id : null,
      reviewedByUserName: autoApprove ? user?.name : null,
      reviewedAt: autoApprove ? new Date() : null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (autoApprove) {
      // Execute the move immediately
      if (isUsingFallback()) {
        const sIdx = fallbackStore.staff.findIndex((s) => s.id === staffDoc.id);
        if (sIdx !== -1) {
          fallbackStore.staff[sIdx].branchId = toBranchId;
        }
      } else {
        await StaffModel.updateOne({ id: staffDoc.id }, { branchId: toBranchId });
      }
    }

    if (isUsingFallback()) {
      if (!fallbackStore.transferRequests) fallbackStore.transferRequests = [];
      fallbackStore.transferRequests.unshift(newRequestPayload);
      saveFallbackToDisk();
      return res.status(201).json({
        success: true,
        message: autoApprove
          ? `Staff ${staffDoc.name} transferred directly to ${targetBranchDoc.name}.`
          : `Transfer request for ${staffDoc.name} submitted to Super Admin for approval.`,
        data: newRequestPayload,
      });
    }

    const createdReq = await TransferRequestModel.create(newRequestPayload);
    res.status(201).json({
      success: true,
      message: autoApprove
        ? `Staff ${staffDoc.name} transferred directly to ${targetBranchDoc.name}.`
        : `Transfer request for ${staffDoc.name} submitted to Super Admin for approval.`,
      data: createdReq,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/transfers/:id/respond - Superadmin approves or rejects the transfer request
export const respondToTransferRequest = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    const { id } = req.params;
    const { action, reviewNotes } = req.body; // action: 'approve' | 'reject' | 'cancel'

    if (!['approve', 'reject', 'cancel'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid action. Must be approve, reject, or cancel.',
      });
    }

    // Non-superadmin can only cancel their own pending request
    if (user?.role !== 'superadmin' && action !== 'cancel') {
      return res.status(403).json({
        success: false,
        message: 'Only Super Admin can approve or reject branch transfer requests.',
      });
    }

    let targetReq: any = null;

    if (isUsingFallback()) {
      targetReq = (fallbackStore.transferRequests || []).find((r) => r.id === id);
    } else {
      targetReq = await TransferRequestModel.findOne({ id });
    }

    if (!targetReq) {
      return res.status(404).json({ success: false, message: 'Transfer request not found.' });
    }

    if (targetReq.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `This request is already ${targetReq.status}.`,
      });
    }

    const newStatus = action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'cancelled';

    // If approving, perform the actual staff transfer to target branch
    if (action === 'approve') {
      if (isUsingFallback()) {
        const staffIdx = fallbackStore.staff.findIndex((s) => s.id === targetReq.staffId);
        if (staffIdx !== -1) {
          fallbackStore.staff[staffIdx].branchId = targetReq.toBranchId;
        }
      } else {
        await StaffModel.updateOne({ id: targetReq.staffId }, { branchId: targetReq.toBranchId });
      }
    }

    const updates: any = {
      status: newStatus,
      reviewNotes: (reviewNotes || '').trim(),
      reviewedByUserId: user?.id || null,
      reviewedByUserName: user?.name || null,
      reviewedAt: new Date(),
      updatedAt: new Date(),
    };

    if (isUsingFallback()) {
      Object.assign(targetReq, updates);
      saveFallbackToDisk();
      return res.json({
        success: true,
        message:
          action === 'approve'
            ? `Transfer approved! Staff ${targetReq.staffName} moved to ${targetReq.toBranchName}.`
            : `Transfer request marked as ${newStatus}.`,
        data: targetReq,
      });
    }

    const updated = await TransferRequestModel.findOneAndUpdate({ id }, updates, { new: true });
    res.json({
      success: true,
      message:
        action === 'approve'
          ? `Transfer approved! Staff ${targetReq.staffName} moved to ${targetReq.toBranchName}.`
          : `Transfer request marked as ${newStatus}.`,
      data: updated,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
