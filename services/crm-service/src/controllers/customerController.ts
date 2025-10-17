import { Request, Response } from 'express'
import prisma from '../prismaClient'

export async function getAllCustomers(req: Request, res: Response) {
  try {
    const customers = await prisma.customer.findMany()
    res.json(customers)
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
}