import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { sign } from '../utils/jwt';

export async function login(req: Request, res: Response) {
  const { username, password } = req.body;
  const user = await AuthService.login(username, password);
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });
  const token = sign({ sub: user.id });
  return res.json({ user, token });
}
