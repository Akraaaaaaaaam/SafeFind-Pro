import { prisma } from '../utils/prisma.js';

export async function getNotifications(req, res) {
  const notifications = await prisma.notification.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: 'desc' },
    include: {
      alert: {
        select: {
          childName: true,
          lastSeenLocation: true,
        },
      },
    },
  });

  res.json({ notifications });
}

export async function markRead(req, res) {
  const notification = await prisma.notification.update({
    where: { id: Number(req.params.id) },
    data: { isRead: true },
  });

  res.json({ notification });
}

export async function markAllRead(req, res) {
  await prisma.notification.updateMany({
    where: {
      userId: req.user.id,
      isRead: false,
    },
    data: {
      isRead: true,
    },
  });

  res.json({ message: 'Toutes les notifications ont été marquées comme lues.' });
}