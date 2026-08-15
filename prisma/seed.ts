import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const club = await prisma.club.upsert({
    where: { slug: "club-badminton-demo" },
    update: {},
    create: {
      name: "Club Bádminton Demo",
      slug: "club-badminton-demo",
      email: "info@club.local",
      phone: "600 000 000",
      address: "Calle Demo 1",
      timezone: "Europe/Madrid",
      currency: "EUR",
    },
  });

  const adminEmail = "admin@club.com";
  const adminPasswordHash = await hash("Admin123!", 10);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      clubId: club.id,
      role: "ADMIN",
      isActive: true,
    },
    create: {
      clubId: club.id,
      email: adminEmail,
      passwordHash: adminPasswordHash,
      fullName: "Administrador",
      role: "ADMIN",
      isActive: true,
    },
  });

  await prisma.member.upsert({
    where: { userId: admin.id },
    update: {
      clubId: club.id,
    },
    create: {
      userId: admin.id,
      clubId: club.id,
      memberCode: "ADM-001",
      category: "ADMIN",
      status: "ACTIVE",
      medicalCertificate: true,
      imageAuthorization: true,
    },
  });

  const socioEmail = "socio@club.com";
  const socioPasswordHash = await hash("Socio123!", 10);

  const socio = await prisma.user.upsert({
    where: { email: socioEmail },
    update: {
      clubId: club.id,
      role: "MEMBER",
      isActive: true,
    },
    create: {
      clubId: club.id,
      email: socioEmail,
      passwordHash: socioPasswordHash,
      fullName: "Socio Demo",
      phone: "600 111 222",
      role: "MEMBER",
      isActive: true,
    },
  });

  const member = await prisma.member.upsert({
    where: { userId: socio.id },
    update: {
      clubId: club.id,
    },
    create: {
      userId: socio.id,
      clubId: club.id,
      memberCode: "SOC-001",
      category: "ADULTO",
      status: "ACTIVE",
      medicalCertificate: true,
      imageAuthorization: true,
      birthDate: new Date("1990-01-01"),
      notes: "Socio de demostración.",
    },
  });

  const courts = [
    {
      name: "Pista 1",
      description: "Pista central",
      indoor: true,
      active: true,
      sortOrder: 1,
    },
    {
      name: "Pista 2",
      description: "Pista secundaria",
      indoor: true,
      active: true,
      sortOrder: 2,
    },
    {
      name: "Pista 3",
      description: "Pista de entrenamiento",
      indoor: true,
      active: true,
      sortOrder: 3,
    },
  ];

  for (const court of courts) {
    await prisma.court.upsert({
      where: {
        clubId_name: {
          clubId: club.id,
          name: court.name,
        },
      },
      update: {},
      create: {
        clubId: club.id,
        name: court.name,
        description: court.description,
        indoor: court.indoor,
        active: court.active,
        sortOrder: court.sortOrder,
      },
    });
  }

  const startsAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
  const endsAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 31);
  const registrationDeadline = new Date(Date.now() + 1000 * 60 * 60 * 24 * 20);

  const tournament = await prisma.tournament.upsert({
    where: { slug: "open-demo-2026" },
    update: {},
    create: {
      clubId: club.id,
      name: "Open Demo 2026",
      slug: "open-demo-2026",
      description: "Torneo inicial de demostración",
      location: "Pabellón Demo",
      startsAt,
      endsAt,
      registrationDeadline,
      status: "REGISTRATION_OPEN",
    },
  });

  await prisma.tournamentRegistration.upsert({
    where: {
      tournamentId_memberId_category: {
        tournamentId: tournament.id,
        memberId: member.id,
        category: "INDIVIDUAL_MASCULINO",
      },
    },
    update: {},
    create: {
      tournamentId: tournament.id,
      memberId: member.id,
      category: "INDIVIDUAL_MASCULINO",
      status: "PENDING",
      notes: "Inscripción de demostración.",
    },
  });

  console.log("Seed completado correctamente.");
  console.log({
    clubId: club.id,
    adminEmail,
    adminPassword: "Admin123!",
    socioEmail,
    socioPassword: "Socio123!",
    tournamentId: tournament.id,
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });