import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const club = await prisma.club.upsert({
    where: { slug: "club-badminton-demo" },
    update: {},
    create: {
      name: "Club Badminton Demo",
      slug: "club-badminton-demo",
      email: "info@club.local",
      phone: "600 000 000",
      address: "Calle Demo 1",
    },
  });

  console.log("Club creado:", club.name);

  const adminPassword = await hash("Admin123!", 10);
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@club.com" },
    update: {},
    create: {
      email: "admin@club.com",
      fullName: "Administrador",
      passwordHash: adminPassword,
      role: "ADMIN",
      clubId: club.id,
    },
  });

  console.log("Admin creado:", adminUser.email);

  const memberPassword = await hash("Socio123!", 10);
  const memberUser = await prisma.user.upsert({
    where: { email: "socio@club.com" },
    update: {},
    create: {
      email: "socio@club.com",
      fullName: "Socio de Prueba",
      passwordHash: memberPassword,
      role: "MEMBER",
      clubId: club.id,
    },
  });

  const member = await prisma.member.upsert({
    where: {
      clubId_memberCode: {
        clubId: club.id,
        memberCode: "SOC-001",
      },
    },
    update: {},
    create: {
      userId: memberUser.id,
      clubId: club.id,
      memberCode: "SOC-001",
      category: "ADULTO",
      status: "ACTIVE",
      medicalCertificate: true,
      imageAuthorization: true,
    },
  });

  console.log("Socio creado:", member.memberCode);

  for (let i = 1; i <= 3; i++) {
    await prisma.court.upsert({
      where: {
        clubId_name: {
          clubId: club.id,
          name: "Pista " + i,
        }
      },
      update: {},
      create: {
        clubId: club.id,
        name: "Pista " + i,
        description: "Pista interior numero " + i,
        indoor: true,
        active: true,
        sortOrder: i,
      },
    });
  }

  console.log("3 pistas creadas");
  console.log("Seed completado exitosamente");
}

main()
  .catch((e) => {
    console.error("Error en seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });