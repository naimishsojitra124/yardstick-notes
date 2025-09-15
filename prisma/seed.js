const { MemberRole, PlanType } = require("@prisma/client");

async function main() {
  const { PrismaClient } = await import("@prisma/client");
  const bcrypt = require("bcryptjs");
  const prisma = new PrismaClient();
  const hashed = await bcrypt.hash("password", 10);

  // create or upsert tenants
  const acme = await prisma.tenant.upsert({
    where: { slug: "acme" },
    update: {},
    create: {
      slug: "acme",
      name: "Acme",
      plan: PlanType.FREE,
      noteLimit: 3,
    },
  });

  const globex = await prisma.tenant.upsert({
    where: { slug: "globex" },
    update: {},
    create: {
      slug: "globex",
      name: "Globex",
      plan: PlanType.FREE,
      noteLimit: 3,
    },
  });

  // create users
  await prisma.user.upsert({
    where: { email: "admin@acme.test" },
    update: {},
    create: {
      tenantId: acme.id,
      email: "admin@acme.test",
      password: hashed,
      role: MemberRole.ADMIN,
    },
  });

  await prisma.user.upsert({
    where: { email: "user@acme.test" },
    update: {},
    create: {
      tenantId: acme.id,
      email: "user@acme.test",
      password: hashed,
      role: MemberRole.MEMBER,
    },
  });

  await prisma.user.upsert({
    where: { email: "admin@globex.test" },
    update: {},
    create: {
      tenantId: globex.id,
      email: "admin@globex.test",
      password: hashed,
      role: MemberRole.ADMIN,
    },
  });

  await prisma.user.upsert({
    where: { email: "user@globex.test" },
    update: {},
    create: {
      tenantId: globex.id,
      email: "user@globex.test",
      password: hashed,
      role: MemberRole.MEMBER,
    },
  });

  console.log("Seeding finished.");
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
