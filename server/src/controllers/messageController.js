
import { prisma } from '../utils/prisma.js';
export async function createMessage(req, res) {
  const { alertId, content } = req.body;
  if (!alertId || !content?.trim()) return res.status(400).json({ message: 'Message requis.' });
  const message = await prisma.message.create({ data: { alertId: Number(alertId), userId: req.user.id, content: content.trim() }, include: { user: { select: { fullname: true, role: true } } } });
  req.app.get('io').emit('message:created', { alertId: Number(alertId), message });
  res.status(201).json({ message });
}
