import * as jwt from 'jsonwebtoken';

const SECRET = (process.env.JWT_SECRET || 'default_secret') as jwt.Secret;

export function sign(payload: object, expiresIn: jwt.SignOptions['expiresIn'] = '1h'): string {
  const options: jwt.SignOptions = { expiresIn };
  return jwt.sign(payload as jwt.JwtPayload | string, SECRET, options);
}

export function verify(token: string): string | jwt.JwtPayload {
  return jwt.verify(token, SECRET) as string | jwt.JwtPayload;
}
