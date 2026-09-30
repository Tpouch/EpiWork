const { recordEvent } = require('../sessions/sessionEvents');

function recordStepEvent(prisma, step, studentId, type, answer = null) {
  return recordEvent(prisma, { workshopId: step.workshopId, studentId, stepId: step.id, type, answer });
}

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

async function completeStep(prisma, progress, step, answer = null) {
  await prisma.stepProgress.update({ where: { id: progress.id }, data: { status: 'done' } });
  await recordStepEvent(prisma, step, progress.studentId, 'step_done', answer);
  const nextStep = await prisma.step.findFirst({
    where: { workshopId: step.workshopId, order: step.order + 1 },
  });
  if (nextStep) {
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
  return prisma.stepProgress.findUnique({ where: { id: progress.id } });
}

async function submitAnswer(prisma, stepId, studentId, answer) {
  const progress = await prisma.stepProgress.findFirst({ where: { stepId, studentId } });
  const step = await prisma.step.findUnique({ where: { id: stepId } });
  if (!progress || progress.status !== 'available') {
    throw new Error('Step is not available for this student');
  }
  return prisma.$transaction(async (tx) => {
    if (!step.isCheckpoint) return completeStep(tx, progress, step, answer);
    await recordStepEvent(tx, step, studentId, 'checkpoint_submitted', answer);
    return tx.stepProgress.update({
      where: { id: progress.id },
      data: { status: 'pending_review', submittedAnswer: answer },
    });
  });
}

async function unlockStep(prisma, stepId, studentId) {
  const progress = await prisma.stepProgress.findFirst({ where: { stepId, studentId } });
  if (!progress || progress.status !== 'pending_review') {
    throw new Error('Step is not pending review');
  }
  const step = await prisma.step.findUnique({ where: { id: stepId } });
  return prisma.$transaction((tx) => completeStep(tx, progress, step));
}

async function toggleHelp(prisma, stepId, studentId, helpRequested) {
  const progress = await prisma.stepProgress.findFirst({ where: { stepId, studentId } });
  if (!progress) throw new Error('No progress row for this step/student');
  // A second click on "need help" must not log a second request.
  if (progress.helpRequested === helpRequested) return progress;
  const step = await prisma.step.findUnique({ where: { id: stepId } });
  const [updated] = await prisma.$transaction([
    prisma.stepProgress.update({ where: { id: progress.id }, data: { helpRequested } }),
    recordStepEvent(prisma, step, studentId, helpRequested ? 'help_requested' : 'help_resolved'),
  ]);
  return updated;
}

module.exports = { ensureProgress, submitAnswer, unlockStep, toggleHelp };
