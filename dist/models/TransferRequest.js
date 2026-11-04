"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransferRequestModel = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const TransferRequestSchema = new mongoose_1.Schema({
    id: { type: String, required: true, unique: true, trim: true },
    staffId: { type: String, required: true, index: true, trim: true },
    staffName: { type: String, required: true, trim: true },
    fromBranchId: { type: String, required: true, index: true, trim: true },
    fromBranchName: { type: String, default: '', trim: true },
    toBranchId: { type: String, required: true, index: true, trim: true },
    toBranchName: { type: String, default: '', trim: true },
    reason: { type: String, default: '', trim: true },
    requestedByUserId: { type: String, required: true, trim: true },
    requestedByUserName: { type: String, required: true, trim: true },
    requestedByUserRole: { type: String, required: true, trim: true },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'cancelled'],
        default: 'pending',
        index: true,
    },
    reviewedByUserId: { type: String, default: null },
    reviewedByUserName: { type: String, default: null },
    reviewNotes: { type: String, default: '' },
    reviewedAt: { type: Date, default: null },
}, { timestamps: true });
exports.TransferRequestModel = mongoose_1.default.model('TransferRequest', TransferRequestSchema);
