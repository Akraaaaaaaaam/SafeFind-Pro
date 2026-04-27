import bcrypt from 'bcryptjs';
import { prisma } from '../utils/prisma.js';
import { signToken } from '../utils/jwt.js';

function publicUser(user) {
  return {
    id: user.id,
    fullname: user.fullname,
    email: user.email,
    phone: user.phone,
    city: user.city,
    addressLabel: user.addressLabel,
    latitude: user.latitude,
    longitude: user.longitude,
    role: user.role,
    reputation: user.reputation,
    badges: user.badges,
    trustScore: user.trustScore,
    privacyAccepted: user.privacyAccepted,
    createdAt: user.createdAt,
  };
}

export async function register(req, res) {
  try {
    const {
      fullname,
      email,
      password,
      phone,
      city,
      latitude,
      longitude,
      addressLabel,
      privacyAccepted,
    } = req.body;

    if (!fullname || !email || !password) {
      return res.status(400).json({
        message: 'Nom complet, email et mot de passe sont obligatoires.',
      });
    }

    if (!privacyAccepted) {
      return res.status(400).json({
        message: 'La confidentialité doit être acceptée.',
      });
    }

    const exists = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (exists) {
      return res.status(400).json({
        message: 'Email déjà utilisé.',
      });
    }

    const user = await prisma.user.create({
      data: {
        fullname: fullname.trim(),
        email: email.trim().toLowerCase(),
        password: await bcrypt.hash(password, 10),
        phone: phone || null,
        city: city || null,
        addressLabel: addressLabel || null,
        latitude: latitude ? Number(latitude) : null,
        longitude: longitude ? Number(longitude) : null,
        privacyAccepted: true,
        badges: ['Nouveau membre'],
        trustScore: 50,
      },
    });

    return res.status(201).json({
      token: signToken(user.id),
      user: publicUser(user),
    });
  } catch (e) {
    return res.status(500).json({
      message: 'Erreur serveur.',
      error: e.message,
    });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;

    const normalizedEmail = String(email || '').trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return res.status(400).json({
        message: 'Identifiants invalides.',
      });
    }

    const ok = await bcrypt.compare(password, user.password);

    if (!ok) {
      return res.status(400).json({
        message: 'Identifiants invalides.',
      });
    }

    return res.json({
      token: signToken(user.id),
      user: publicUser(user),
    });
  } catch (e) {
    return res.status(500).json({
      message: 'Erreur serveur.',
      error: e.message,
    });
  }
}

export { publicUser };