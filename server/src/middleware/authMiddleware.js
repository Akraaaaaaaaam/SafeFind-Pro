
import jwt from 'jsonwebtoken';
import { prisma } from '../utils/prisma.js';

export async function requireAuth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Token manquant.' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: payload.id } });
    if (!user) return res.status(401).json({ message: 'Utilisateur introuvable.' });
    req.user = user;
    next();
  } catch {
    res.status(401).json({ message: 'Token invalide.' });
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) return res.status(403).json({ message: 'Accès refusé.' });
    next();
  };
}
