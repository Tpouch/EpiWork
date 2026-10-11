const NEW_STEP_TITLE = 'New sub step';

// completeStep unlocks `order + 1`, so step order must stay exactly 1..n.
async function renumberSteps(tx, workshopId) {
  const steps = await tx.step.findMany({ where: { workshopId }, orderBy: { order: 'asc' }, select: { id: true, order: true } });
  for (const [index, step] of steps.entries()) {
    if (step.order !== index + 1) await tx.step.update({ where: { id: step.id }, data: { order: index + 1 } });
  }
}

async function renumberSections(tx, workshopId) {
  const sections = await tx.section.findMany({ where: { workshopId }, orderBy: { order: 'asc' }, select: { id: true, order: true } });
  for (const [index, section] of sections.entries()) {
    if (section.order !== index + 1) await tx.section.update({ where: { id: section.id }, data: { order: index + 1 } });
  }
}

// Right after the last step of this section or of any section before it (unsectioned steps come first).
async function insertPosition(tx, section) {
  const last = await tx.step.findFirst({
    where: {
      workshopId: section.workshopId,
      OR: [{ sectionId: null }, { section: { order: { lte: section.order } } }],
    },
    orderBy: { order: 'desc' },
    select: { order: true },
  });
  return (last?.order ?? 0) + 1;
}

async function insertStep(tx, section, { title = NEW_STEP_TITLE, content = '' } = {}) {
  const order = await insertPosition(tx, section);
  await tx.step.updateMany({
    where: { workshopId: section.workshopId, order: { gte: order } },
    data: { order: { increment: 1 } },
  });
  return tx.step.create({ data: { workshopId: section.workshopId, sectionId: section.id, order, title, content } });
}

async function createSection(prisma, workshopId, title) {
  return prisma.$transaction(async (tx) => {
    const order = (await tx.section.count({ where: { workshopId } })) + 1;
    const section = await tx.section.create({ data: { workshopId, order, title } });
    const step = await insertStep(tx, section);
    return { ...section, steps: [step] };
  });
}

async function createStepInSection(prisma, sectionId, data = {}) {
  return prisma.$transaction(async (tx) => {
    const section = await tx.section.findUniqueOrThrow({ where: { id: sectionId } });
    return insertStep(tx, section, data);
  });
}

async function deleteStep(prisma, stepId) {
  await prisma.$transaction(async (tx) => {
    const step = await tx.step.findUniqueOrThrow({ where: { id: stepId } });
    await tx.stepProgress.deleteMany({ where: { stepId } });
    await tx.step.delete({ where: { id: stepId } });
    await renumberSteps(tx, step.workshopId);
  });
}

async function deleteSection(prisma, sectionId) {
  await prisma.$transaction(async (tx) => {
    const section = await tx.section.findUniqueOrThrow({ where: { id: sectionId } });
    await tx.stepProgress.deleteMany({ where: { step: { sectionId } } });
    await tx.step.deleteMany({ where: { sectionId } });
    await tx.section.delete({ where: { id: sectionId } });
    await renumberSteps(tx, section.workshopId);
    await renumberSections(tx, section.workshopId);
  });
}

module.exports = { createSection, createStepInSection, deleteStep, deleteSection, renumberSteps };
