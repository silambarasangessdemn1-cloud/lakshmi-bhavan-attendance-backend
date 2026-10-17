"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const paymentController_js_1 = require("../controllers/paymentController.js");
const router = (0, express_1.Router)();
router.get('/', paymentController_js_1.getPayments);
router.post('/', paymentController_js_1.recordPayment);
router.delete('/:id', paymentController_js_1.deletePayment);
exports.default = router;
