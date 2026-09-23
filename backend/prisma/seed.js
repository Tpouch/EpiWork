const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.stepProgress.deleteMany();
  await prisma.step.deleteMany();
  await prisma.workshop.deleteMany();
  await prisma.user.deleteMany();

  await prisma.user.create({ data: { name: 'Admin', role: 'admin' } });
  const alice = await prisma.user.create({ data: { name: 'Alice', role: 'student' } });
  const bilal = await prisma.user.create({ data: { name: 'Bilal', role: 'student' } });
  await prisma.user.create({ data: { name: 'Chloé', role: 'student' } });

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

  console.log('Seeded workshop', workshop.id, 'with students', alice.id, bilal.id);
}

main().finally(() => prisma.$disconnect());
