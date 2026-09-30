const prisma = require('../src/db');
const { hashPassword } = require('../src/accounts/passwords');
const { ensureDefaultAdmin } = require('../src/accounts/accounts');

async function main() {
  await prisma.session.deleteMany();
  await prisma.participation.deleteMany();
  await prisma.stepProgress.deleteMany();
  await prisma.step.deleteMany();
  await prisma.workshop.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await hashPassword('student123');
  const alice = await prisma.user.create({
    data: { name: 'Alice Martin', email: 'alice.martin@epitech.eu', role: 'student', passwordHash },
  });
  const bilal = await prisma.user.create({
    data: { name: 'Bilal Haddad', email: 'bilal.haddad@epitech.eu', role: 'student', passwordHash },
  });
  await prisma.user.create({
    data: { name: 'Chloe Bernard', email: 'chloe.bernard@epitech.eu', role: 'student', passwordHash },
  });

  const workshop = await prisma.workshop.create({
    data: {
      title: 'Networking Basics',
      description: 'Intro to subnets, routing, and basic diagnostics.',
      steps: {
        create: [
          {
            order: 1,
            title: 'Set up your VM',
            content: 'Boot the provided VM and confirm you can SSH into it.',
            isCheckpoint: false,
          },
          {
            order: 2,
            title: 'Configure a static IP',
            content: 'Assign a static IP to the VM.',
            isCheckpoint: true,
            questionType: 'text',
            questionPrompt: 'Which subnet did you use and why?',
          },
          {
            order: 3,
            title: 'Trace a route',
            content: 'Run traceroute to 8.8.8.8 and note the hop count.',
            isCheckpoint: false,
          },
        ],
      },
    },
  });

  await ensureDefaultAdmin(prisma, process.env.ADMIN_PASSWORD);

  console.log('Seeded workshop', workshop.id, 'with students', alice.id, bilal.id);
}

main().finally(() => prisma.$disconnect());
