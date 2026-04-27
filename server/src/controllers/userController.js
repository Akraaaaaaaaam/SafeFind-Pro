import { prisma } from '../utils/prisma.js';
import { publicUser } from './authController.js';

async function buildUserProfile(userId) {
  const [user, alertsCount, reportsCount, messagesCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
    }),
    prisma.alert.count({
      where: { createdById: userId },
    }),
    prisma.report.count({
      where: { userId },
    }),
    prisma.message.count({
      where: { userId },
    }),
  ]);

  if (!user) return null;

  return {
    ...publicUser(user),
    stats: {
      alerts: alertsCount,
      reports: reportsCount,
      messages: messagesCount,
    },
  };
}

export async function me(req, res) {
  try {
    const user = await buildUserProfile(req.user.id);

    if (!user) {
      return res.status(404).json({
        message: 'Utilisateur introuvable.',
      });
    }

    return res.json({ user });
  } catch (e) {
    return res.status(500).json({
      message: 'Erreur chargement profil.',
      error: e.message,
    });
  }
}

export async function updateMe(req, res) {
  try {
    const data = req.body;

    await prisma.user.update({
      where: { id: req.user.id },
      data: {
        fullname: data.fullname ?? undefined,
        phone: data.phone ?? undefined,
        city: data.city ?? undefined,
        addressLabel: data.addressLabel ?? undefined,
        latitude:
          data.latitude !== undefined && data.latitude !== ''
            ? Number(data.latitude)
            : undefined,
        longitude:
          data.longitude !== undefined && data.longitude !== ''
            ? Number(data.longitude)
            : undefined,
      },
    });

    const user = await buildUserProfile(req.user.id);

    return res.json({ user });
  } catch (e) {
    return res.status(500).json({
      message: 'Erreur mise à jour profil.',
      error: e.message,
    });
  }
}