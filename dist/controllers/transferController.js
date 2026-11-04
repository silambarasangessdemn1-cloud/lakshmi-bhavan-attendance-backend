"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.respondToTransferRequest = exports.createTransferRequest = exports.getTransferRequests = void 0;
const TransferRequest_js_1 = require("../models/TransferRequest.js");
const Staff_js_1 = require("../models/Staff.js");
const Branch_js_1 = require("../models/Branch.js");
const db_js_1 = require("../config/db.js");
// GET /api/transfers - List transfer requests (Admins see their branch; Superadmin sees all)
const getTransferRequests = async (req, res) => {
    try {
        const user = req.user;
        const { status, branchId } = req.query;
        if ((0, db_js_1.isUsingFallback)()) {
            let list = db_js_1.fallbackStore.transferRequests || [];
            if (user && user.role !== 'superadmin' && user.branchId) {
                list = list.filter((r) => r.fromBranchId === user.branchId || r.toBranchId === user.branchId);
            }
            else if (branchId && branchId !== 'all') {
                list = list.filter((r) => r.fromBranchId === branchId || r.toBranchId === branchId);
            }
            if (status && status !== 'all') {
                list = list.filter((r) => r.status === status);
            }
            return res.json({ success: true, count: list.length, data: list });
        }
        const filter = {};
        if (user && user.role !== 'superadmin' && user.branchId) {
            filter.$or = [{ fromBranchId: user.branchId }, { toBranchId: user.branchId }];
        }
        else if (branchId && branchId !== 'all') {
            filter.$or = [{ fromBranchId: branchId }, { toBranchId: branchId }];
        }
        if (status && status !== 'all') {
            filter.status = status;
        }
        const requests = await TransferRequest_js_1.TransferRequestModel.find(filter).sort({ createdAt: -1 }).lean();
        res.json({ success: true, count: requests.length, data: requests });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getTransferRequests = getTransferRequests;
// POST /api/transfers - Admin submits a transfer request (or Superadmin can execute immediately)
const createTransferRequest = async (req, res) => {
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
        let staffDoc = null;
        let targetBranchDoc = null;
        let fromBranchDoc = null;
        if ((0, db_js_1.isUsingFallback)()) {
            staffDoc = (db_js_1.fallbackStore.staff || []).find((s) => s.id === staffId);
            targetBranchDoc = (db_js_1.fallbackStore.branches || []).find((b) => b.id === toBranchId);
            fromBranchDoc = staffDoc
                ? (db_js_1.fallbackStore.branches || []).find((b) => b.id === staffDoc.branchId)
                : null;
        }
        else {
            staffDoc = await Staff_js_1.StaffModel.findOne({ id: staffId }).lean();
            targetBranchDoc = await Branch_js_1.BranchModel.findOne({ id: toBranchId }).lean();
            if (staffDoc?.branchId) {
                fromBranchDoc = await Branch_js_1.BranchModel.findOne({ id: staffDoc.branchId }).lean();
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
            status: (autoApprove ? 'approved' : 'pending'),
            reviewedByUserId: autoApprove ? user?.id : null,
            reviewedByUserName: autoApprove ? user?.name : null,
            reviewedAt: autoApprove ? new Date() : null,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        if (autoApprove) {
            // Execute the move immediately
            if ((0, db_js_1.isUsingFallback)()) {
                const sIdx = db_js_1.fallbackStore.staff.findIndex((s) => s.id === staffDoc.id);
                if (sIdx !== -1) {
                    db_js_1.fallbackStore.staff[sIdx].branchId = toBranchId;
                }
            }
            else {
                await Staff_js_1.StaffModel.updateOne({ id: staffDoc.id }, { branchId: toBranchId });
            }
        }
        if ((0, db_js_1.isUsingFallback)()) {
            if (!db_js_1.fallbackStore.transferRequests)
                db_js_1.fallbackStore.transferRequests = [];
            db_js_1.fallbackStore.transferRequests.unshift(newRequestPayload);
            (0, db_js_1.saveFallbackToDisk)();
            return res.status(201).json({
                success: true,
                message: autoApprove
                    ? `Staff ${staffDoc.name} transferred directly to ${targetBranchDoc.name}.`
                    : `Transfer request for ${staffDoc.name} submitted to Super Admin for approval.`,
                data: newRequestPayload,
            });
        }
        const createdReq = await TransferRequest_js_1.TransferRequestModel.create(newRequestPayload);
        res.status(201).json({
            success: true,
            message: autoApprove
                ? `Staff ${staffDoc.name} transferred directly to ${targetBranchDoc.name}.`
                : `Transfer request for ${staffDoc.name} submitted to Super Admin for approval.`,
            data: createdReq,
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.createTransferRequest = createTransferRequest;
// PUT /api/transfers/:id/respond - Superadmin approves or rejects the transfer request
const respondToTransferRequest = async (req, res) => {
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
        let targetReq = null;
        if ((0, db_js_1.isUsingFallback)()) {
            targetReq = (db_js_1.fallbackStore.transferRequests || []).find((r) => r.id === id);
        }
        else {
            targetReq = await TransferRequest_js_1.TransferRequestModel.findOne({ id });
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
            if ((0, db_js_1.isUsingFallback)()) {
                const staffIdx = db_js_1.fallbackStore.staff.findIndex((s) => s.id === targetReq.staffId);
                if (staffIdx !== -1) {
                    db_js_1.fallbackStore.staff[staffIdx].branchId = targetReq.toBranchId;
                }
            }
            else {
                await Staff_js_1.StaffModel.updateOne({ id: targetReq.staffId }, { branchId: targetReq.toBranchId });
            }
        }
        const updates = {
            status: newStatus,
            reviewNotes: (reviewNotes || '').trim(),
            reviewedByUserId: user?.id || null,
            reviewedByUserName: user?.name || null,
            reviewedAt: new Date(),
            updatedAt: new Date(),
        };
        if ((0, db_js_1.isUsingFallback)()) {
            Object.assign(targetReq, updates);
            (0, db_js_1.saveFallbackToDisk)();
            return res.json({
                success: true,
                message: action === 'approve'
                    ? `Transfer approved! Staff ${targetReq.staffName} moved to ${targetReq.toBranchName}.`
                    : `Transfer request marked as ${newStatus}.`,
                data: targetReq,
            });
        }
        const updated = await TransferRequest_js_1.TransferRequestModel.findOneAndUpdate({ id }, updates, { new: true });
        res.json({
            success: true,
            message: action === 'approve'
                ? `Transfer approved! Staff ${targetReq.staffName} moved to ${targetReq.toBranchName}.`
                : `Transfer request marked as ${newStatus}.`,
            data: updated,
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.respondToTransferRequest = respondToTransferRequest;
