import fs from 'fs/promises';
import { prisma } from '../utils/prisma.js';
import { uploadToCloudinary } from '../utils/cloudinary.js';
import { analyzeText, verifyFace } from '../utils/aiClient.js';

async function finalizePhoto(reqFile) {
  if (!reqFile) return null;

  const cloud = await uploadToCloudinary(reqFile.path, 'safefind/reports');

  if (cloud) {
    try {
      await fs.unlink(reqFile.path);
    } catch {}
    return cloud;
  }

  return `${process.env.BASE_URL || 'http://localhost:5000'}/uploads/${reqFile.filename}`;
}

export async function getReportById(req, res) {
  try {
    const id = Number(req.params.id);

    if (!id || Number.isNaN(id)) {
      return res.status(400).json({ message: 'ID de signalement invalide.' });
    }

    const report = await prisma.report.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            fullname: true,
            reputation: true,
            badges: true,
            role: true,
            city: true,
          },
        },
        alert: {
          select: {
            id: true,
            childName: true,
            photoUrl: true,
            status: true,
            lastSeenLocation: true,
            createdById: true,
          },
        },
      },
    });

    if (!report) {
      return res.status(404).json({ message: 'Signalement introuvable.' });
    }

    return res.json({ report });
  } catch (e) {
    return res.status(500).json({
      message: 'Erreur chargement signalement.',
      error: e.message,
    });
  }
}

export async function createReport(req, res) {
  try {
    const { description, locationLabel, latitude, longitude, seenAt, alertId } = req.body;

    if (!description || !locationLabel || !latitude || !longitude || !seenAt || !alertId) {
      return res.status(400).json({
        message: 'Tous les champs du signalement sont obligatoires.',
      });
    }

    const parsedAlertId = Number(alertId);
    const parsedLatitude = Number(latitude);
    const parsedLongitude = Number(longitude);
    const parsedSeenAt = new Date(seenAt);

    if (!parsedAlertId || Number.isNaN(parsedAlertId)) {
      return res.status(400).json({ message: 'ID alerte invalide.' });
    }

    if (Number.isNaN(parsedLatitude) || Number.isNaN(parsedLongitude)) {
      return res.status(400).json({ message: 'Coordonnées GPS invalides.' });
    }

    if (Number.isNaN(parsedSeenAt.getTime())) {
      return res.status(400).json({ message: 'Date / heure du signalement invalide.' });
    }

    const alert = await prisma.alert.findUnique({
      where: { id: parsedAlertId },
      select: {
        id: true,
        childName: true,
        photoUrl: true,
        createdById: true,
        status: true,
      },
    });

    if (!alert) {
      return res.status(404).json({ message: 'Alerte introuvable.' });
    }

    if (alert.status === 'RESOLVED') {
      return res.status(400).json({
        message: 'Impossible d’ajouter un signalement à une alerte résolue.',
      });
    }

    const photoUrl = await finalizePhoto(req.file);

    let risk = { false_info_risk: 0 };
    let face = { aiConfidence: 0, faceMatchScore: 0 };

    try {
      risk = await analyzeText({ description, locationLabel });
    } catch (error) {
      console.error('Erreur analyse texte IA:', error.message);
    }

    if (alert.photoUrl && photoUrl) {
      try {
        face = await verifyFace({
          referenceImageUrl: alert.photoUrl,
          candidateImageUrl: photoUrl,
        });
      } catch (error) {
        console.error('Erreur comparaison faciale IA:', error.message);
      }
    }

    const report = await prisma.report.create({
      data: {
        description,
        locationLabel,
        latitude: parsedLatitude,
        longitude: parsedLongitude,
        seenAt: parsedSeenAt,
        photoUrl,
        aiConfidence: Math.round(Number(face?.aiConfidence || 0)),
        faceMatchScore: Math.round(Number(face?.faceMatchScore || 0)),
        falseInfoRisk: Math.round(Number(risk?.false_info_risk || 0)),
        verified:
          Number(face?.faceMatchScore || 0) >= 85 &&
          Number(risk?.false_info_risk || 0) <= 20,
        alertId: parsedAlertId,
        userId: req.user.id,
      },
      include: {
        user: {
          select: {
            id: true,
            fullname: true,
            reputation: true,
            badges: true,
            role: true,
            city: true,
          },
        },
        alert: {
          select: {
            id: true,
            childName: true,
            photoUrl: true,
            status: true,
            lastSeenLocation: true,
          },
        },
      },
    });

    if (alert.createdById && alert.createdById !== req.user.id) {
      await prisma.notification.create({
        data: {
          userId: alert.createdById,
          alertId: alert.id,
          title: 'Nouveau signalement',
          message: `${req.user.fullname} a ajouté un signalement pour ${alert.childName}.`,
          type: 'REPORT',
        },
      });
    }

    req.app.get('io')?.emit('report:created', {
      report,
      alertId: alert.id,
    });

    return res.status(201).json({
      message: 'Signalement créé avec succès.',
      report,
      ai: { risk, face },
    });
  } catch (e) {
    return res.status(500).json({
      message: 'Erreur création signalement.',
      error: e.message,
    });
  }
}