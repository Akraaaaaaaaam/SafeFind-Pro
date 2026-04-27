
import { prisma } from '../utils/prisma.js';
export async function getAnalytics(req, res) {
  const [alerts, users, reports] = await Promise.all([
    prisma.alert.findMany(), prisma.user.findMany(), prisma.report.findMany()
  ]);
  const byLocation = {};
  const byHour = Array.from({ length: 24 }, (_, h) => ({ hour: h, count: 0 }));
  alerts.forEach((a) => {
    const key = a.lastSeenLocation.split(',')[0]; byLocation[key] = (byLocation[key] || 0) + 1;
    byHour[new Date(a.missingSince).getHours()].count += 1;
  });
  res.json({
    totals: { alerts: alerts.length, active: alerts.filter(a => a.status === 'ACTIVE').length, resolved: alerts.filter(a => a.status === 'RESOLVED').length, users: users.length, reports: reports.length },
    topLocations: Object.entries(byLocation).map(([name, count]) => ({ name, count })).sort((a,b) => b.count - a.count).slice(0, 10),
    byHour,
    userRoles: ['USER','MODERATOR','ADMIN'].map((role) => ({ role, count: users.filter((u) => u.role === role).length })),
    badgeStats: users.flatMap((u) => u.badges).reduce((acc, b) => ((acc[b] = (acc[b] || 0) + 1), acc), {}),
    explanation: {
      priority: 'Score calculé avec âge, ancienneté de la disparition, précision de la zone, complétude du dossier et validations reçues.',
      falseInfo: 'Risque calculé avec complétude, cohérence des champs, présence photo/GPS et contrôles IA texte + image.',
    },
  });
}
