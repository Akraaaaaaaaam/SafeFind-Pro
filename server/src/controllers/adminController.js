import { prisma } from '../utils/prisma.js';

export async function getDashboard(_req, res) {
  try {
    const [
      totalUsers,
      totalAlerts,
      totalReports,
      totalModeration,
      underReviewAlerts,
      activeAlerts,
      archivedAlerts,
      resolvedAlerts,
      users,
      pendingAlerts,
      recentAlerts,
      reports,
      moderation,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.alert.count(),
      prisma.report.count(),
      prisma.moderationAction.count(),
      prisma.alert.count({ where: { status: 'UNDER_REVIEW' } }),
      prisma.alert.count({ where: { status: 'ACTIVE' } }),
      prisma.alert.count({ where: { status: 'ARCHIVED' } }),
      prisma.alert.count({ where: { status: 'RESOLVED' } }),

      prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          fullname: true,
          email: true,
          role: true,
          city: true,
          reputation: true,
          trustScore: true,
          createdAt: true,
        },
      }),

      prisma.alert.findMany({
        where: { status: 'UNDER_REVIEW' },
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: {
          createdBy: {
            select: {
              id: true,
              fullname: true,
              role: true,
            },
          },
          reports: {
            select: { id: true },
          },
          messages: {
            select: { id: true },
          },
        },
      }),

      prisma.alert.findMany({
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: {
          createdBy: {
            select: {
              id: true,
              fullname: true,
              role: true,
            },
          },
          reports: {
            select: { id: true },
          },
          messages: {
            select: { id: true },
          },
        },
      }),

      prisma.report.findMany({
        orderBy: [
          { falseInfoRisk: 'desc' },
          { createdAt: 'desc' },
        ],
        take: 20,
        include: {
          user: {
            select: {
              fullname: true,
              reputation: true,
              badges: true,
            },
          },
          alert: {
            select: {
              id: true,
              childName: true,
              status: true,
            },
          },
        },
      }),

      prisma.moderationAction.findMany({
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: {
          actor: {
            select: {
              fullname: true,
              role: true,
            },
          },
          alert: {
            select: {
              childName: true,
              status: true,
            },
          },
        },
      }),
    ]);

    const normalizeAlert = (alert) => ({
      ...alert,
      reportCount: alert.reports?.length || 0,
      messageCount: alert.messages?.length || 0,
    });

    res.json({
      stats: {
        totalUsers,
        totalAlerts,
        totalReports,
        totalModeration,
        underReviewAlerts,
        activeAlerts,
        archivedAlerts,
        resolvedAlerts,
      },
      users,
      pendingAlerts: pendingAlerts.map(normalizeAlert),
      recentAlerts: recentAlerts.map(normalizeAlert),
      reports,
      moderation,
    });
  } catch (e) {
    res.status(500).json({
      message: 'Erreur chargement dashboard admin.',
      error: e.message,
    });
  }
}

export async function reviewAlert(req, res) {
  try {
    const id = Number(req.params.id);
    const { action, reason } = req.body;

    const alert = await prisma.alert.findUnique({
      where: { id },
    });

    if (!alert) {
      return res.status(404).json({ message: 'Alerte introuvable.' });
    }

    let data = null;
    let moderationActionLabel = null;

    if (action === 'approve') {
      data = { status: 'ACTIVE' };
      moderationActionLabel = 'APPROVE';
    } else if (action === 'review') {
      data = { status: 'UNDER_REVIEW' };
      moderationActionLabel = 'REVIEW';
    } else if (action === 'archive') {
      data = { status: 'ARCHIVED' };
      moderationActionLabel = 'ARCHIVE';
    } else if (action === 'resolve') {
      data = { status: 'RESOLVED', resolvedAt: new Date() };
      moderationActionLabel = 'RESOLVE';
    } else {
      return res.status(400).json({ message: 'Action invalide.' });
    }

    const updatedAlert = await prisma.alert.update({
      where: { id },
      data,
    });

    await prisma.moderationAction.create({
      data: {
        action: moderationActionLabel,
        reason: reason || `Action ${action} depuis admin panel`,
        actorId: req.user.id,
        alertId: id,
      },
    });

    if (alert.createdById) {
      await prisma.notification.create({
        data: {
          userId: alert.createdById,
          alertId: alert.id,
          title: 'Mise à jour de votre alerte',
          message:
            action === 'approve'
              ? `Votre alerte pour ${alert.childName} a été approuvée.`
              : action === 'review'
              ? `Votre alerte pour ${alert.childName} est en cours de revue.`
              : action === 'archive'
              ? `Votre alerte pour ${alert.childName} a été archivée.`
              : `Votre alerte pour ${alert.childName} a été marquée comme résolue.`,
          type: 'ALERT',
        },
      });
    }

    req.app.get('io').emit('alert:moderated', {
      id,
      action,
      reason,
    });

    if (action === 'resolve') {
      req.app.get('io').emit('alert:resolved', {
        id,
      });
    }

    res.json({ alert: updatedAlert });
  } catch (e) {
    res.status(500).json({
      message: 'Erreur modération alerte.',
      error: e.message,
    });
  }
}