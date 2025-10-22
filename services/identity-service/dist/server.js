'use strict';
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
const app_1 = __importDefault(require('./app'));
const dotenv_1 = __importDefault(require('dotenv'));
dotenv_1.default.config();
console.log('>>> DEBUG JWT_SECRET =', process.env.JWT_SECRET);
const PORT = process.env.PORT || 3001;
app_1.default.listen(PORT, () =>
  console.log(`Identity Service running on port ${PORT}`)
);
