"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userController_js_1 = require("../controllers/userController.js");
const authMiddleware_js_1 = require("../middleware/authMiddleware.js");
const router = (0, express_1.Router)();
// Only Super Admin can view, create, edit, or delete users
router.use(authMiddleware_js_1.authenticateToken, authMiddleware_js_1.requireSuperAdmin);
router.get('/', userController_js_1.getUsers);
router.post('/', userController_js_1.createUser);
router.put('/:id', userController_js_1.updateUser);
router.delete('/:id', userController_js_1.deleteUser);
exports.default = router;
