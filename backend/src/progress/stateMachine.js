async function ensureProgress(prisma, workshopId, studentId) {
  const steps = await prisma.step.findMany({ where: { workshopId }, orderBy: { order: 'asc' } });
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const existing = await prisma.stepProgress.findFirst({ where: { stepId: step.id, studentId } });
    if (!existing) {
      await prisma.stepProgress.create({
        data: { stepId: step.id, studentId, status: i === 0 ? 'available' : 'locked' },
      });
    }
  }
  return prisma.stepProgress.findMany({
    where: { studentId, step: { workshopId } },
    include: { step: true },
    orderBy: { step: { order: 'asc' } },
  });
}

async function completeStep(prisma, progressId, step) {
  await prisma.stepProgress.update({ where: { id: progressId }, data: { status: 'done' } });
  const nextStep = await prisma.step.findFirst({
    where: { workshopId: step.workshopId, order: step.order + 1 },
  });
  if (nextStep) {
    const progress = await prisma.stepProgress.findFirst({ where: { id: progressId } });
    const nextProgress = await prisma.stepProgress.findFirst({
      where: { stepId: nextStep.id, studentId: progress.studentId },
    });
    if (nextProgress) {
      await prisma.stepProgress.update({ where: { id: nextProgress.id }, data: { status: 'available' } });
    } else {
      await prisma.stepProgress.create({
        data: { stepId: nextStep.id, studentId: progress.studentId, status: 'available' },
      });
    }
  }
  return prisma.stepProgress.findUnique({ where: { id: progressId } });
}

async function submitAnswer(prisma, stepId, studentId, answer) {
  const progress = await prisma.stepProgress.findFirst({ where: { stepId, studentId } });
  const step = await prisma.step.findUnique({ where: { id: stepId } });
  if (progress?.status !== 'available') {
    throw new Error('Step is not available for this student');
  }
  if (step.isCheckpoint) {
    return prisma.stepProgress.update({
      where: { id: progress.id },
      data: { status: 'pending_review', submittedAnswer: answer },
    });
  }
  return completeStep(prisma, progress.id, step);
}

async function unlockStep(prisma, stepId, studentId) {
  const progress = await prisma.stepProgress.findFirst({ where: { stepId, studentId } });
  if (progress?.status !== 'pending_review') {
    throw new Error('Step is not pending review');
  }
  const step = await prisma.step.findUnique({ where: { id: stepId } });
  return completeStep(prisma, progress.id, step);
}

async function toggleHelp(prisma, stepId, studentId, helpRequested) {
  const progress = await prisma.stepProgress.findFirst({ where: { stepId, studentId } });
  if (!progress) throw new Error('No progress row for this step/student');
  return prisma.stepProgress.update({ where: { id: progress.id }, data: { helpRequested } });
}

module.exports = { ensureProgress, submitAnswer, unlockStep, toggleHelp };
