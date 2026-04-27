import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.notification.deleteMany();
  await prisma.message.deleteMany();
  await prisma.report.deleteMany();
  await prisma.moderationAction.deleteMany();
  await prisma.alert.deleteMany();
  await prisma.user.deleteMany();

  const password = await bcrypt.hash("12345678", 10);

  const admin = await prisma.user.create({
    data: {
      fullname: "Admin SafeFind",
      email: "admin@safefind.com",
      password,
      phone: "+212600000000",
      city: "Casablanca",
      latitude: 33.5731,
      longitude: -7.5898,
      role: "ADMIN",
      privacyAccepted: true,
      badges: ["Superviseur", "Admin"],
      trustScore: 95,
      reputation: 99,
    },
  });

  const mod = await prisma.user.create({
    data: {
      fullname: "Moderateur SafeFind",
      email: "moderator@safefind.com",
      password,
      phone: "+212611111111",
      city: "Rabat",
      latitude: 34.0209,
      longitude: -6.8416,
      role: "MODERATOR",
      privacyAccepted: true,
      badges: ["Modérateur"],
      trustScore: 88,
      reputation: 90,
    },
  });

  const user = await prisma.user.create({
    data: {
      fullname: "Utilisateur Demo",
      email: "demo@safefind.com",
      password,
      phone: "+212622222222",
      city: "Casablanca",
      latitude: 33.584,
      longitude: -7.603,
      role: "USER",
      privacyAccepted: true,
      badges: ["Bon Samaritain", "Membre de confiance"],
      trustScore: 76,
      reputation: 84,
    },
  });

  const a1 = await prisma.alert.create({
    data: {
      childName: "Sophie Martin",
      age: 7,
      gender: "Fille",
      heightCm: 123,
      weightKg: 24,
      eyeColor: "Marron",
      hairColor: "Brun",
      clothesTop: "Robe bleue",
      clothesBottom: "Legging blanc",
      shoes: "Baskets roses",
      accessories: "Bracelet jaune",
      distinctiveSigns: "Lunettes rondes",
      description:
        "Vue pour la dernière fois près du marché central. Très sociable mais timide avec les inconnus.",
      lastSeenLocation: "Marché Central, Casablanca",
      latitude: 33.589,
      longitude: -7.6114,
      missingSince: new Date(Date.now() - 2 * 3600 * 1000),
      radius: 2500,
      photoUrl:
        "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?auto=format&fit=crop&w=500&q=80",
      falseInfoScore: 8,
      completenessScore: 96,
      priorityScore: 94,
      faceSearchStatus: "ready",
      createdById: user.id,
    },
  });

  await prisma.report.createMany({
    data: [
      {
        description:
          "Enfant ressemblante vue près de la boulangerie en train de marcher vers le nord.",
        locationLabel: "Rue Victor Hugo",
        latitude: 33.5901,
        longitude: -7.6089,
        seenAt: new Date(Date.now() - 20 * 60000),
        photoUrl: null,
        aiConfidence: 82,
        faceMatchScore: 78,
        falseInfoRisk: 14,
        verified: true,
        alertId: a1.id,
        userId: mod.id,
      },
      {
        description:
          "Possiblement aperçue près du tram, accompagnée d'une femme.",
        locationLabel: "Place Mohammed V",
        latitude: 33.5908,
        longitude: -7.6184,
        seenAt: new Date(Date.now() - 35 * 60000),
        photoUrl: null,
        aiConfidence: 71,
        faceMatchScore: 66,
        falseInfoRisk: 22,
        verified: false,
        alertId: a1.id,
        userId: user.id,
      },
    ],
  });

  await prisma.message.createMany({
    data: [
      {
        content:
          "Merci de confirmer toute observation avec le plus de détails possible.",
        alertId: a1.id,
        userId: admin.id,
      },
      {
        content: "J'ai ajouté un signalement avec la rue exacte.",
        alertId: a1.id,
        userId: user.id,
      },
    ],
  });

  await prisma.notification.createMany({
    data: [
      {
        title: "Nouvelle alerte proche",
        message: "Sophie Martin a été signalée disparue près de vous.",
        type: "ALERT",
        userId: user.id,
        alertId: a1.id,
      },
      {
        title: "Signalement reçu",
        message: "Un nouveau témoin a ajouté une observation.",
        type: "REPORT",
        userId: admin.id,
        alertId: a1.id,
      },
    ],
  });

  await prisma.moderationAction.create({
    data: {
      action: "INITIAL_REVIEW",
      reason: "Vérification initiale du dossier",
      actorId: admin.id,
      alertId: a1.id,
    },
  });

  console.log("Seed terminé.");
}

main()
  .catch((error) => {
    console.error("Erreur pendant le seed :", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });