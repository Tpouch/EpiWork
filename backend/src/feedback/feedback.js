const MAX_COMMENT_LENGTH = 1000;

class FeedbackError extends Error {
  constructor(status, message) {
    super(message);
    this.name = 'FeedbackError';
    this.status = status;
  }
}

function parseFeedback({ rating, comment }) {
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new FeedbackError(400, 'Rating must be a whole number from 1 to 5.');
  }
  if (comment != null && typeof comment !== 'string') throw new FeedbackError(400, 'Comment must be text.');
  const trimmed = comment?.trim() ?? '';
  if (trimmed.length > MAX_COMMENT_LENGTH) {
    throw new FeedbackError(400, `Comment must be ${MAX_COMMENT_LENGTH} characters or less.`);
  }
  return { rating, comment: trimmed || null };
}

function findOpenRun(prisma, workshopId) {
  return prisma.workshopRun.findFirst({ where: { workshopId, endedAt: null } });
}

function findFeedback(prisma, runId, studentId) {
  return prisma.feedback.findUnique({
    where: { runId_studentId: { runId, studentId } },
    select: { rating: true, comment: true },
  });
}

function joinedRun(prisma, run, studentId) {
  return prisma.participation.findFirst({
    where: { workshopId: run.workshopId, studentId, joinedAt: { gte: run.launchedAt } },
  });
}

async function getMyFeedback(prisma, workshopId, studentId) {
  const workshop = await prisma.workshop.findUnique({ where: { id: workshopId }, select: { title: true } });
  if (!workshop) throw new FeedbackError(404, 'Workshop not found.');
  const run = await findOpenRun(prisma, workshopId);
  const feedback = run ? await findFeedback(prisma, run.id, studentId) : null;
  // Only offer the stars when submitFeedback would accept them.
  const canRate = Boolean(run && !feedback && (await joinedRun(prisma, run, studentId)));
  return { workshopTitle: workshop.title, canRate, feedback };
}

async function submitFeedback(prisma, workshopId, studentId, input) {
  const { rating, comment } = parseFeedback(input);
  const run = await findOpenRun(prisma, workshopId);
  if (!run) throw new FeedbackError(409, 'This session has ended.');
  if (!(await joinedRun(prisma, run, studentId))) {
    throw new FeedbackError(403, 'Only students who joined this session can rate it.');
  }
  if (await findFeedback(prisma, run.id, studentId)) {
    throw new FeedbackError(409, 'You already rated this session.');
  }
  return prisma.feedback.create({
    data: { runId: run.id, studentId, rating, comment, createdAt: new Date() },
    select: { rating: true, comment: true },
  });
}

module.exports = { FeedbackError, getMyFeedback, submitFeedback };
