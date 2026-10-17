"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const loanAdvanceController_js_1 = require("../controllers/loanAdvanceController.js");
const router = (0, express_1.Router)();
router.get('/', loanAdvanceController_js_1.getLoanAdvanceEntries);
router.post('/', loanAdvanceController_js_1.createLoanAdvanceEntry);
router.delete('/:id', loanAdvanceController_js_1.deleteLoanAdvanceEntry);
exports.default = router;
