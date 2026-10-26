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
exports.PaymentModel = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const PaymentSchema = new mongoose_1.Schema({
    id: { type: String, required: true, unique: true },
    date: { type: String, required: true },
    month: { type: String, required: true, index: true },
    staffId: { type: String, required: true, index: true },
    staffName: { type: String, required: true },
    branchId: { type: String, default: '', index: true },
    dailyWage: { type: Number, default: 0 },
    daysPresent: { type: Number, default: 0 },
    otHours: { type: Number, default: 0 },
    otRate: { type: Number, default: 0 },
    otEarnings: { type: Number, default: 0 },
    gross: { type: Number, default: 0 },
    advance: { type: Number, default: 0 },
    loanDeduct: { type: Number, default: 0 },
    loanAdded: { type: Number, default: 0 },
    net: { type: Number, default: 0 },
    status: { type: String, enum: ['Paid', 'Pending'], default: 'Paid' },
    paymentMethod: {
        type: String,
        enum: ['Bank Transfer', 'Cash', 'UPI', 'Cheque'],
        default: 'Bank Transfer',
    },
    notes: { type: String, default: '' },
    timestamp: { type: Number, default: () => Date.now() },
}, { timestamps: true });
PaymentSchema.index({ staffId: 1, month: 1 }, { unique: true });
exports.PaymentModel = mongoose_1.default.model('Payment', PaymentSchema);
