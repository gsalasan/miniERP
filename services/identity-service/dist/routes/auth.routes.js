<<<<<<< HEAD
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_controller_1 = require("../controllers/auth.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
=======
'use strict';
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
const express_1 = __importDefault(require('express'));
const auth_controller_1 = require('../controllers/auth.controller');
const auth_middleware_1 = require('../middlewares/auth.middleware');
>>>>>>> 6c6414a2e06e792d93f5a08b707d09549e5d8987
const router = express_1.default.Router();
router.post('/register', auth_controller_1.register);
router.post('/login', auth_controller_1.login);
router.get('/me', auth_middleware_1.verifyToken, auth_controller_1.me);
exports.default = router;
<<<<<<< HEAD
//# sourceMappingURL=auth.routes.js.map
=======
>>>>>>> 6c6414a2e06e792d93f5a08b707d09549e5d8987
