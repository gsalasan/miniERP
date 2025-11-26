import express from 'express';
import { register, login, me, getUsers, updateUser, deleteUser } from '../controllers/auth.controller';
import { verifyToken } from '../middlewares/auth.middleware';

const router = express.Router();


router.post('/register', register);
router.post('/login', login);
router.get('/me', verifyToken, me);
router.get('/users', verifyToken, getUsers);
router.put('/users/:id', verifyToken, updateUser);
router.delete('/users/:id', verifyToken, deleteUser);

export default router;
