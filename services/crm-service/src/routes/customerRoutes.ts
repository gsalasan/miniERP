import { Router } from 'express'
import { verifyToken } from '../middlewares/authMiddleware'
import { getAllCustomers } from '../controllers/customerController'

const router = Router()

router.get('/', verifyToken, getAllCustomers)

export default router
