import fs from 'fs/promises';
import { prisma } from '../utils/prisma.js';
import {
  computeCompletenessScore,
  computeFalseInfoScore,
  computePriorityScore,
  explainScores,
} from '../utils/scores.js';
import { uploadToCloudinary } from '../utils/cloudinary.js';

function getElapsedText(date) {
  const diffMs = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diffMs / 60000);

  if (mins < 60) return `il y a ${mins} min`;

  const hours = Math.floor(mins / 60);
  if (hours < 24) return `il y a ${hours} h`;

  return `il y a ${Math.floor(hours / 24)} j`;
}

function distanceKm(lat1, lon1, lat2, lon2) {
  const toRad = (v) => (v * Math.PI) / 180;
  const R = 6371;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;

  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function enrichAlert(alert, nearLat, nearLng) {
  const hasCoords =
    nearLat !== null &&
    nearLat !== undefined &&
    nearLng !== null &&
    nearLng !== undefined;

  const distance = hasCoords
    ? distanceKm(nearLat, nearLng, alert.latitude, alert.longitude)
    : null;

  return {
    ...alert,
    elapsed: getElapsedText(alert.missingSince),
    reportCount: alert.reports?.length || 0,
    messageCount: alert.messages?.length || 0,
    distanceKm: distance !== null ? Number(distance.toFixed(1)) : null,
    scoreExplanation: explainScores(alert),
  };
}

async function finalizePhoto(reqFile, fallback) {
  if (!reqFile) return fallback || null;

  const cloud = await uploadToCloudinary(reqFile.path, 'safefind/alerts');

  if (cloud) {
    try {
      await fs.unlink(reqFile.path);
    } catch {}
    return cloud;
  }

  return `${process.env.BASE_URL || 'http://localhost:5000'}/uploads/${reqFile.filename}`;
}

function normalizeAlertPayload(body, photoUrl) {
  return {
    childName: String(body.childName || '').trim(),
    age: Number(body.age),
    gender: body.gender,
    heightCm: Number(body.heightCm),
    weightKg: Number(body.weightKg),
    eyeColor: body.eyeColor,
    hairColor: body.hairColor,
    clothesTop: body.clothesTop,
    clothesBottom: body.clothesBottom,
    shoes: body.shoes,
    accessories: body.accessories || null,
    distinctiveSigns: body.distinctiveSigns || null,
    medicalNotes: body.medicalNotes || null,
    emergencyContacts: body.emergencyContacts || null,
    photoUrl: photoUrl || null,
    description: body.description,
    lastSeenLocation: body.lastSeenLocation,
    latitude: Number(body.latitude),
    longitude: Number(body.longitude),
    missingSince: new Date(body.missingSince),
    radius: Number(body.radius || 2500),
  };
}

function validateAlertBody(body) {
  const required = [
    'childName',
    'age',
    'gender',
    'heightCm',
    'weightKg',
    'eyeColor',
    'hairColor',
    'clothesTop',
    'clothesBottom',
    'shoes',
    'description',
    'lastSeenLocation',
    'latitude',
    'longitude',
    'missingSince',
  ];

  for (const key of required) {
    if (!body[key] && body[key] !== 0) {
      return `Champ manquant: ${key}`;
    }
  }

  if (Number.isNaN(Number(body.age))) return 'Âge invalide.';
  if (Number.isNaN(Number(body.heightCm))) return 'Taille invalide.';
  if (Number.isNaN(Number(body.weightKg))) return 'Poids invalide.';
  if (Number.isNaN(Number(body.latitude))) return 'Latitude invalide.';
  if (Number.isNaN(Number(body.longitude))) return 'Longitude invalide.';
  if (Number.isNaN(new Date(body.missingSince).getTime())) {
    return 'Date de disparition invalide.';
  }

  return null;
}

function canManageAlert(alert, user) {
  return (
    Number(alert.createdById) === Number(user.id) ||
    ['ADMIN', 'MODERATOR'].includes(user.role)
  );
}

async function fetchAlertFull(id) {
  return prisma.alert.findUnique({
    where: { id },
    include: {
      createdBy: {
        select: {
          id: true,
          fullname: true,
          city: true,
          role: true,
        },
      },
      reports: {
        include: {
          user: {
            select: {
              id: true,
              fullname: true,
              reputation: true,
              badges: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
      messages: {
        include: {
          user: {
            select: {
              id: true,
              fullname: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      },
      moderationActions: {
        include: {
          actor: {
            select: {
              id: true,
              fullname: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });
}

export async function getAlerts(req, res) {
  try {
    const nearLat = req.query.nearLat ? Number(req.query.nearLat) : null;
    const nearLng = req.query.nearLng ? Number(req.query.nearLng) : null;
    const status = req.query.status;

    let where = {};

    if (status) {
      where.status = status;
    } else {
      // Par défaut, seules les alertes approuvées sont visibles publiquement
      where.status = 'ACTIVE';
    }

    const alerts = await prisma.alert.findMany({
      where,
      orderBy: [
        { priorityScore: 'desc' },
        { createdAt: 'desc' },
      ],
      include: {
        createdBy: {
          select: {
            id: true,
            fullname: true,
            city: true,
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
    });

    return res.json({
      alerts: alerts.map((a) => enrichAlert(a, nearLat, nearLng)),
    });
  } catch (e) {
    return res.status(500).json({
      message: 'Erreur chargement des alertes.',
      error: e.message,
    });
  }
}

export async function getAlertById(req, res) {
  try {
    const id = Number(req.params.id);

    if (!id || Number.isNaN(id)) {
      return res.status(400).json({ message: 'ID alerte invalide.' });
    }

    const alert = await fetchAlertFull(id);

    if (!alert) {
      return res.status(404).json({ message: 'Alerte introuvable.' });
    }

    const isManager = canManageAlert(alert, req.user);

    // Si l’alerte n’est pas ACTIVE, seuls le créateur/admin/mod peuvent la voir
    if (alert.status !== 'ACTIVE' && !isManager) {
      return res.status(403).json({
        message: 'Cette alerte n’est pas accessible.',
      });
    }

    const enriched = enrichAlert(alert);

    return res.json({
      alert: {
        ...enriched,
        canEdit: isManager && alert.status !== 'RESOLVED',
        canResolve: isManager && alert.status === 'ACTIVE',
      },
    });
  } catch (e) {
    return res.status(500).json({
      message: 'Erreur chargement alerte.',
      error: e.message,
    });
  }
}

export async function createAlert(req, res) {
  try {
    const validationError = validateAlertBody(req.body);

    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const photoUrl = await finalizePhoto(req.file, req.body.photoUrl);
    const normalized = normalizeAlertPayload(req.body, photoUrl);

    const completenessScore = computeCompletenessScore(normalized);
    const falseInfoScore = computeFalseInfoScore(normalized);
    const priorityScore = computePriorityScore(normalized);

    // Nouvelle logique :
    // - utilisateur normal => UNDER_REVIEW
    // - admin/mod => ACTIVE direct
    const initialStatus =
      req.user.role === 'ADMIN' || req.user.role === 'MODERATOR'
        ? 'ACTIVE'
        : 'UNDER_REVIEW';

    const alert = await prisma.alert.create({
      data: {
        ...normalized,
        falseInfoScore,
        completenessScore,
        priorityScore,
        status: initialStatus,
        createdById: req.user.id,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            fullname: true,
            city: true,
            role: true,
          },
        },
        reports: true,
        messages: true,
      },
    });

    if (initialStatus === 'UNDER_REVIEW') {
      const moderators = await prisma.user.findMany({
        where: {
          role: { in: ['ADMIN', 'MODERATOR'] },
        },
        select: { id: true },
      });

      if (moderators.length) {
        await prisma.notification.createMany({
          data: moderators.map((moderator) => ({
            userId: moderator.id,
            alertId: alert.id,
            title: 'Nouvelle alerte à valider',
            message: `${alert.childName} a été signalé(e) disparu(e) et attend une validation.`,
            type: 'ALERT',
          })),
        });
      }
    } else {
      const users = await prisma.user.findMany({
        where: { id: { not: req.user.id } },
        select: { id: true },
      });

      if (users.length) {
        await prisma.notification.createMany({
          data: users.map((user) => ({
            userId: user.id,
            alertId: alert.id,
            title: `Nouvelle alerte : ${alert.childName}`,
            message: `${alert.childName} a été signalé(e) disparu(e) à ${alert.lastSeenLocation}.`,
            type: 'ALERT',
          })),
        });
      }
    }

    await prisma.moderationAction.create({
      data: {
        action: 'CREATE_ALERT',
        actorId: req.user.id,
        alertId: alert.id,
        reason:
          initialStatus === 'UNDER_REVIEW'
            ? 'Création alerte en attente de validation'
            : 'Création alerte approuvée automatiquement',
      },
    });

    req.app.get('io')?.emit('alert:created', enrichAlert(alert));

    return res.status(201).json({
      message:
        initialStatus === 'UNDER_REVIEW'
          ? 'Alerte créée et envoyée pour validation.'
          : 'Alerte créée avec succès.',
      alert: enrichAlert(alert),
    });
  } catch (e) {
    return res.status(500).json({
      message: 'Erreur création alerte.',
      error: e.message,
    });
  }
}

export async function updateAlert(req, res) {
  try {
    const id = Number(req.params.id);

    if (!id || Number.isNaN(id)) {
      return res.status(400).json({ message: 'ID alerte invalide.' });
    }

    const existing = await prisma.alert.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({ message: 'Alerte introuvable.' });
    }

    if (!canManageAlert(existing, req.user)) {
      return res.status(403).json({
        message: 'Seul le créateur ou la modération peut modifier cette alerte.',
      });
    }

    const mergedBody = {
      childName: req.body.childName ?? existing.childName,
      age: req.body.age ?? existing.age,
      gender: req.body.gender ?? existing.gender,
      heightCm: req.body.heightCm ?? existing.heightCm,
      weightKg: req.body.weightKg ?? existing.weightKg,
      eyeColor: req.body.eyeColor ?? existing.eyeColor,
      hairColor: req.body.hairColor ?? existing.hairColor,
      clothesTop: req.body.clothesTop ?? existing.clothesTop,
      clothesBottom: req.body.clothesBottom ?? existing.clothesBottom,
      shoes: req.body.shoes ?? existing.shoes,
      accessories: req.body.accessories ?? existing.accessories,
      distinctiveSigns: req.body.distinctiveSigns ?? existing.distinctiveSigns,
      medicalNotes: req.body.medicalNotes ?? existing.medicalNotes,
      emergencyContacts: req.body.emergencyContacts ?? existing.emergencyContacts,
      description: req.body.description ?? existing.description,
      lastSeenLocation: req.body.lastSeenLocation ?? existing.lastSeenLocation,
      latitude: req.body.latitude ?? existing.latitude,
      longitude: req.body.longitude ?? existing.longitude,
      missingSince: req.body.missingSince ?? existing.missingSince,
      radius: req.body.radius ?? existing.radius,
      photoUrl: existing.photoUrl,
    };

    const validationError = validateAlertBody(mergedBody);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const photoUrl = await finalizePhoto(req.file, existing.photoUrl);
    const normalized = normalizeAlertPayload(mergedBody, photoUrl);

    const completenessScore = computeCompletenessScore(normalized);
    const falseInfoScore = computeFalseInfoScore(normalized);
    const priorityScore = computePriorityScore(normalized);

    // Si utilisateur normal modifie une alerte, elle repasse en revue
    const nextStatus =
      req.user.role === 'ADMIN' || req.user.role === 'MODERATOR'
        ? existing.status
        : existing.status === 'RESOLVED'
        ? 'RESOLVED'
        : 'UNDER_REVIEW';

    const updated = await prisma.alert.update({
      where: { id },
      data: {
        ...normalized,
        falseInfoScore,
        completenessScore,
        priorityScore,
        status: nextStatus,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            fullname: true,
            city: true,
            role: true,
          },
        },
        reports: true,
        messages: true,
      },
    });

    await prisma.moderationAction.create({
      data: {
        action: 'UPDATE_ALERT',
        actorId: req.user.id,
        alertId: id,
        reason:
          nextStatus === 'UNDER_REVIEW'
            ? 'Alerte modifiée puis renvoyée en revue'
            : 'Alerte modifiée',
      },
    });

    if (nextStatus === 'UNDER_REVIEW') {
      const moderators = await prisma.user.findMany({
        where: {
          role: { in: ['ADMIN', 'MODERATOR'] },
        },
        select: { id: true },
      });

      if (moderators.length) {
        await prisma.notification.createMany({
          data: moderators.map((moderator) => ({
            userId: moderator.id,
            alertId: updated.id,
            title: 'Alerte modifiée à revalider',
            message: `L’alerte de ${updated.childName} a été modifiée et doit être revue.`,
            type: 'ALERT',
          })),
        });
      }
    }

    req.app.get('io')?.emit('alert:updated', enrichAlert(updated));

    return res.json({
      message: 'Alerte modifiée avec succès.',
      alert: enrichAlert(updated),
    });
  } catch (e) {
    return res.status(500).json({
      message: 'Erreur modification alerte.',
      error: e.message,
    });
  }
}

export async function resolveAlert(req, res) {
  try {
    const id = Number(req.params.id);

    if (!id || Number.isNaN(id)) {
      return res.status(400).json({ message: 'ID alerte invalide.' });
    }

    const alert = await prisma.alert.findUnique({
      where: { id },
    });

    if (!alert) {
      return res.status(404).json({ message: 'Alerte introuvable.' });
    }

    if (!canManageAlert(alert, req.user)) {
      return res.status(403).json({
        message: 'Seul le créateur ou la modération peut clôturer.',
      });
    }

    const updated = await prisma.alert.update({
      where: { id },
      data: {
        status: 'RESOLVED',
        resolvedAt: new Date(),
      },
      include: {
        createdBy: {
          select: {
            id: true,
            fullname: true,
            city: true,
            role: true,
          },
        },
        reports: true,
        messages: true,
      },
    });

    await prisma.moderationAction.create({
      data: {
        action: 'RESOLVE_ALERT',
        actorId: req.user.id,
        alertId: id,
        reason: 'Cas marqué comme résolu',
      },
    });

    req.app.get('io')?.emit('alert:resolved', enrichAlert(updated));

    return res.json({
      message: 'Alerte marquée comme résolue.',
      alert: enrichAlert(updated),
    });
  } catch (e) {
    return res.status(500).json({
      message: 'Erreur résolution alerte.',
      error: e.message,
    });
  }
}